import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { getAuthedUser } from "../_lib/require-auth.js";
import { rateLimit } from "../_lib/rate-limit.js";

/**
 * POST /api/auth/accept-terms
 * Registra o aceite dos Termos de Uso e da Política de Privacidade para o
 * usuário autenticado. Usado principalmente por quem entra via OAuth (Google),
 * já que esse fluxo não passa pelo /api/auth/register.
 *
 * Segurança: a identidade é derivada do Access Token (JWT) — NUNCA do corpo.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  if (rateLimit(req, res, { key: "auth-accept-terms", limit: 20, windowMs: 10 * 60_000 })) return;

  const authed = await getAuthedUser(req);
  if (!authed) {
    return res.status(401).json({ error: "Autenticação necessária." });
  }

  try {
    const { termsVersion, privacyVersion } = (req.body ?? {}) as {
      termsVersion?: string;
      privacyVersion?: string;
    };

    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : (forwardedFor ?? "").split(",")[0].trim() || null;
    const userAgent =
      (Array.isArray(req.headers["user-agent"])
        ? req.headers["user-agent"][0]
        : req.headers["user-agent"]) ?? null;

    const { error } = await supabaseAdmin.from("legal_acceptances").insert({
      user_id: authed.id,
      email: authed.email ?? "",
      terms_version: termsVersion ?? "1.0",
      privacy_version: privacyVersion ?? "1.0",
      ip,
      user_agent: userAgent,
    });

    if (error) {
      console.error("[v0] accept-terms insert error:", error);
      return res.status(500).json({ error: "Não foi possível registrar o aceite." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[v0] accept-terms error:", err);
    return res.status(500).json({ error: "Erro interno ao registrar o aceite." });
  }
}
