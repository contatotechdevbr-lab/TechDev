import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { sendOtpEmail } from "../_lib/email.js";
import {
  generateOtpCode,
  hashOtp,
  OTP_TTL_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "../_lib/otp.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { email } = req.body ?? {};
    if (typeof email !== "string") {
      return res.status(400).json({ error: "E-mail é obrigatório." });
    }
    const cleanEmail = email.trim().toLowerCase();

    // Recupera o registro mais recente para identificar o usuário e o cooldown.
    const { data: existing } = await supabaseAdmin
      .from("email_otps")
      .select("*")
      .eq("email", cleanEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({ error: "Nenhum cadastro pendente para este e-mail." });
    }

    if (existing.consumed_at) {
      return res.status(400).json({ error: "Este e-mail já foi verificado." });
    }

    // Cooldown de reenvio.
    const lastSent = new Date(existing.last_sent_at).getTime();
    const elapsed = (Date.now() - lastSent) / 1000;
    if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed);
      return res.status(429).json({
        error: `Aguarde ${wait}s para reenviar o código.`,
        retryAfter: wait,
      });
    }

    const userId = existing.user_id;
    const code = generateOtpCode();
    const codeHash = hashOtp(code, userId);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

    // Substitui por um novo código (zera tentativas e cooldown).
    await supabaseAdmin.from("email_otps").delete().eq("user_id", userId);
    const { error: insErr } = await supabaseAdmin.from("email_otps").insert({
      user_id: userId,
      email: cleanEmail,
      code_hash: codeHash,
      expires_at: expiresAt,
      last_sent_at: new Date().toISOString(),
    });
    if (insErr) {
      return res.status(500).json({ error: "Falha ao gerar novo código." });
    }

    await sendOtpEmail(cleanEmail, code);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[v0] resend-otp error:", err);
    return res.status(500).json({ error: "Erro interno ao reenviar o código." });
  }
}
