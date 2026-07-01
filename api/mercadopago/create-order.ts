import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { createOrderViaApi, isSandbox } from "../_lib/mercadopago.js";
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
      deviceId, // Device ID gerado pelo MercadoPago.js V2 no frontend
      address, // { city, state, zipCode } informado na contratação
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

    // 1.1) Busca a data REAL de cadastro do usuário (nunca usar valor fictício).
    // É enviada em additional_info.payer.registration_date para análise antifraude.
    let registrationDate: string | null = null;
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("created_at")
        .eq("id", userId)
        .maybeSingle();
      if (profile?.created_at) {
        // Formato ISO 8601 conforme documentação do Mercado Pago.
        registrationDate = new Date(profile.created_at).toISOString();
      }
    }

    // Monta os campos de qualidade conforme a Orders API (/v1/orders):
    //  - Data de cadastro: additional_info usa a CHAVE PLANA "payer.registration_date"
    //    (objeto aninhado payer.registration_date é recusado pela Orders API).
    //  - Endereço de entrega: objeto tipado shipment.address { city, state, zip_code }
    //    (additional_info.shipments.receivers_address do padrão antigo é recusado).
    const additionalInfo: Record<string, any> = {};
    if (registrationDate) {
      additionalInfo["payer.registration_date"] = registrationDate;
    }

    const zip = address?.zipCode ? String(address.zipCode).replace(/\D/g, "") : "";
    const shipment =
      address?.city && address?.state && zip
        ? {
            address: {
              city: String(address.city).trim(),
              state: String(address.state).trim(),
              zip_code: zip,
            },
          }
        : null;

    // Texto exibido na fatura do cartão do comprador (máx. 13 caracteres visíveis).
    const STATEMENT_DESCRIPTOR = "TECHDEV";

    // 2) Monta o payment method conforme o tipo escolhido
    const paymentMethod =
      method === "pix"
        ? {
            id: "pix",
            type: "bank_transfer" as const,
            statement_descriptor: STATEMENT_DESCRIPTOR,
          }
        : {
            id: card?.paymentMethodId,
            type: "credit_card" as const,
            token: card?.token,
            installments: card?.installments ?? 1,
            statement_descriptor: STATEMENT_DESCRIPTOR,
          };

    if (method === "card" && (!card?.token || !card?.paymentMethodId)) {
      return res.status(400).json({ error: "Dados do cartão ausentes." });
    }

    // 3) Cria a Order no Mercado Pago (com chave de idempotência)
    // OBS: a Orders API (/v1/orders) NÃO aceita o campo "notification_url" no corpo
    // (retorna 400 "unsupported_properties"). A URL de webhook deve ser configurada
    // no painel do Mercado Pago (Suas integrações > Webhooks). A confirmação do
    // pagamento é garantida de qualquer forma pela reconciliação via Orders API
    // (endpoint payment-status + polling no checkout e no painel do cliente).
    const orderBody = {
      type: "online" as const,
      total_amount: amount,
      external_reference: externalReference,
      processing_mode: "automatic" as const,
      description: `Assinatura ${plan.name} - TechDev`,
      payer: {
        email: payer.email,
        first_name: payer.firstName,
        last_name: payer.lastName,
        identification: payer.identification, // { type: "CPF", number }
      },
      // Itens do pedido: cada item com unit_price (preço unitário) e quantity.
      items: [
        {
          title: plan.name,
          unit_price: amount, // valor por unidade (string decimal), igual ao plano
          quantity: 1,
          category_id: "services",
          description: `Assinatura ${plan.name} - TechDev`,
        },
      ],
      transactions: {
        payments: [
          {
            amount,
            payment_method: paymentMethod,
          },
        ],
      },
      // Informações de qualidade/antifraude:
      //  - additional_info: data de cadastro do pagador (chave plana).
      //  - shipment: endereço informado na contratação.
      ...(Object.keys(additionalInfo).length > 0 ? { additional_info: additionalInfo } : {}),
      ...(shipment ? { shipment } : {}),
    };

    // Log do payload (mascara dados sensíveis: e-mail, CPF e token do cartão)
    const safeBody = JSON.parse(JSON.stringify(orderBody)) as Record<string, any>;
    if (safeBody?.payer?.email) safeBody.payer.email = "***@***";
    if (safeBody?.payer?.identification?.number) safeBody.payer.identification.number = "***";
    const safePaymentMethod = safeBody?.transactions?.payments?.[0]?.payment_method;
    if (safePaymentMethod?.token) safePaymentMethod.token = "***";
    console.log("[v0] MP create-order payload:", JSON.stringify(safeBody));
    console.log("[v0] MP create-order: deviceId presente:", Boolean(deviceId));

    // Cria a Order via REST /v1/orders, enviando o Device ID no header
    // X-meli-session-id e o X-Idempotency-Key. Em caso de erro HTTP, lança uma
    // exceção que carrega statusCode e cause (lida pelo catch principal).
    const r = await createOrderViaApi({
      body: orderBody,
      idempotencyKey: externalReference,
      deviceId,
    });
    if (!r.ok) {
      const err: any = new Error(r.data?.message || "Falha ao criar a Order no Mercado Pago.");
      err.statusCode = r.status;
      err.cause = r.data;
      throw err;
    }
    const order: any = r.data;

    console.log("[v0] MP create-order OK. status:", order?.status, "id:", order?.id);

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
      mp_external_reference: externalReference,
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

    // Serializa o erro INTEIRO, incluindo propriedades não-enumeráveis (Error.message, etc.)
    let fullError: Record<string, any> = {};
    try {
      if (err && typeof err === "object") {
        for (const key of Object.getOwnPropertyNames(err)) {
          fullError[key] = (err as any)[key];
        }
      } else {
        fullError = { value: String(err) };
      }
    } catch {
      fullError = { unserializable: String(err) };
    }

    console.log("[v0] === ERRO Orders API Mercado Pago ===");
    console.log("[v0] mensagem da exceção:", err?.message ?? "(sem mensagem)");
    console.log("[v0] status HTTP do Mercado Pago:", httpStatus ?? "(desconhecido)");
    console.log("[v0] erro completo (todas as props):", JSON.stringify(fullError, null, 2));
    console.log("[v0] corpo de erro da API:", JSON.stringify(apiError, null, 2));
    if (validationDetails) {
      console.log("[v0] detalhes de validação:", JSON.stringify(validationDetails, null, 2));
    }

    // Mensagem legível — usa || para não tratar string vazia/false como válido
    const firstDetail = Array.isArray(validationDetails) ? validationDetails[0] : null;
    const apiMessage =
      apiError?.message ||
      firstDetail?.description ||
      firstDetail?.message ||
      err?.message ||
      JSON.stringify(fullError) ||
      "erro desconhecido";

    // Em PRODUÇÃO não expomos detalhes internos ao cliente (segurança):
    // o diagnóstico completo fica apenas nos logs do servidor (acima).
    // O bloco `debug` só é retornado quando as credenciais são de teste.
    return res.status(500).json({
      error: "Não foi possível processar o pagamento.",
      detail: isSandbox() ? apiMessage : "Tente novamente ou utilize outro meio de pagamento.",
      ...(isSandbox()
        ? {
            debug: {
              httpStatus,
              message: err?.message ?? null,
              apiError,
              validationDetails,
              fullError,
            },
          }
        : {}),
    });
  }
}
