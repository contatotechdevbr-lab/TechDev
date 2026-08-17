import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { getAuthedUser } from "../_lib/require-auth.js";
import { rateLimit } from "../_lib/rate-limit.js";
import { cancelPreapprovalViaApi } from "../_lib/mercadopago.js";
import {
  reconcilePayment,
  reconcilePendingForUser,
  reconcileInstallment,
  reconcileInstallmentsForUser,
  type PaymentRow,
  type InstallmentRow,
} from "../_lib/reconcile.js";

/**
 * Consulta/reconcilia o status de pagamento com o Mercado Pago e também
 * cancela a assinatura recorrente do usuário.
 *
 * Serve como fallback confiável para o webhook: o frontend chama este endpoint
 * (polling no checkout e ao abrir o painel do cliente) e o status é buscado
 * diretamente na Orders API, garantindo que "pending" vire "paid" mesmo que a
 * notificação não tenha chegado.
 *
 * Aceita (POST):
 *  - { action: "cancelSubscription" } -> cancela a assinatura do próprio usuário
 *  - { orderId }        -> reconcilia uma Order específica (mp_order_id)
 *  - { installmentId }  -> reconcilia uma cobrança avulsa específica
 *  - { }                -> reconcilia todos os pendentes do usuário
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (rateLimit(req, res, { key: "payment-status", limit: 60, windowMs: 60_000 })) return;

  try {
    // Autenticação obrigatória: só o próprio usuário pode consultar/reconciliar
    // seus pagamentos. O id vem do token, nunca do corpo (evita IDOR).
    const authedUser = await getAuthedUser(req);
    if (!authedUser) {
      return res.status(401).json({ error: "Autenticação necessária." });
    }
    const authUserId = authedUser.id;

    const { orderId, installmentId, action } = req.body ?? {};

    // Cancelamento de assinatura recorrente do PRÓPRIO usuário.
    // Efeito: cancela o preapproval no Mercado Pago (nenhuma cobrança mensal
    // futura no cartão) e marca a assinatura como `canceled` no banco.
    if (action === "cancelSubscription") {
      const { data: sub, error: subErr } = await supabaseAdmin
        .from("subscriptions")
        .select("id, status, mp_preapproval_id")
        .eq("user_id", authUserId)
        .in("status", ["active", "pending", "past_due", "suspended"])
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (subErr) {
        return res.status(500).json({ error: "Não foi possível localizar sua assinatura." });
      }
      if (!sub) {
        return res.status(404).json({ error: "Nenhuma assinatura ativa encontrada para cancelar." });
      }

      if (sub.mp_preapproval_id) {
        const r = await cancelPreapprovalViaApi(sub.mp_preapproval_id);
        // 404 no MP = preapproval já inexistente/cancelado: seguimos e marcamos local.
        if (!r.ok && r.status !== 404) {
          console.log("[v0] Falha ao cancelar preapproval no MP:", r.status, JSON.stringify(r.data));
          return res.status(502).json({ error: "Falha ao cancelar a assinatura no Mercado Pago." });
        }
      }

      const { error: updErr } = await supabaseAdmin
        .from("subscriptions")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .eq("id", sub.id)
        .eq("user_id", authUserId);

      if (updErr) {
        return res.status(500).json({
          error: "Assinatura cancelada no Mercado Pago, mas houve erro ao atualizar o registro.",
        });
      }

      return res.status(200).json({
        canceled: true,
        message: "Assinatura cancelada. Nenhuma cobrança futura será feita no seu cartão.",
      });
    }

    // Reconciliação de uma cobrança avulsa específica (site_installments).
    if (installmentId) {
      const { data: inst } = await supabaseAdmin
        .from("site_installments")
        .select("id, user_id, client_id, description, status, mp_order_id")
        .eq("id", String(installmentId))
        .maybeSingle();

      if (!inst) return res.status(404).json({ error: "Cobrança não encontrada." });
      if (inst.user_id !== authUserId) {
        return res.status(403).json({ error: "Acesso negado." });
      }

      const status = await reconcileInstallment(inst as InstallmentRow);
      return res.status(200).json({ status, paid: status === "paid" });
    }

    if (orderId) {
      const { data: row } = await supabaseAdmin
        .from("payments")
        .select("id, user_id, plan_id, custom_plan_id, status, mp_order_id, payer_email")
        .eq("mp_order_id", String(orderId))
        .maybeSingle();

      if (!row) return res.status(404).json({ error: "Pagamento não encontrado." });
      if (row.user_id !== authUserId) {
        return res.status(403).json({ error: "Acesso negado." });
      }

      const status = await reconcilePayment(row as PaymentRow);
      return res.status(200).json({ status, paid: status === "paid" });
    }

    // Sem orderId/installmentId: reconcilia os pendentes do PRÓPRIO usuário.
    const result = await reconcilePendingForUser(authUserId);
    const installments = await reconcileInstallmentsForUser(authUserId);
    return res.status(200).json({ ...result, installments });
  } catch (err: any) {
    console.log("[v0] Erro em payment-status:", err?.message);
    return res.status(500).json({ error: "Não foi possível consultar o status do pagamento." });
  }
}
