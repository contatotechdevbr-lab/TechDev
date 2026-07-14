import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { findUserByEmail } from "../_lib/auth-users.js";
import { codeMatches, OTP_MAX_ATTEMPTS } from "../_lib/otp.js";
import { rateLimit } from "../_lib/rate-limit.js";

/**
 * POST /api/auth/verify
 * Valida o código OTP. Se correto e válido, confirma o e-mail do usuário
 * (email_confirm: true), liberando o login.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Rate limiting: mitiga brute force do código OTP por IP (além do limite por conta).
  if (rateLimit(req, res, { key: "auth-verify", limit: 20, windowMs: 10 * 60_000 })) return;

  try {
    const { email, code } = (req.body ?? {}) as { email?: string; code?: string };
    const emailNorm = (email ?? "").trim().toLowerCase();
    const codeNorm = (code ?? "").trim();

    if (!emailNorm || !/^\d{6}$/.test(codeNorm)) {
      return res.status(400).json({ error: "Informe o código de 6 dígitos." });
    }

    const user = await findUserByEmail(emailNorm);
    if (!user) {
      return res.status(404).json({ error: "Conta não encontrada." });
    }
    if (user.confirmed) {
      return res.status(200).json({ ok: true, message: "E-mail já confirmado. Faça login." });
    }

    // Busca o OTP mais recente do usuário.
    const { data: otp, error } = await supabaseAdmin
      .from("email_otps")
      .select("*")
      .eq("user_id", user.id)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !otp) {
      return res.status(400).json({ error: "Nenhum código pendente. Solicite um novo." });
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "Código expirado. Solicite um novo." });
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ error: "Muitas tentativas. Solicite um novo código." });
    }

    if (!codeMatches(codeNorm, emailNorm, otp.code_hash)) {
      await supabaseAdmin
        .from("email_otps")
        .update({ attempts: otp.attempts + 1 })
        .eq("id", otp.id);
      const restantes = Math.max(0, OTP_MAX_ATTEMPTS - (otp.attempts + 1));
      return res.status(400).json({
        error: restantes > 0 ? `Código incorreto. Tentativas restantes: ${restantes}.` : "Código incorreto.",
      });
    }

    // Código correto: confirma o e-mail e consome o OTP.
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (confirmError) {
      return res.status(500).json({ error: "Erro ao confirmar a conta." });
    }
    await supabaseAdmin
      .from("email_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otp.id);

    return res.status(200).json({ ok: true, message: "E-mail confirmado! Você já pode entrar." });
  } catch (err) {
    console.error("[v0] verify error:", err);
    return res.status(500).json({ error: "Erro interno ao verificar. Tente novamente." });
  }
}
