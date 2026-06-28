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

// URL oficial do script de segurança do Mercado Pago, responsável por coletar
// o fingerprint do dispositivo e preencher a global `MP_DEVICE_SESSION_ID`.
const SECURITY_SCRIPT_SRC = "https://www.mercadopago.com/v2/security.js";

let securityScriptPromise: Promise<void> | null = null;

/**
 * Carrega (uma única vez) o script oficial `security.js` do Mercado Pago.
 *
 * Esse script faz parte do toolkit oficial do Mercado Pago e é o método
 * documentado para gerar o Device ID. Não é uma implementação manual: apenas
 * complementa o SDK V2 garantindo que `window.MP_DEVICE_SESSION_ID` seja
 * preenchido (o pacote @mercadopago/sdk-js não embute essa coleta).
 */
function ensureSecurityScript(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  if (!securityScriptPromise) {
    securityScriptPromise = new Promise<void>((resolve) => {
      // Evita duplicar o script caso já esteja presente.
      if (document.querySelector(`script[src="${SECURITY_SCRIPT_SRC}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = SECURITY_SCRIPT_SRC;
      script.setAttribute("view", "checkout");
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => resolve(); // não bloqueia o checkout se falhar
      document.head.appendChild(script);
    });
  }

  return securityScriptPromise;
}

/**
 * Pré-carrega os recursos do Mercado Pago necessários ao checkout: o SDK V2
 * (tokenização) e o script de segurança (Device ID). Deve ser chamado assim
 * que a tela de checkout abre, dando tempo para o Device ID ser coletado.
 */
export async function preloadMercadoPago(): Promise<void> {
  ensureSecurityScript();
  try {
    await getMercadoPago();
  } catch {
    /* falha silenciosa: o checkout segue e reporta o erro no pagamento */
  }
}

/**
 * Obtém o Device ID (identificador do dispositivo para análise antifraude),
 * gerado pelo MercadoPago.js V2 em conjunto com o script `security.js`.
 *
 * Estratégia:
 *  1) Garante que o `security.js` foi carregado.
 *  2) Tenta o método do SDK: `mp.deviceProfile().getDeviceId()`.
 *  3) Faz polling da global `window.MP_DEVICE_SESSION_ID` por até ~3s, pois a
 *     coleta do fingerprint é assíncrona.
 *
 * Retorna `undefined` somente se o identificador não puder ser coletado.
 */
export async function getDeviceId(): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;

  await ensureSecurityScript();

  // Método do SDK, quando disponível.
  try {
    const mp = await getMercadoPago();
    const fromSdk = mp.deviceProfile?.()?.getDeviceId?.();
    if (fromSdk) return fromSdk;
  } catch {
    // ignora e cai para o polling da global
  }

  // Polling da global preenchida pelo security.js (coleta assíncrona).
  const maxAttempts = 30; // ~3s (30 x 100ms)
  for (let i = 0; i < maxAttempts; i++) {
    if (window.MP_DEVICE_SESSION_ID) return window.MP_DEVICE_SESSION_ID;
    await new Promise((r) => setTimeout(r, 100));
  }

  return window.MP_DEVICE_SESSION_ID;
}
