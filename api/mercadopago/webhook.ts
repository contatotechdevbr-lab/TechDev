import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import { createPaymentClient } from "../_lib/mercadopago.js";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { reconcilePayment, type PaymentRow } from "../_lib/reconcile.js";

/**
 * Webhook de notificações do Mercado Pago.
 *
 * Boas práticas implementadas:
 *  - Validação da assinatura `x-signature` (HMAC SHA256) quando o secret
 *    `MERCADO_PAGO_WEBHOOK_SECRET` está configurado.
 *  - Idempotência: cada notificação (id) é registrada em `webhook_events`;
 *    se já tiver sido processada, é ignorada.
 *  - O status verdadeiro é SEMPRE consultado na API do Mercado Pago, nunca
 *    confiando apenas no corpo recebido.
 *  - Responde 200 rapidamente para evitar reenvios desnecessários.
 */

/** Valida a assinatura x-signature conforme a documentação do Mercado Pago. */
function isValidSignature(req: VercelRequest, dataId: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.log("[v0] MERCADO_PAGO_WEBHOOK_SECRET não definido — pulando validação de assinatura.");
    return true; // não bloqueia, mas registra o aviso
  }

  const xSignature = req.headers["x-signature"] as string | undefined;
  const xRequestId = req.headers["x-request-id"] as string | undefined;
  if (!xSignature) return false;

  // x-signature: "ts=...,v1=..."
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=").map((s) => s.trim()) as [string, string]),
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Conforme a doc do Mercado Pago, o data.id alfanumérico entra em minúsculas no manifest.
  const normalizedId = dataId.toLowerCase();
  const manifest = `id:${normalizedId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const body = req.body ?? {};
    // O Mercado Pago envia os dados na query string (?type=payment&data.id=123)
    // e também no corpo. Priorizamos a query, que é o que entra no manifesto
    // da assinatura, com fallback para o corpo.
    const queryDataId = (req.query["data.id"] ?? req.query["id"]) as string | undefined;
    const queryTopic = (req.query["type"] ?? req.query["topic"]) as string | undefined;
    const topic: string = String(queryTopic ?? body.type ?? body.topic ?? "");
    const dataId: string = String(queryDataId ?? body.data?.id ?? body.resource ?? "");

    // Só tratamos notificações de pagamento
    if (!dataId || (topic && !topic.includes("payment"))) {
      return res.status(200).json({ received: true, ignored: true });
    }

    // Validação de assinatura
    if (!isValidSignature(req, dataId)) {
      console.log("[v0] Assinatura do webhook inválida.");
      return res.status(401).json({ error: "Assinatura inválida." });
    }

    // Idempotência: tenta registrar este evento; se já existe, ignora
    const eventId = `payment:${dataId}`;
    const { error: dupError } = await supabaseAdmin
      .from("webhook_events")
      .insert({ id: eventId, topic: "payment", resource_id: dataId, payload: body });

    if (dupError) {
      // Violação de PK = já processado anteriormente
      if (dupError.code === "23505") {
        return res.status(200).json({ received: true, duplicate: true });
      }
      console.log("[v0] Erro ao registrar webhook_event:", dupError.message);
    }

    // Consulta o pagamento na API do Mercado Pago para obter o external_reference.
    // A notificação traz o ID NUMÉRICO do pagamento; o external_reference (UUID)
    // é o que casa de forma confiável com o registro em `payments`.
    const paymentClient = createPaymentClient();
    const payment = (await paymentClient.get({ id: dataId })) as Record<string, any>;
    const externalReference = String(payment?.external_reference ?? "");

    // Localiza o registro do pagamento: primeiro por external_reference,
    // com fallback para o ID numérico já gravado (mp_payment_id).
    let row: PaymentRow | null = null;
    if (externalReference) {
      const { data } = await supabaseAdmin
        .from("payments")
        .select("id, user_id, plan_id, status, mp_order_id, payer_email")
        .eq("mp_external_reference", externalReference)
        .maybeSingle();
      row = (data as PaymentRow) ?? null;
    }
    if (!row) {
      const { data } = await supabaseAdmin
        .from("payments")
        .select("id, user_id, plan_id, status, mp_order_id, payer_email")
        .eq("mp_payment_id", String(dataId))
        .maybeSingle();
      row = (data as PaymentRow) ?? null;
    }

    if (!row) {
      console.log("[v0] webhook: pagamento não encontrado para", dataId, externalReference);
      await supabaseAdmin.from("webhook_events").update({ status: "not_found" }).eq("id", eventId);
      return res.status(200).json({ received: true, matched: false });
    }

    // Reconcilia pela Orders API (fonte da verdade) usando o mp_order_id do registro.
    const newStatus = await reconcilePayment(row);
    await supabaseAdmin.from("webhook_events").update({ status: newStatus }).eq("id", eventId);

    return res.status(200).json({ received: true, status: newStatus });
  } catch (err: any) {
    console.log("[v0] Erro no webhook MP:", err?.message);
    // Responde 200 para evitar reenvios em loop por erros transitórios já logados
    return res.status(200).json({ received: true, error: true });
  }
}
