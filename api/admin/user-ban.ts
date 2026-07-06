import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { getAdminUser } from "../_lib/require-admin.js";
import { rateLimit } from "../_lib/rate-limit.js";

/**
 * POST /api/admin/user-ban  { userId, action: "ban" | "unban" }
 *
 * Banir bloqueia o acesso do usuário SEM apagar a conta (ban_duration longo no
 * Supabase Auth). Ao tentar entrar, o Supabase retorna `user_banned` e o
 * frontend exibe a mensagem de conta suspensa. Desbanir libera novamente.
 *
 * Também espelha o estado em `clients.status` (inativo/ativo) para a lista e os
 * relatórios internos ficarem coerentes. Restrito a administradores.
 */

// ~100 anos: equivale a um banimento permanente até ser revertido.
const BAN_DURATION = "876000h";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (rateLimit(req, res, { key: "admin-user-ban", limit: 30, windowMs: 60_000 })) return;

  const admin = await getAdminUser(req);
  if (!admin) {
    return res.status(403).json({ error: "Acesso restrito a administradores." });
  }

  try {
    const { userId, action } = (req.body ?? {}) as { userId?: string; action?: string };

    if (!userId || (action !== "ban" && action !== "unban")) {
      return res.status(400).json({ error: "Parâmetros inválidos." });
    }
    if (userId === admin.id) {
      return res.status(400).json({ error: "Você não pode banir a si mesmo." });
    }

    const ban = action === "ban";

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: ban ? BAN_DURATION : "none",
    });
    if (banError) {
      console.error("[v0] admin/user-ban updateUser error:", banError.message);
      return res.status(500).json({ error: "Não foi possível atualizar o acesso do usuário." });
    }

    // Espelha em clients.status (best-effort — não bloqueia a operação).
    const { error: cliErr } = await supabaseAdmin
      .from("clients")
      .update({ status: ban ? "inativo" : "ativo", updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (cliErr) console.log("[v0] admin/user-ban: clients update:", cliErr.message);

    return res.status(200).json({ ok: true, status: ban ? "banido" : "ativo" });
  } catch (err) {
    console.error("[v0] admin/user-ban error:", err);
    return res.status(500).json({ error: "Erro interno ao processar o banimento." });
  }
}
