/**
 * GET /api/mercadopago/status
 *
 * Endpoint de verificação da integração com o Mercado Pago.
 * - Inicializa o SDK oficial com o Access Token do servidor.
 * - Faz uma chamada autenticada inofensiva (lista de meios de pagamento)
 *   para confirmar que as credenciais estão válidas. Essa requisição é o
 *   que o painel do Mercado Pago usa para marcar a etapa
 *   "Incluir e inicializar a biblioteca" como concluída.
 * - NUNCA retorna o Access Token.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createPaymentMethodClient, isSandbox } from "../_lib/mercadopago";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const paymentMethodClient = createPaymentMethodClient();
    const methods = await paymentMethodClient.get();

    return res.status(200).json({
      configured: true,
      environment: isSandbox() ? "sandbox" : "production",
      paymentMethods: Array.isArray(methods) ? methods.length : undefined,
      message: "SDK do Mercado Pago inicializado e credenciais válidas.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return res.status(500).json({ configured: false, error: message });
  }
}
