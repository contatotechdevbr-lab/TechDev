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
  createCardToken: (data: unknown) => Promise<unknown>;
  getPaymentMethods: (data: unknown) => Promise<unknown>;
  getIdentificationTypes: () => Promise<unknown>;
  bricks: () => unknown;
};

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale?: string },
    ) => MercadoPagoInstance;
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
