import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Utilitários de OTP (código de verificação por e-mail) enviados via Resend.
 * Uso EXCLUSIVO no servidor (Vercel Functions).
 */

export const OTP_TTL_MINUTES = 10; // validade do código
export const OTP_MAX_ATTEMPTS = 5; // tentativas antes de invalidar
export const OTP_RESEND_COOLDOWN_SECONDS = 60; // intervalo mínimo entre reenvios

// Pepper do hash: usamos a service role key (nunca sai do servidor).
const PEPPER = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "techdev-otp-pepper";

/** Gera um código numérico de 6 dígitos (100000–999999). */
export const generateCode = (): string => String(randomInt(100000, 1000000));

/** Hash HMAC-SHA256 do código (armazenamos apenas o hash, nunca o código). */
export const hashCode = (code: string, email: string): string =>
  createHmac("sha256", PEPPER).update(`${email.toLowerCase()}:${code}`).digest("hex");

/** Comparação em tempo constante para evitar timing attacks. */
export const codeMatches = (code: string, email: string, storedHash: string): boolean => {
  const candidate = hashCode(code, email);
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

/** Envia o e-mail com o código de verificação usando a API do Resend. */
export async function sendOtpEmail(email: string, code: string, fullName?: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const replyTo = process.env.RESEND_REPLY_TO;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY e RESEND_FROM precisam estar definidos no ambiente.");
  }

  const nome = fullName?.trim() ? fullName.trim().split(" ")[0] : "";
  const saudacao = nome ? `Olá, ${nome}!` : "Olá!";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: `${code} é o seu código de verificação TechDev`,
      html: renderOtpEmail(code, saudacao),
      text: `${saudacao}\n\nSeu código de verificação TechDev é: ${code}\n\nEle expira em ${OTP_TTL_MINUTES} minutos. Se você não solicitou este código, ignore este e-mail.`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Falha ao enviar e-mail via Resend (HTTP ${res.status}): ${detail}`);
  }
}

/** Template HTML do e-mail de verificação (inline styles para clientes de e-mail). */
function renderOtpEmail(code: string, saudacao: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#0b0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f14;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#121821;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0;font-size:20px;font-weight:700;color:#3aa0ff;">TechDev</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <h1 style="margin:0 0 8px 0;font-size:20px;line-height:1.3;color:#f1f5f9;">Confirme seu e-mail</h1>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">${saudacao} Use o código abaixo para ativar sua conta. Ele expira em ${OTP_TTL_MINUTES} minutos.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;">
                <div style="background-color:#0b0f14;border:1px solid #1f2937;border-radius:12px;padding:20px;text-align:center;">
                  <span style="font-size:34px;font-weight:700;letter-spacing:10px;color:#f1f5f9;">${code}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">Se você não criou uma conta na TechDev, ignore este e-mail com segurança.</p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:#475569;">© TechDev</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
