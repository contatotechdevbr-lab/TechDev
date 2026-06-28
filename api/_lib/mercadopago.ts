/**
 * Configuração oficial do Mercado Pago (backend / servidor).
 *
 * Arquivo ÚNICO de inicialização do SDK Node oficial (`mercadopago`),
 * reutilizável por qualquer Serverless Function da Vercel (pasta /api).
 *
 * IMPORTANTE:
 * - O Access Token é lido SOMENTE de variável de ambiente do servidor
 *   (`MERCADO_PAGO_ACCESS_TOKEN`) e NUNCA é exposto ao frontend.
 * - O prefixo "_" na pasta (_lib) faz a Vercel tratar este arquivo como
 *   código compartilhado, e não como uma rota/endpoint.
 */
import { MercadoPagoConfig, Order, Payment, Preference, PaymentMethod } from "mercadopago";

/**
 * Cria o client do Mercado Pago a partir do Access Token de ambiente.
 * Lança erro claro caso a credencial não esteja configurada.
 */
export function getMercadoPagoClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN não está definido. Configure a variável de ambiente no projeto da Vercel.",
    );
  }

  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 },
  });
}

/** Indica se o token está em modo de testes (Sandbox). */
export function isSandbox(): boolean {
  return (process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "").startsWith("TEST-");
}

/** Retorna o Access Token do servidor (lança erro se ausente). */
export function getAccessToken(): string {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "MERCADO_PAGO_ACCESS_TOKEN não está definido. Configure a variável de ambiente no projeto da Vercel.",
    );
  }
  return accessToken;
}

/**
 * Cria uma Order chamando diretamente o endpoint REST /v1/orders.
 *
 * Usamos fetch direto (em vez do SDK) porque a Orders API exige headers que o
 * SDK Node não expõe via requestOptions:
 *  - `X-Idempotency-Key`: evita orders duplicadas.
 *  - `X-meli-session-id`: Device ID gerado pelo MercadoPago.js V2 no frontend,
 *    essencial para a análise antifraude e aprovação de pagamentos.
 *
 * A resposta é o mesmo JSON retornado pelo SDK, mantendo o parsing consistente.
 */
export async function createOrderViaApi(params: {
  body: unknown;
  idempotencyKey: string;
  deviceId?: string;
}): Promise<{ ok: boolean; status: number; data: any }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
    "X-Idempotency-Key": params.idempotencyKey,
  };
  // Device ID (prevenção a fraude) — só enviado quando o frontend o fornece.
  if (params.deviceId) {
    headers["X-meli-session-id"] = params.deviceId;
  }

  const resp = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers,
    body: JSON.stringify(params.body),
  });

  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

/* ----------------------------------------------------------------
 * Fábricas de clientes de API reutilizáveis (Checkout Transparente).
 * Use `createOrderClient()` para a Orders API (Checkout Transparente).
 * ---------------------------------------------------------------- */
export const createOrderClient = () => new Order(getMercadoPagoClient());
export const createPaymentClient = () => new Payment(getMercadoPagoClient());
export const createPreferenceClient = () => new Preference(getMercadoPagoClient());
export const createPaymentMethodClient = () => new PaymentMethod(getMercadoPagoClient());
