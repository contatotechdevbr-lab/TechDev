import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { reconcilePayment, reconcilePendingForUser, type PaymentRow } from "../_lib/reconcile.js";

/**
 * Consulta/reconcilia o status de pagamento com o Mercado Pago.
 *
 * Serve como fallback confiável para o webhook: o frontend chama este endpoint
 * (polling no checkout e ao abrir o painel do cliente) e o status é buscado
 * diretamente na Orders API, garantindo que "pending" vire "paid" mesmo que a
 * notificação não tenha chegado.
 *
 * Aceita (POST):
 *  - { orderId }  -> reconcilia uma Order específica (mp_order_id)
 *  - { userId }   -> reconcilia todos os pagamentos pendentes do usuário
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const { orderId, userId } = req.body ?? {};

    if (orderId) {
      const { data: row } = await supabaseAdmin
        .from("payments")
        .select("id, user_id, plan_id, status, mp_order_id, payer_email")
        .eq("mp_order_id", String(orderId))
        .maybeSingle();

      if (!row) return res.status(404).json({ error: "Pagamento não encontrado." });

      const status = await reconcilePayment(row as PaymentRow);
      return res.status(200).json({ status, paid: status === "paid" });
    }

    if (userId) {
      const result = await reconcilePendingForUser(String(userId));
      return res.status(200).json({ ...result });
    }

    return res.status(400).json({ error: "Informe orderId ou userId." });
  } catch (err: any) {
    console.log("[v0] Erro em payment-status:", err?.message);
    return res.status(500).json({ error: "Não foi possível consultar o status do pagamento." });
  }
}
