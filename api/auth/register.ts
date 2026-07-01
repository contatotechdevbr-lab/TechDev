import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { findUserByEmail } from "../_lib/auth-users.js";
import {
  generateCode,
  hashCode,
  sendOtpEmail,
  OTP_TTL_MINUTES,
} from "../_lib/otp.js";

/**
 * POST /api/auth/register
 * Cria o usuário (NÃO confirmado) e envia um código OTP via Resend.
 * O login só é liberado após /api/auth/verify confirmar o código.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { email, password, fullName } = (req.body ?? {}) as {
      email?: string;
      password?: string;
      fullName?: string;
    };

    const emailNorm = (email ?? "").trim().toLowerCase();
    if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return res.status(400).json({ error: "E-mail inválido." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres." });
    }

    // Já existe uma conta com esse e-mail?
    const existing = await findUserByEmail(emailNorm);
    if (existing?.confirmed) {
      return res.status(409).json({ error: "Já existe uma conta com este e-mail." });
    }

    let userId: string;
    if (existing && !existing.confirmed) {
      // Conta pendente: atualiza a senha e reenvia o código.
      userId = existing.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: fullName ? { full_name: fullName } : undefined,
      });
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: emailNorm,
        password,
        email_confirm: false, // permanece não confirmado até validar o OTP
        user_metadata: fullName ? { full_name: fullName } : {},
      });
      if (error || !data?.user) {
        return res.status(400).json({ error: error?.message ?? "Não foi possível criar a conta." });
      }
      userId = data.user.id;
    }

    // Gera e persiste o código (somente o hash).
    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

    // Remove códigos anteriores deste usuário e insere o novo.
    await supabaseAdmin.from("email_otps").delete().eq("user_id", userId);
    const { error: otpError } = await supabaseAdmin.from("email_otps").insert({
      user_id: userId,
      email: emailNorm,
      code_hash: hashCode(code, emailNorm),
      expires_at: expiresAt,
      attempts: 0,
      last_sent_at: new Date().toISOString(),
    });
    if (otpError) {
      return res.status(500).json({ error: "Erro ao gerar o código de verificação." });
    }

    try {
      await sendOtpEmail(emailNorm, code, fullName);
    } catch (mailErr) {
      console.error("[v0] register sendOtpEmail error:", mailErr);
      const detail = mailErr instanceof Error ? mailErr.message : "";
      // Resend em modo de teste só entrega para o e-mail dono da conta.
      const isResendTestMode = /you can only send testing emails|verify a domain/i.test(detail);
      return res.status(502).json({
        error: isResendTestMode
          ? "Não foi possível enviar o e-mail de verificação. O provedor de e-mail (Resend) ainda está em modo de teste: verifique um domínio em resend.com/domains e atualize a variável RESEND_FROM."
          : "Não foi possível enviar o e-mail de verificação agora. Tente novamente em instantes.",
        code: "EMAIL_SEND_FAILED",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Enviamos um código de verificação para o seu e-mail.",
    });
  } catch (err) {
    console.error("[v0] register error:", err);
    return res.status(500).json({ error: "Erro interno ao registrar. Tente novamente." });
  }
}
