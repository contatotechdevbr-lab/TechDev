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
 * Identificadores do SDK Node oficial do Mercado Pago (mercadopago v3.1.0).
 *
 * Estes são os mesmos valores que o SDK injeta automaticamente em TODA
 * requisição. Como fazemos a chamada via fetch direto (necessário para enviar
 * o Device ID), reproduzimos esses headers manualmente para que o Mercado Pago
 * atribua corretamente o tráfego ao SDK oficial (qualidade da integração).
 */
const MP_SDK_VERSION = "3.1.0";
const MP_PRODUCT_ID = "bc32b6ntrpp001u8nhkg";

/** User-Agent no mesmo formato do SDK oficial. */
function getSdkUserAgent(): string {
  const nodeVersion = process.versions?.node ?? "unknown";
  const arch = process.arch ?? "unknown";
  const platform = process.platform ?? "unknown";
  return `MercadoPago Node.js SDK v${MP_SDK_VERSION} (node ${nodeVersion}-${arch}-${platform})`;
}

/** X-Tracking-Id no mesmo formato do SDK oficial. */
function getSdkTrackingId(): string {
  const nodeVersion = process.versions?.node ?? "0.0.0";
  const major = nodeVersion.includes(".") ? nodeVersion.slice(0, nodeVersion.indexOf(".")) : nodeVersion;
  return `platform:${major}|${nodeVersion},type:SDK${MP_SDK_VERSION},so;`;
}

/**
 * Cria uma Order chamando diretamente o endpoint REST /v1/orders.
 *
 * Usamos fetch direto (em vez do client do SDK) porque a Orders API exige o
 * header `X-meli-session-id` (Device ID), que o SDK Node não expõe via
 * requestOptions. Para não perder a atribuição da integração, replicamos aqui
 * os headers de identificação que o SDK oficial enviaria:
 *  - `User-Agent`, `X-Product-Id`, `X-Tracking-Id`.
 *
 * Demais headers:
 *  - `X-Idempotency-Key`: evita orders duplicadas.
 *  - `X-meli-session-id`: Device ID do MercadoPago.js V2 (antifraude/aprovação).
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
    // Headers de identificação equivalentes aos do SDK oficial Node v3.1.0.
    "User-Agent": getSdkUserAgent(),
    "X-Product-Id": MP_PRODUCT_ID,
    "X-Tracking-Id": getSdkTrackingId(),
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
