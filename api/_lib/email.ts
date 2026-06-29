import { Resend } from "resend";
import { renderOtpEmail } from "./email-template.js";

const apiKey = process.env.RESEND_API_KEY;

/**
 * Remetente exibido. O Resend NÃO permite enviar "From" de um endereço
 * @gmail.com, por isso usamos um remetente verificado e apontamos o
 * Reply-To para o e-mail de contato da TechDev.
 */
const FROM = process.env.RESEND_FROM || "TechDev <onboarding@resend.dev>";
const REPLY_TO = process.env.RESEND_REPLY_TO || "contato.techdev.br@gmail.com";

if (!apiKey) {
  // Não lançamos no import para não derrubar o bundle; validamos no uso.
  console.warn("[v0] RESEND_API_KEY não definido — envio de e-mail desativado.");
}

const resend = apiKey ? new Resend(apiKey) : null;

/** Envia o e-mail com o código de verificação (OTP). */
export async function sendOtpEmail(to: string, code: string, fullName?: string) {
  if (!resend) {
    throw new Error("Serviço de e-mail não configurado (RESEND_API_KEY ausente).");
  }

  const { html, text } = renderOtpEmail({ code, fullName });

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: `${code} é o seu código de verificação TechDev`,
    html,
    text,
  });

  if (error) {
    throw new Error(typeof error === "string" ? error : error.message);
  }
  return data;
}
