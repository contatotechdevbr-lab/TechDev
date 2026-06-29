import { OTP_TTL_MINUTES } from "./otp.js";

type OtpEmailInput = {
  code: string;
  fullName?: string;
};

/**
 * Template do e-mail de verificação seguindo a identidade da TechDev:
 * fundo escuro, azul de destaque e o código em evidência. Sem botão/link
 * de confirmação — a verificação é feita apenas pelo código.
 *
 * HTML para e-mail usa tabelas e estilos inline por compatibilidade
 * com a maioria dos clientes de e-mail.
 */
export function renderOtpEmail({ code, fullName }: OtpEmailInput): {
  html: string;
  text: string;
} {
  const greetingName = fullName?.trim() ? fullName.trim().split(" ")[0] : null;
  const greeting = greetingName ? `Olá, ${greetingName}!` : "Olá!";
  const spaced = code.split("").join(" ");

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark light" />
    <title>Código de verificação TechDev</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0c1014;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0c1014;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#11171d;border:1px solid #1e2a35;border-radius:16px;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="padding:32px 40px 8px;text-align:center;">
                <div style="font-size:24px;font-weight:700;letter-spacing:-0.02em;background:linear-gradient(135deg,#39a0e8,#6cc4ff);-webkit-background-clip:text;background-clip:text;color:#5bb4f5;">TechDev</div>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:16px 40px 8px;">
                <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#eef3f7;">${greeting}</h1>
                <p style="margin:0;font-size:15px;line-height:1.6;color:#9fb0be;">
                  Use o código abaixo para confirmar seu e-mail e ativar sua conta na TechDev.
                </p>
              </td>
            </tr>
            <!-- Code -->
            <tr>
              <td style="padding:24px 40px;">
                <div style="background-color:#0c1217;border:1px solid #233140;border-radius:12px;padding:24px;text-align:center;">
                  <div style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:700;letter-spacing:10px;color:#5bb4f5;">${spaced}</div>
                </div>
              </td>
            </tr>
            <!-- Meta -->
            <tr>
              <td style="padding:0 40px 8px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#9fb0be;">
                  Este código expira em <strong style="color:#eef3f7;">${OTP_TTL_MINUTES} minutos</strong>. Por segurança, não compartilhe com ninguém.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 32px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7c8a;">
                  Se você não criou uma conta na TechDev, pode ignorar este e-mail com segurança.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;border-top:1px solid #1e2a35;text-align:center;">
                <p style="margin:0;font-size:12px;color:#5a6b78;">© ${new Date().getFullYear()} TechDev — Soluções digitais sob medida</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${greeting}

Seu código de verificação TechDev é: ${code}

Ele expira em ${OTP_TTL_MINUTES} minutos. Não compartilhe com ninguém.

Se você não criou uma conta na TechDev, ignore este e-mail.`;

  return { html, text };
}
