import type { VercelRequest, VercelResponse } from "@vercel/node";
import { cancelPreapprovalViaApi, isSandbox } from "../_lib/mercadopago.js";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { getAuthedUser } from "../_lib/require-auth.js";
import { rateLimit } from "../_lib/rate-limit.js";

/**
 * Cancela a assinatura recorrente (Preapproval) do usuário autenticado.
 *
 * Segurança:
 *  - Exige token de sessão válido (getAuthedUser) — a identidade vem do token,
 *    nunca de um `userId` enviado pelo cliente (evita IDOR).
 *  - A assinatura cancelada é SEMPRE a do próprio usuário (filtro por user_id).
 *
 * Efeito:
 *  - Chama o Mercado Pago para cancelar o preapproval → nenhuma cobrança mensal
 *    futura será feita no cartão do cliente.
 *  - Marca a assinatura como `canceled` no banco (com `canceled_at`).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (rateLimit(req, res, { key: "cancel-subscription", limit: 10, windowMs: 60_000 })) return;

  try {
    const authedUser = await getAuthedUser(req);
    if (!authedUser) {
      return res.status(401).json({ error: "Autenticação necessária." });
    }
    const userId = authedUser.id;

    // Busca a assinatura recorrente ativa/pendente do próprio usuário.
    const { data: sub, error: subErr } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status, mp_preapproval_id")
      .eq("user_id", userId)
      .in("status", ["active", "pending", "past_due", "paused", "suspended"])
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (subErr) {
      return res.status(500).json({ error: "Não foi possível localizar sua assinatura." });
    }
    if (!sub) {
      return res.status(404).json({ error: "Nenhuma assinatura ativa encontrada para cancelar." });
    }

    // Cancela no Mercado Pago (se houver preapproval vinculado).
    if (sub.mp_preapproval_id) {
      const r = await cancelPreapprovalViaApi(sub.mp_preapproval_id);
      // 404 no MP = preapproval já inexistente/cancelado: seguimos e marcamos local.
      if (!r.ok && r.status !== 404) {
        const err: any = new Error(r.data?.message || "Falha ao cancelar a assinatura no Mercado Pago.");
        err.statusCode = r.status;
        err.cause = r.data;
        throw err;
      }
    }

    // Marca como cancelada no banco.
    const { error: updErr } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("id", sub.id)
      .eq("user_id", userId);

    if (updErr) {
      return res.status(500).json({ error: "Assinatura cancelada no Mercado Pago, mas houve erro ao atualizar o registro." });
    }

    return res.status(200).json({
      canceled: true,
      message: "Assinatura cancelada. Nenhuma cobrança futura será feita no seu cartão.",
    });
  } catch (err: any) {
    const httpStatus = err?.statusCode ?? err?.status ?? null;
    const apiError = err?.cause ?? null;
    console.log("[v0] === ERRO cancelar assinatura ===");
    console.log("[v0] mensagem:", err?.message ?? "(sem mensagem)");
    console.log("[v0] status HTTP:", httpStatus ?? "(desconhecido)");
    console.log("[v0] corpo de erro:", JSON.stringify(apiError, null, 2));

    return res.status(500).json({
      error: "Não foi possível cancelar a assinatura.",
      detail: isSandbox() ? err?.message ?? "erro" : "Tente novamente em instantes.",
    });
  }
}
