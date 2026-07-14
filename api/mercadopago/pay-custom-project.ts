import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { createOrderViaApi, isSandbox } from "../_lib/mercadopago.js";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { getAuthedUser } from "../_lib/require-auth.js";
import { rateLimit } from "../_lib/rate-limit.js";

/**
 * Cria uma Order no Mercado Pago para pagar um PROJETO PERSONALIZADO
 * (tabela `custom_plans`) definido pelo admin para um cliente específico.
 *
 * É um pagamento ÚNICO (one-time), diferente das assinaturas:
 *  - À VISTA: PIX (bank_transfer) ou cartão em 1x.
 *  - PARCELADO: cartão em até `max_installments` vezes (1 única cobrança em Nx).
 *
 * O valor é SEMPRE lido do banco (server-side), nunca do cliente, e o número de
 * parcelas é limitado ao máximo definido no projeto.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (rateLimit(req, res, { key: "pay-custom-project", limit: 15, windowMs: 60_000 })) return;

  try {
    const authedUser = await getAuthedUser(req);
    if (!authedUser) {
      return res.status(401).json({ error: "Autenticação necessária." });
    }
    const userId = authedUser.id;

    const {
      customPlanId,
      method, // "pix" | "card"
      payer,
      card, // { token, paymentMethodId, installments } quando method === "card"
      deviceId,
      address, // { city, state, zipCode }
    } = req.body ?? {};

    if (!customPlanId || !method || !payer?.email) {
      return res.status(400).json({ error: "Dados incompletos para criar o pagamento." });
    }

    // 1) Busca o projeto no banco (valor REAL, nunca confiar no cliente).
    const { data: project, error: projError } = await supabaseAdmin
      .from("custom_plans")
      .select("id, user_id, name, price_cents, max_installments, active")
      .eq("id", customPlanId)
      .maybeSingle();

    if (projError || !project) {
      return res.status(404).json({ error: "Projeto não encontrado." });
    }
    // Só o dono do projeto pode pagá-lo (autorização no servidor).
    if (project.user_id !== userId) {
      return res.status(403).json({ error: "Este projeto não pertence ao usuário." });
    }
    if (!project.active) {
      return res.status(400).json({ error: "Este projeto não está disponível para pagamento." });
    }

    // 1.1) Impede pagamento em duplicidade: se já houver um pagamento pago/pendente
    // vinculado a este projeto, não cria outra Order.
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id, status")
      .eq("custom_plan_id", project.id)
      .in("status", ["paid", "pending"])
      .maybeSingle();
    if (existing?.status === "paid") {
      return res.status(400).json({ error: "Este projeto já foi pago." });
    }

    const amountCents = project.price_cents;
    const amount = (amountCents / 100).toFixed(2);
    const externalReference = randomUUID();

    // Número de parcelas: limitado ao máximo do projeto (mínimo 1).
    const maxInstallments = Math.max(1, Number(project.max_installments) || 1);
    const requestedInstallments = method === "card" ? Math.max(1, Number(card?.installments) || 1) : 1;
    const installments = Math.min(requestedInstallments, maxInstallments);

    // Data de cadastro do pagador (antifraude), quando disponível.
    let registrationDate: string | null = null;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("created_at")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.created_at) registrationDate = new Date(profile.created_at).toISOString();

    const additionalInfo: Record<string, any> = {};
    if (registrationDate) additionalInfo["payer.registration_date"] = registrationDate;

    const zip = address?.zipCode ? String(address.zipCode).replace(/\D/g, "") : "";
    const shipment =
      address?.city && address?.state && zip
        ? { address: { city: String(address.city).trim(), state: String(address.state).trim(), zip_code: zip } }
        : null;

    const STATEMENT_DESCRIPTOR = "TECHDEV";
    const description = `${project.name} - TechDev`;

    const paymentMethod =
      method === "pix"
        ? { id: "pix", type: "bank_transfer" as const, statement_descriptor: STATEMENT_DESCRIPTOR }
        : {
            id: card?.paymentMethodId,
            type: "credit_card" as const,
            token: card?.token,
            installments,
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
          title: project.name,
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

    const safeBody = JSON.parse(JSON.stringify(orderBody)) as Record<string, any>;
    if (safeBody?.payer?.email) safeBody.payer.email = "***@***";
    if (safeBody?.payer?.identification?.number) safeBody.payer.identification.number = "***";
    const safePaymentMethod = safeBody?.transactions?.payments?.[0]?.payment_method;
    if (safePaymentMethod?.token) safePaymentMethod.token = "***";
    console.log("[v0] MP pay-custom-project payload:", JSON.stringify(safeBody));

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

    // 2) Registra o pagamento pendente vinculado ao projeto.
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: userId,
      custom_plan_id: project.id,
      amount_cents: amountCents,
      installments,
      status: "pending",
      payment_method: method,
      billing_type: "custom_project",
      payer_email: payer.email,
      mp_order_id: String(order?.id ?? ""),
      mp_payment_id: payment?.id ? String(payment.id) : null,
      mp_external_reference: externalReference,
    });
    if (insertError) console.log("[v0] pay-custom-project: erro ao registrar pagamento:", insertError.message);

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
    console.log("[v0] === ERRO pay-custom-project ===");
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
