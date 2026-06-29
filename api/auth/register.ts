import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { sendOtpEmail } from "../_lib/email.js";
import {
  generateOtpCode,
  hashOtp,
  OTP_TTL_MINUTES,
} from "../_lib/otp.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { email, password, fullName } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "E-mail inválido." });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: "A senha deve ter entre 8 e 72 caracteres." });
    }

    // 1. Cria o usuário SEM confirmar o e-mail (email_confirm: false).
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: false,
      user_metadata: { full_name: typeof fullName === "string" ? fullName.trim() : "" },
    });

    if (createErr || !created?.user) {
      const msg = createErr?.message || "Não foi possível criar a conta.";
      // Mensagem amigável para e-mail já existente.
      if (/registered|already|exists/i.test(msg)) {
        return res.status(409).json({ error: "Este e-mail já está cadastrado." });
      }
      return res.status(400).json({ error: msg });
    }

    const userId = created.user.id;

    // 2. Gera o código e guarda apenas o hash.
    const code = generateOtpCode();
    const codeHash = hashOtp(code, userId);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

    // Remove códigos antigos do usuário e insere o novo.
    await supabaseAdmin.from("email_otps").delete().eq("user_id", userId);
    const { error: otpErr } = await supabaseAdmin.from("email_otps").insert({
      user_id: userId,
      email: cleanEmail,
      code_hash: codeHash,
      expires_at: expiresAt,
      last_sent_at: new Date().toISOString(),
    });
    if (otpErr) {
      return res.status(500).json({ error: "Falha ao gerar o código de verificação." });
    }

    // 3. Envia o e-mail com o código.
    await sendOtpEmail(cleanEmail, code, typeof fullName === "string" ? fullName : undefined);

    return res.status(200).json({ ok: true, email: cleanEmail });
  } catch (err) {
    console.error("[v0] register error:", err);
    return res.status(500).json({ error: "Erro interno ao registrar. Tente novamente." });
  }
}
