import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { createOrderViaApi, isSandbox } from "../_lib/mercadopago.js";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { getAuthedUser } from "../_lib/require-auth.js";
import { rateLimit } from "../_lib/rate-limit.js";

/**
 * Cria uma Order no Mercado Pago para pagar uma COBRANÇA/PARCELA manual
 * (tabela `site_installments`) criada pelo admin.
 *
 * Suporta PIX (bank_transfer) e cartão (credit_card, à vista).
 * O valor é SEMPRE lido do banco (server-side), nunca do cliente.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (rateLimit(req, res, { key: "pay-installment", limit: 15, windowMs: 60_000 })) return;

  try {
    const authedUser = await getAuthedUser(req);
    if (!authedUser) {
      return res.status(401).json({ error: "Autenticação necessária." });
    }
    const userId = authedUser.id;

    const {
      installmentId,
      method, // "pix" | "card"
      payer,
      card, // { token, paymentMethodId } quando method === "card"
      deviceId,
      address, // { city, state, zipCode }
    } = req.body ?? {};

    if (!installmentId || !method || !payer?.email) {
      return res.status(400).json({ error: "Dados incompletos para criar o pagamento." });
    }

    // 1) Busca a cobrança no banco (valor REAL, nunca confiar no cliente).
    const { data: inst, error: instError } = await supabaseAdmin
      .from("site_installments")
      .select("id, user_id, client_id, site_id, description, amount_cents, status")
      .eq("id", installmentId)
      .maybeSingle();

    if (instError || !inst) {
      return res.status(404).json({ error: "Cobrança não encontrada." });
    }
    // Só o dono da cobrança pode pagá-la (autorização no servidor).
    if (inst.user_id !== userId) {
      return res.status(403).json({ error: "Esta cobrança não pertence ao usuário." });
    }
    if (inst.status === "paid") {
      return res.status(400).json({ error: "Esta cobrança já foi paga." });
    }

    const amountCents = inst.amount_cents;
    const amount = (amountCents / 100).toFixed(2);
    const externalReference = randomUUID();

    // Data de cadastro do pagador (antifraude), quando disponível.
    let registrationDate: string | null = null;
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("created_at")
        .eq("id", userId)
        .maybeSingle();
      if (profile?.created_at) registrationDate = new Date(profile.created_at).toISOString();
    }

    const additionalInfo: Record<string, any> = {};
    if (registrationDate) additionalInfo["payer.registration_date"] = registrationDate;

    const zip = address?.zipCode ? String(address.zipCode).replace(/\D/g, "") : "";
    const shipment =
      address?.city && address?.state && zip
        ? { address: { city: String(address.city).trim(), state: String(address.state).trim(), zip_code: zip } }
        : null;

    const STATEMENT_DESCRIPTOR = "TECHDEV";
    const description = `${inst.description} - TechDev`;

    const paymentMethod =
      method === "pix"
        ? { id: "pix", type: "bank_transfer" as const, statement_descriptor: STATEMENT_DESCRIPTOR }
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

    const orderBody = {
      type: "online" as const,
      total_amount: amount,
      external_reference: externalReference,
      processing_mode: "automatic" as const,
      description,
      payer: {
        email: payer.email,
        first_name: payer.firstName,
        last_name: payer.lastName,
        identification: payer.identification,
      },
      items: [
        {
          title: inst.description,
          unit_price: amount,
          quantity: 1,
          category_id: "services",
          description,
        },
      ],
      transactions: { payments: [{ amount, payment_method: paymentMethod }] },
      ...(Object.keys(additionalInfo).length > 0 ? { additional_info: additionalInfo } : {}),
      ...(shipment ? { shipment } : {}),
    };

    const r = await createOrderViaApi({ body: orderBody, idempotencyKey: externalReference, deviceId });
    if (!r.ok) {
      const err: any = new Error(r.data?.message || "Falha ao criar a Order no Mercado Pago.");
      err.statusCode = r.status;
      err.cause = r.data;
      throw err;
    }
    const order: any = r.data;
    const payment = order?.transactions?.payments?.[0] ?? {};
    const orderStatus: string = order?.status ?? "pending";

    // 2) Vincula a Order à cobrança (para reconciliação posterior).
    const { error: upErr } = await supabaseAdmin
      .from("site_installments")
      .update({
        mp_order_id: String(order?.id ?? ""),
        mp_external_reference: externalReference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inst.id);
    if (upErr) console.log("[v0] pay-installment: erro ao vincular order:", upErr.message);

    const pix =
      payment?.payment_method?.type === "bank_transfer"
        ? {
            qrCode: payment?.payment_method?.qr_code,
            qrCodeBase64: payment?.payment_method?.qr_code_base64,
            ticketUrl: payment?.payment_method?.ticket_url,
          }
        : null;

    return res.status(200).json({ orderId: order?.id, status: orderStatus, externalReference, pix });
  } catch (err: any) {
    const httpStatus =
      err?.statusCode ?? err?.status ?? err?.cause?.statusCode ?? err?.response?.status ?? null;
    const apiError = err?.cause?.error ?? err?.cause ?? err?.response?.data ?? err?.error ?? null;
    console.log("[v0] === ERRO pay-installment ===");
    console.log("[v0] mensagem:", err?.message ?? "(sem mensagem)");
    console.log("[v0] status HTTP MP:", httpStatus ?? "(desconhecido)");
    console.log("[v0] corpo de erro:", JSON.stringify(apiError, null, 2));

    return res.status(500).json({
      error: "Não foi possível processar o pagamento.",
      detail: isSandbox()
        ? apiError?.message ?? err?.message ?? "erro desconhecido"
        : "Tente novamente ou utilize outro meio de pagamento.",
    });
  }
}
