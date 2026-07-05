import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { findUserByEmail } from "../_lib/auth-users.js";
import {
  generateCode,
  hashCode,
  sendOtpEmail,
  OTP_TTL_MINUTES,
} from "../_lib/otp.js";
import { rateLimit } from "../_lib/rate-limit.js";

/**
 * POST /api/auth/register
 * Cria o usuário (NÃO confirmado) e envia um código OTP via Resend.
 * O login só é liberado após /api/auth/verify confirmar o código.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Rate limiting: mitiga criação massiva de contas e abuso de envio de e-mail.
  if (rateLimit(req, res, { key: "auth-register", limit: 8, windowMs: 10 * 60_000 })) return;

  try {
    const { email, password, fullName, acceptedTerms, termsVersion, privacyVersion } =
      (req.body ?? {}) as {
        email?: string;
        password?: string;
        fullName?: string;
        acceptedTerms?: boolean;
        termsVersion?: string;
        privacyVersion?: string;
      };

    const emailNorm = (email ?? "").trim().toLowerCase();
    if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return res.status(400).json({ error: "E-mail inválido." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter ao menos 6 caracteres." });
    }
    if (acceptedTerms !== true) {
      return res.status(400).json({
        error: "É necessário aceitar os Termos de Uso e a Política de Privacidade.",
      });
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

    // Registra a aceitação dos Termos de Uso e da Política de Privacidade (LGPD).
    try {
      const forwardedFor = req.headers["x-forwarded-for"];
      const ip = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : (forwardedFor ?? "").split(",")[0].trim() || null;
      const userAgent =
        (Array.isArray(req.headers["user-agent"])
          ? req.headers["user-agent"][0]
          : req.headers["user-agent"]) ?? null;
      await supabaseAdmin.from("legal_acceptances").insert({
        user_id: userId,
        email: emailNorm,
        terms_version: termsVersion ?? "1.0",
        privacy_version: privacyVersion ?? "1.0",
        ip,
        user_agent: userAgent,
      });
    } catch (acceptErr) {
      // Não bloqueia o cadastro caso o registro de auditoria falhe.
      console.error("[v0] register legal_acceptances error:", acceptErr);
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
