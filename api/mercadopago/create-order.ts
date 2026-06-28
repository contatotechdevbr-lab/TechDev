import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { createOrderClient } from "../_lib/mercadopago.js";
import { supabaseAdmin } from "../_lib/supabase-admin.js";

/**
 * Cria uma Order no Mercado Pago (Checkout Transparente / Orders API).
 *
 * Suporta dois métodos:
 *  - PIX  (type: "bank_transfer") -> retorna QR Code e copia-e-cola
 *  - Cartão (type: "credit_card") -> usa o token gerado no frontend
 *
 * O Access Token nunca sai do servidor. O valor cobrado é SEMPRE recalculado
 * a partir do preço do plano no banco, nunca confiando no valor do cliente.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const {
      planId,
      userId,
      method, // "pix" | "card"
      payer,
      card, // { token, installments, paymentMethodId } quando method === "card"
    } = req.body ?? {};

    if (!planId || !method || !payer?.email) {
      return res.status(400).json({ error: "Dados incompletos para criar o pagamento." });
    }

    // 1) Busca o plano no banco para obter o valor REAL (nunca confiar no cliente)
    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("id, name, price_cents")
      .eq("id", planId)
      .eq("active", true)
      .maybeSingle();

    if (planError || !plan) {
      return res.status(404).json({ error: "Plano não encontrado ou inativo." });
    }

    const amount = (plan.price_cents / 100).toFixed(2);
    const externalReference = randomUUID();

    // 2) Monta o payment method conforme o tipo escolhido
    const paymentMethod =
      method === "pix"
        ? { id: "pix", type: "bank_transfer" as const }
        : {
            id: card?.paymentMethodId,
            type: "credit_card" as const,
            token: card?.token,
            installments: card?.installments ?? 1,
          };

    if (method === "card" && (!card?.token || !card?.paymentMethodId)) {
      return res.status(400).json({ error: "Dados do cartão ausentes." });
    }

    // 3) Cria a Order no Mercado Pago (com chave de idempotência)
    const orderClient = createOrderClient();
    const order = await orderClient.create({
      body: {
        type: "online",
        total_amount: amount,
        external_reference: externalReference,
        processing_mode: "automatic",
        payer: {
          email: payer.email,
          first_name: payer.firstName,
          last_name: payer.lastName,
          identification: payer.identification, // { type: "CPF", number }
        },
        transactions: {
          payments: [
            {
              amount,
              payment_method: paymentMethod,
            },
          ],
        },
      },
      requestOptions: { idempotencyKey: externalReference },
    });

    const orderAny = order as Record<string, any>;
    const payment = orderAny?.transactions?.payments?.[0] ?? {};
    const orderStatus: string = orderAny?.status ?? "pending";

    // 4) Registra o pagamento pendente no Supabase
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: userId ?? null,
      plan_id: plan.id,
      amount_cents: plan.price_cents,
      installments: method === "card" ? card?.installments ?? 1 : 1,
      status: "pending",
      payment_method: method,
      payer_email: payer.email,
      mp_order_id: String(orderAny?.id ?? ""),
      mp_payment_id: payment?.id ? String(payment.id) : null,
    });

    if (insertError) {
      console.log("[v0] Erro ao registrar pagamento:", insertError.message);
    }

    // 5) Extrai dados úteis para o frontend (QR Code do PIX, etc.)
    const pix =
      payment?.payment_method?.type === "bank_transfer"
        ? {
            qrCode: payment?.payment_method?.qr_code,
            qrCodeBase64: payment?.payment_method?.qr_code_base64,
            ticketUrl: payment?.payment_method?.ticket_url,
          }
        : null;

    return res.status(200).json({
      orderId: orderAny?.id,
      status: orderStatus,
      externalReference,
      pix,
    });
  } catch (err: any) {
    console.log("[v0] Erro ao criar Order MP:", err?.message, err?.cause ?? "");
    return res.status(500).json({
      error: "Não foi possível processar o pagamento.",
      detail: err?.message ?? "erro desconhecido",
    });
  }
}
