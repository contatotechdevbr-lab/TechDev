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

/* ----------------------------------------------------------------
 * Fábricas de clientes de API reutilizáveis (Checkout Transparente).
 * Use `createOrderClient()` para a Orders API (Checkout Transparente).
 * ---------------------------------------------------------------- */
export const createOrderClient = () => new Order(getMercadoPagoClient());
export const createPaymentClient = () => new Payment(getMercadoPagoClient());
export const createPreferenceClient = () => new Preference(getMercadoPagoClient());
export const createPaymentMethodClient = () => new PaymentMethod(getMercadoPagoClient());
