import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { hashOtp, OTP_MAX_ATTEMPTS } from "../_lib/otp.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { email, code } = req.body ?? {};
    if (typeof email !== "string" || typeof code !== "string") {
      return res.status(400).json({ error: "E-mail e código são obrigatórios." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      return res.status(400).json({ error: "O código deve ter 6 dígitos." });
    }

    // Busca o OTP mais recente do e-mail.
    const { data: otp, error: fetchErr } = await supabaseAdmin
      .from("email_otps")
      .select("*")
      .eq("email", cleanEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !otp) {
      return res.status(404).json({ error: "Nenhum código pendente para este e-mail." });
    }

    if (otp.consumed_at) {
      return res.status(400).json({ error: "Este código já foi utilizado." });
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "Código expirado. Solicite um novo." });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ error: "Muitas tentativas. Solicite um novo código." });
    }

    const matches = hashOtp(cleanCode, otp.user_id) === otp.code_hash;

    if (!matches) {
      await supabaseAdmin
        .from("email_otps")
        .update({ attempts: otp.attempts + 1 })
        .eq("id", otp.id);
      const restantes = Math.max(0, OTP_MAX_ATTEMPTS - (otp.attempts + 1));
      return res.status(400).json({
        error: restantes > 0
          ? `Código incorreto. Tentativas restantes: ${restantes}.`
          : "Código incorreto. Solicite um novo código.",
      });
    }

    // Confirma o e-mail do usuário e marca o OTP como consumido.
    const { error: confirmErr } = await supabaseAdmin.auth.admin.updateUserById(otp.user_id, {
      email_confirm: true,
    });
    if (confirmErr) {
      return res.status(500).json({ error: "Falha ao confirmar o e-mail. Tente novamente." });
    }

    await supabaseAdmin
      .from("email_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otp.id);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[v0] verify-otp error:", err);
    return res.status(500).json({ error: "Erro interno ao verificar o código." });
  }
}
