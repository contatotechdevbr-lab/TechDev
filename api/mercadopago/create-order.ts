import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { createOrderClient, isSandbox } from "../_lib/mercadopago.js";
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
    const orderBody = {
      type: "online" as const,
      total_amount: amount,
      external_reference: externalReference,
      processing_mode: "automatic" as const,
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
    };

    // Log do payload (mascara dados sensíveis: e-mail, CPF e token do cartão)
    const safeBody = JSON.parse(JSON.stringify(orderBody)) as Record<string, any>;
    if (safeBody?.payer?.email) safeBody.payer.email = "***@***";
    if (safeBody?.payer?.identification?.number) safeBody.payer.identification.number = "***";
    const safePaymentMethod = safeBody?.transactions?.payments?.[0]?.payment_method;
    if (safePaymentMethod?.token) safePaymentMethod.token = "***";
    console.log("[v0] MP create-order payload:", JSON.stringify(safeBody));
    console.log("[v0] MP sandbox mode:", isSandbox());

    const orderClient = createOrderClient();
    const order = await orderClient.create({
      body: orderBody,
      requestOptions: { idempotencyKey: externalReference },
    });

    console.log("[v0] MP create-order OK. status:", (order as any)?.status, "id:", (order as any)?.id);

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
    // O SDK do Mercado Pago anexa o status HTTP e o corpo de erro da API.
    // Os nomes variam entre versões, então tentamos todas as variações conhecidas.
    const httpStatus =
      err?.statusCode ?? err?.status ?? err?.cause?.statusCode ?? err?.response?.status ?? null;

    // Corpo de erro real da Orders API (pode vir em cause, cause.error, response.data...)
    const apiError =
      err?.cause?.error ??
      err?.cause ??
      err?.response?.data ??
      err?.error ??
      null;

    // A Orders API costuma detalhar a validação num array de "errors"/"cause"
    const validationDetails =
      apiError?.errors ?? apiError?.cause ?? err?.cause?.errors ?? null;

    console.log("[v0] === ERRO Orders API Mercado Pago ===");
    console.log("[v0] mensagem da exceção:", err?.message ?? "(sem mensagem)");
    console.log("[v0] status HTTP do Mercado Pago:", httpStatus ?? "(desconhecido)");
    console.log("[v0] corpo completo do erro:", JSON.stringify(apiError, null, 2));
    if (validationDetails) {
      console.log("[v0] detalhes de validação:", JSON.stringify(validationDetails, null, 2));
    }

    // Mensagem legível extraída do corpo da API, quando disponível
    const apiMessage =
      apiError?.message ??
      (Array.isArray(validationDetails) && validationDetails[0]?.description) ??
      (Array.isArray(validationDetails) && validationDetails[0]?.message) ??
      err?.message ??
      "erro desconhecido";

    return res.status(500).json({
      error: "Não foi possível processar o pagamento.",
      detail: apiMessage,
      // Diagnóstico detalhado — exibido no frontend apenas em desenvolvimento/sandbox
      debug: {
        httpStatus,
        message: err?.message ?? null,
        apiError,
        validationDetails,
      },
    });
  }
}
