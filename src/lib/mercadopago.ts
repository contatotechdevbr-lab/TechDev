/**
 * Configuração oficial do Mercado Pago (frontend).
 *
 * Arquivo ÚNICO de inicialização do SDK JS oficial (`@mercadopago/sdk-js`),
 * reutilizável em toda a aplicação.
 *
 * IMPORTANTE:
 * - Usa SOMENTE a chave pública (`VITE_MERCADO_PAGO_PUBLIC_KEY`), que é
 *   segura para o frontend. O Access Token jamais é usado aqui.
 * - Em Vite, variáveis expostas ao cliente exigem o prefixo `VITE_`.
 */
import { loadMercadoPago } from "@mercadopago/sdk-js";

type MercadoPagoInstance = {
  // tipos mínimos do SDK; os métodos completos vêm do objeto em runtime
  createCardToken: (data: unknown) => Promise<{ id: string }>;
  getPaymentMethods: (data: unknown) => Promise<{
    results: Array<{ id: string; payment_type_id: string }>;
  }>;
  getIdentificationTypes: () => Promise<unknown>;
  bricks: () => unknown;
  // MercadoPago.js V2: perfil de dispositivo para gerar o Device ID (antifraude)
  deviceProfile?: () => { getDeviceId?: () => string | undefined };
};

export type CardInput = {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  identificationNumber: string; // CPF
};

export type CardTokenResult = {
  token: string;
  paymentMethodId: string;
};

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => MercadoPagoInstance;
    // Variável global preenchida automaticamente pelo SDK V2 / security.js
    MP_DEVICE_SESSION_ID?: string;
  }
}

const PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;

let instancePromise: Promise<MercadoPagoInstance> | null = null;

/** Indica se a chave pública do Mercado Pago está configurada. */
export const isMercadoPagoConfigured = (): boolean => Boolean(PUBLIC_KEY);

/**
 * Inicializa (uma única vez) e retorna a instância do SDK do Mercado Pago.
 * Carrega o script oficial e instancia `MercadoPago` com a chave pública.
 */
export async function getMercadoPago(): Promise<MercadoPagoInstance> {
  if (!PUBLIC_KEY) {
    throw new Error(
      "VITE_MERCADO_PAGO_PUBLIC_KEY não está definida. Configure a variável de ambiente do projeto.",
    );
  }

  if (!instancePromise) {
    instancePromise = (async () => {
      await loadMercadoPago();
      if (!window.MercadoPago) {
        throw new Error("Falha ao carregar o SDK do Mercado Pago.");
      }
      return new window.MercadoPago(PUBLIC_KEY, { locale: "pt-BR" });
    })();
  }

  return instancePromise;
}

/**
 * Tokeniza os dados do cartão no NAVEGADOR via SDK oficial.
 * Os dados sensíveis do cartão NUNCA passam pelo nosso servidor: apenas o
 * token gerado é enviado ao backend.
 */
export async function tokenizeCard(card: CardInput): Promise<CardTokenResult> {
  const mp = await getMercadoPago();

  // Descobre o payment_method_id (ex.: "visa", "master") pelo BIN do cartão
  const bin = card.cardNumber.replace(/\s/g, "").slice(0, 6);
  const methods = await mp.getPaymentMethods({ bin });
  const paymentMethodId = methods?.results?.[0]?.id;
  if (!paymentMethodId) {
    throw new Error("Cartão não reconhecido. Verifique o número informado.");
  }

  const result = await mp.createCardToken({
    cardNumber: card.cardNumber.replace(/\s/g, ""),
    cardholderName: card.cardholderName,
    cardExpirationMonth: card.expirationMonth,
    cardExpirationYear: card.expirationYear,
    securityCode: card.securityCode,
    identificationType: "CPF",
    identificationNumber: card.identificationNumber.replace(/\D/g, ""),
  });

  return { token: result.id, paymentMethodId };
}

/**
 * Obtém o Device ID (identificador do dispositivo para análise antifraude),
 * gerado pelo MercadoPago.js V2.
 *
 * Estratégia (em ordem de preferência):
 *  1) Método oficial do SDK: `mp.deviceProfile().getDeviceId()`.
 *  2) Fallback para a variável global `window.MP_DEVICE_SESSION_ID`, que o SDK
 *     preenche automaticamente ao ser carregado.
 *
 * Retorna `undefined` se o SDK ainda não tiver coletado o identificador.
 */
export async function getDeviceId(): Promise<string | undefined> {
  try {
    const mp = await getMercadoPago();
    const fromSdk = mp.deviceProfile?.()?.getDeviceId?.();
    if (fromSdk) return fromSdk;
  } catch {
    // ignora e tenta o fallback global
  }
  return typeof window !== "undefined" ? window.MP_DEVICE_SESSION_ID : undefined;
}
