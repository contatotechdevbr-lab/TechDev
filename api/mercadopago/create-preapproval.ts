import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { createPreapprovalViaApi, isSandbox } from "../_lib/mercadopago.js";
import { supabaseAdmin } from "../_lib/supabase-admin.js";

/**
 * Cria uma assinatura RECORRENTE (Preapproval) no Mercado Pago.
 *
 * Fluxo "parcelado (recorrência)": somente cartão de crédito, com 12 cobranças
 * mensais automáticas. Não usa PIX. O cliente é redirecionado ao `init_point`
 * do Mercado Pago para autorizar o cartão; as cobranças mensais são feitas
 * automaticamente pela engine de assinaturas do MP.
 *
 * O valor mensal é SEMPRE lido do plano no banco (nunca confiando no cliente).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const { planId, userId, payer } = req.body ?? {};

    if (!planId || !payer?.email) {
      return res.status(400).json({ error: "Dados incompletos para criar a assinatura." });
    }

    // 1) Busca o plano (valor real + se aceita recorrência).
    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("id, name, price_cents, allow_recurring")
      .eq("id", planId)
      .eq("active", true)
      .maybeSingle();

    if (planError || !plan) {
      return res.status(404).json({ error: "Plano não encontrado ou inativo." });
    }
    if (plan.allow_recurring === false) {
      return res.status(400).json({ error: "Este plano não aceita pagamento recorrente." });
    }

    const monthly = Number((plan.price_cents / 100).toFixed(2));
    const externalReference = randomUUID();

    // Base do site para o back_url (precisa ser a RAIZ do domínio).
    const origin =
      (req.headers["origin"] as string | undefined) ??
      process.env.PUBLIC_SITE_URL ??
      "https://www.techdev.website";
    const backUrl = new URL(origin).origin;

    // 12 cobranças mensais => end_date de +12 meses.
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12);

    const body = {
      reason: `Assinatura ${plan.name} - TechDev`,
      external_reference: externalReference,
      payer_email: payer.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        end_date: endDate.toISOString(),
        transaction_amount: monthly,
        currency_id: "BRL",
      },
      back_url: backUrl,
      status: "pending",
    };

    console.log("[v0] MP create-preapproval:", plan.name, "R$", monthly, "/mês");

    const r = await createPreapprovalViaApi({ body, idempotencyKey: externalReference });
    if (!r.ok) {
      const err: any = new Error(r.data?.message || "Falha ao criar a assinatura no Mercado Pago.");
      err.statusCode = r.status;
      err.cause = r.data;
      throw err;
    }

    const preapproval: any = r.data;
    const initPoint: string | null = preapproval?.init_point ?? null;

    // 2) Registra a assinatura recorrente (pendente até o cliente autorizar).
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId ?? "")
      .maybeSingle();

    const subData = {
      user_id: userId ?? null,
      plan_id: plan.id,
      status: "pending",
      billing_type: "recurring",
      mp_preapproval_id: String(preapproval?.id ?? ""),
      mp_external_reference: externalReference,
      current_period_end: periodEnd.toISOString(),
      canceled_at: null,
    };

    if (existingSub) {
      await supabaseAdmin.from("subscriptions").update(subData).eq("id", existingSub.id);
    } else {
      await supabaseAdmin.from("subscriptions").insert(subData);
    }

    // 3) Registra um pagamento inicial pendente (aparece no financeiro/relatórios).
    const { error: payErr } = await supabaseAdmin.from("payments").insert({
      user_id: userId ?? null,
      plan_id: plan.id,
      amount_cents: plan.price_cents,
      installments: 1,
      status: "pending",
      payment_method: "card",
      billing_type: "recurring",
      payer_email: payer.email,
      mp_external_reference: externalReference,
    });
    if (payErr) console.log("[v0] create-preapproval: erro ao registrar payment:", payErr.message);

    return res.status(200).json({
      preapprovalId: preapproval?.id,
      status: preapproval?.status,
      externalReference,
      initPoint,
    });
  } catch (err: any) {
    const httpStatus = err?.statusCode ?? err?.status ?? null;
    const apiError = err?.cause ?? err?.error ?? null;
    console.log("[v0] === ERRO Preapproval Mercado Pago ===");
    console.log("[v0] mensagem:", err?.message ?? "(sem mensagem)");
    console.log("[v0] status HTTP:", httpStatus ?? "(desconhecido)");
    console.log("[v0] corpo de erro:", JSON.stringify(apiError, null, 2));

    return res.status(500).json({
      error: "Não foi possível criar a assinatura recorrente.",
      detail: isSandbox() ? err?.message ?? "erro" : "Tente novamente ou utilize o pagamento à vista.",
      ...(isSandbox() ? { debug: { httpStatus, message: err?.message, apiError } } : {}),
    });
  }
}
