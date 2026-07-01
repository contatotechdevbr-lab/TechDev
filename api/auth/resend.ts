import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { findUserByEmail } from "../_lib/auth-users.js";
import {
  generateCode,
  hashCode,
  sendOtpEmail,
  OTP_TTL_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "../_lib/otp.js";

/**
 * POST /api/auth/resend
 * Reenvia um novo código OTP, respeitando um cooldown para evitar spam.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { email } = (req.body ?? {}) as { email?: string };
    const emailNorm = (email ?? "").trim().toLowerCase();
    if (!emailNorm) {
      return res.status(400).json({ error: "Informe o e-mail." });
    }

    const user = await findUserByEmail(emailNorm);
    // Resposta genérica para não revelar se o e-mail existe.
    if (!user || user.confirmed) {
      return res.status(200).json({ ok: true, message: "Se houver uma conta pendente, enviaremos um novo código." });
    }

    // Verifica cooldown com base no último envio.
    const { data: last } = await supabaseAdmin
      .from("email_otps")
      .select("last_sent_at")
      .eq("user_id", user.id)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (last?.last_sent_at) {
      const elapsed = (Date.now() - new Date(last.last_sent_at).getTime()) / 1000;
      if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed);
        return res.status(429).json({ error: `Aguarde ${wait}s para reenviar o código.` });
      }
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

    await supabaseAdmin.from("email_otps").delete().eq("user_id", user.id);
    const { error: otpError } = await supabaseAdmin.from("email_otps").insert({
      user_id: user.id,
      email: emailNorm,
      code_hash: hashCode(code, emailNorm),
      expires_at: expiresAt,
      attempts: 0,
      last_sent_at: new Date().toISOString(),
    });
    if (otpError) {
      return res.status(500).json({ error: "Erro ao gerar o código de verificação." });
    }

    await sendOtpEmail(emailNorm, code);

    return res.status(200).json({ ok: true, message: "Novo código enviado para o seu e-mail." });
  } catch (err) {
    console.error("[v0] resend error:", err);
    return res.status(500).json({ error: "Erro interno ao reenviar. Tente novamente." });
  }
}
