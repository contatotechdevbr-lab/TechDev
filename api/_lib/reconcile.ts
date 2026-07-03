import { getAccessToken, fetchPreapproval } from "./mercadopago.js";
import { supabaseAdmin } from "./supabase-admin.js";

/**
 * Reconciliação de pagamentos com o Mercado Pago (Orders API).
 *
 * Por que existe: o webhook pode não chegar (URL não configurada, rede, etc.).
 * Esta lib é a FONTE DA VERDADE: consulta o status real da Order no Mercado
 * Pago a partir do `mp_order_id` (que gravamos de forma confiável) e atualiza o
 * banco (payments + subscriptions + clients + notifications).
 *
 * É usada tanto pelo webhook quanto pelo endpoint de polling (payment-status).
 */

export type PaymentRow = {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  status: string;
  mp_order_id: string | null;
  payer_email: string | null;
};

/** Mapeia o status da Order (Orders API) para o enum payment_status do banco. */
function mapOrderStatus(orderStatus: string, statusDetail?: string): string {
  const s = (orderStatus || "").toLowerCase();
  const d = (statusDetail || "").toLowerCase();
  // Orders API: pagamento aprovado => status "processed" + status_detail "accredited".
  if (s === "processed") {
    if (d === "refunded" || d === "partially_refunded") return "refunded";
    return "paid";
  }
  if (s === "refunded") return "refunded";
  if (s === "canceled" || s === "cancelled") return "canceled";
  if (s === "rejected" || s === "failed") return "failed";
  // "pending", "action_required", "at_terminal", "in_process"...
  return "pending";
}

/** Consulta a Order no Mercado Pago e devolve o status mapeado. */
export async function fetchOrderStatus(
  mpOrderId: string,
): Promise<{ mapped: string; orderStatus: string; statusDetail: string; paymentId: string | null } | null> {
  const resp = await fetch(`https://api.mercadopago.com/v1/orders/${mpOrderId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!resp.ok) {
    console.log("[v0] reconcile: GET order falhou", mpOrderId, resp.status);
    return null;
  }
  const order = (await resp.json().catch(() => ({}))) as Record<string, any>;
  const orderStatus: string = order?.status ?? "pending";
  const statusDetail: string = order?.status_detail ?? "";
  const payment = order?.transactions?.payments?.[0] ?? {};
  return {
    mapped: mapOrderStatus(orderStatus, statusDetail),
    orderStatus,
    statusDetail,
    paymentId: payment?.id ? String(payment.id) : null,
  };
}

/**
 * Reconcilia UM pagamento (linha de `payments`) com o Mercado Pago.
 * Retorna o novo status. Idempotente: se já estiver "paid", não repete efeitos.
 */
export async function reconcilePayment(row: PaymentRow): Promise<string> {
  if (!row.mp_order_id) return row.status;

  // Se já está pago, não há o que reconciliar.
  if (row.status === "paid") return "paid";

  const info = await fetchOrderStatus(row.mp_order_id);
  if (!info) return row.status;

  const newStatus = info.mapped;
  if (newStatus === row.status) return row.status;

  // Atualiza o pagamento.
  const { error: upErr } = await supabaseAdmin
    .from("payments")
    .update({
      status: newStatus,
      ...(info.paymentId ? { mp_payment_id: info.paymentId } : {}),
      paid_at: newStatus === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", row.id);
  if (upErr) console.log("[v0] reconcile: erro ao atualizar payment:", upErr.message);

  // Efeitos colaterais só quando vira "paid".
  if (newStatus === "paid" && row.user_id && row.plan_id) {
    await applyPaidSideEffects(row.user_id, row.plan_id, row.payer_email);
  }

  return newStatus;
}

/** Ativa assinatura, atualiza o cadastro do cliente e notifica o admin. */
export async function applyPaidSideEffects(
  userId: string,
  planId: string,
  payerEmail: string | null,
): Promise<void> {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("name, price_cents")
    .eq("id", planId)
    .maybeSingle();

  const { data: existingSub } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingSub) {
    await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_id: planId,
        status: "active",
        current_period_end: periodEnd.toISOString(),
        canceled_at: null,
      })
      .eq("id", existingSub.id);
  } else {
    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      plan_id: planId,
      status: "active",
      current_period_end: periodEnd.toISOString(),
    });
  }

  // Reflete o plano assinado no cadastro do cliente (Painel CEO).
  const { error: clientErr } = await supabaseAdmin
    .from("clients")
    .update({
      status: "ativo",
      plano: plan?.name ?? null,
      valor_mensal_cents: plan?.price_cents ?? null,
      next_payment: periodEnd.toISOString().slice(0, 10),
    })
    .eq("user_id", userId);
  if (clientErr) console.log("[v0] reconcile: erro ao atualizar cliente:", clientErr.message);

  // Notifica o admin (evita duplicar se já houver assinatura ativa é aceitável).
  await supabaseAdmin.from("notifications").insert({
    type: "pagamento",
    title: "Nova assinatura ativada",
    description: `${payerEmail ?? "Um cliente"} assinou o plano ${plan?.name ?? ""}.`.trim(),
  });
}

/**
 * Reconcilia uma assinatura RECORRENTE (preapproval) com o Mercado Pago.
 *
 * Consulta o status real do preapproval e reflete na assinatura + no cadastro
 * do cliente. Quando "authorized", a assinatura fica ativa e o primeiro
 * pagamento é marcado como pago (as cobranças mensais seguem automáticas).
 */
export async function reconcilePreapproval(preapprovalId: string): Promise<string> {
  const { ok, data: pre } = await fetchPreapproval(preapprovalId);
  if (!ok) {
    console.log("[v0] reconcile preapproval: GET falhou", preapprovalId);
    return "pending";
  }

  const mpStatus: string = pre?.status ?? "pending"; // pending | authorized | paused | cancelled
  const externalRef: string = pre?.external_reference ?? "";

  // Localiza a assinatura pelo preapproval id (ou external_reference).
  let sub: any = null;
  {
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, plan_id, status")
      .eq("mp_preapproval_id", preapprovalId)
      .maybeSingle();
    sub = data;
  }
  if (!sub && externalRef) {
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, plan_id, status")
      .eq("mp_external_reference", externalRef)
      .maybeSingle();
    sub = data;
  }
  if (!sub) {
    console.log("[v0] reconcile preapproval: assinatura não encontrada", preapprovalId);
    return mpStatus;
  }

  // Mapeia o status do MP para o status interno da assinatura.
  const subStatus =
    mpStatus === "authorized"
      ? "active"
      : mpStatus === "paused"
      ? "paused"
      : mpStatus === "cancelled"
      ? "canceled"
      : "pending";

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: subStatus,
      current_period_end: periodEnd.toISOString(),
      ...(subStatus === "canceled" ? { canceled_at: new Date().toISOString() } : { canceled_at: null }),
    })
    .eq("id", sub.id);

  if (subStatus === "active" && sub.user_id && sub.plan_id) {
    // Marca o pagamento recorrente inicial como pago (para financeiro/relatórios).
    if (externalRef) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("mp_external_reference", externalRef)
        .eq("status", "pending");
    }
    await applyPaidSideEffects(sub.user_id, sub.plan_id, pre?.payer_email ?? null);
  }

  return subStatus;
}

export type InstallmentRow = {
  id: string;
  user_id: string | null;
  client_id: string | null;
  description: string | null;
  status: string;
  mp_order_id: string | null;
};

/**
 * Reconcilia UMA cobrança/parcela manual (`site_installments`) com o Mercado Pago.
 * Quando confirmada, marca como paga e registra um evento na timeline do cliente.
 * Idempotente: se já estiver "paid", não repete efeitos.
 */
export async function reconcileInstallment(row: InstallmentRow): Promise<string> {
  if (!row.mp_order_id) return row.status;
  if (row.status === "paid") return "paid";

  const info = await fetchOrderStatus(row.mp_order_id);
  if (!info) return row.status;

  const newStatus = info.mapped;
  if (newStatus === row.status) return row.status;

  const { error: upErr } = await supabaseAdmin
    .from("site_installments")
    .update({
      status: newStatus,
      paid_at: newStatus === "paid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (upErr) console.log("[v0] reconcile installment: erro ao atualizar:", upErr.message);

  // Efeitos ao confirmar o pagamento: timeline + notificação ao admin.
  if (newStatus === "paid" && row.client_id && row.user_id) {
    await supabaseAdmin.from("site_timeline").insert({
      client_id: row.client_id,
      user_id: row.user_id,
      title: "Pagamento confirmado",
      description: `Cobrança "${row.description ?? "cobrança"}" paga com sucesso.`,
      event_date: new Date().toISOString(),
    });
    await supabaseAdmin.from("notifications").insert({
      type: "pagamento",
      title: "Cobrança paga",
      description: `Uma cobrança avulsa foi paga: ${row.description ?? ""}.`.trim(),
    });
  }

  return newStatus;
}

/** Reconcilia uma cobrança pelo external_reference (usado pelo webhook). */
export async function reconcileInstallmentByExternalRef(externalRef: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("site_installments")
    .select("id, user_id, client_id, description, status, mp_order_id")
    .eq("mp_external_reference", externalRef)
    .maybeSingle();
  if (!data) return null;
  return reconcileInstallment(data as InstallmentRow);
}

/** Reconcilia todas as cobranças pendentes de um usuário. Retorna quantas viraram "paid". */
export async function reconcileInstallmentsForUser(userId: string): Promise<{ checked: number; paid: number }> {
  const { data: rows } = await supabaseAdmin
    .from("site_installments")
    .select("id, user_id, client_id, description, status, mp_order_id")
    .eq("user_id", userId)
    .in("status", ["pending", "processing"])
    .not("mp_order_id", "is", null);

  let paid = 0;
  const list = (rows as InstallmentRow[]) ?? [];
  for (const row of list) {
    const status = await reconcileInstallment(row);
    if (status === "paid") paid++;
  }
  return { checked: list.length, paid };
}

/** Reconcilia todos os pagamentos pendentes de um usuário. Retorna quantos viraram "paid". */
export async function reconcilePendingForUser(userId: string): Promise<{ checked: number; paid: number }> {
  const { data: rows } = await supabaseAdmin
    .from("payments")
    .select("id, user_id, plan_id, status, mp_order_id, payer_email")
    .eq("user_id", userId)
    .eq("status", "pending")
    .not("mp_order_id", "is", null);

  let paid = 0;
  const list = (rows as PaymentRow[]) ?? [];
  for (const row of list) {
    const status = await reconcilePayment(row);
    if (status === "paid") paid++;
  }
  return { checked: list.length, paid };
}
