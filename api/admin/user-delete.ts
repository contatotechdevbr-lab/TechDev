import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { getAdminUser } from "../_lib/require-admin.js";
import { rateLimit } from "../_lib/rate-limit.js";

/**
 * POST /api/admin/user-delete  { userId }
 *
 * Exclui DE VERDADE a conta: remove a linha em `clients` e apaga o usuário do
 * Supabase Auth (auth.users). Sem a conta no Auth, o login deixa de existir —
 * diferente do comportamento antigo, que só escondia o cliente da lista.
 *
 * As tabelas dependentes usam FK com ON DELETE CASCADE, então os dados
 * relacionados são removidos junto. Restrito a administradores.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (rateLimit(req, res, { key: "admin-user-delete", limit: 30, windowMs: 60_000 })) return;

  const admin = await getAdminUser(req);
  if (!admin) {
    return res.status(403).json({ error: "Acesso restrito a administradores." });
  }

  try {
    const { userId } = (req.body ?? {}) as { userId?: string };
    if (!userId) {
      return res.status(400).json({ error: "Parâmetro userId é obrigatório." });
    }
    if (userId === admin.id) {
      return res.status(400).json({ error: "Você não pode remover a própria conta." });
    }

    // 1) Remove a linha de negócio (se existir). Não bloqueia caso não haja.
    const { error: cliErr } = await supabaseAdmin.from("clients").delete().eq("user_id", userId);
    if (cliErr) console.log("[v0] admin/user-delete: clients delete:", cliErr.message);

    // 2) Remove a conta do Auth — é isso que impede novos logins.
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error("[v0] admin/user-delete deleteUser error:", authErr.message);
      return res.status(500).json({ error: "Não foi possível excluir a conta do usuário." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[v0] admin/user-delete error:", err);
    return res.status(500).json({ error: "Erro interno ao remover o usuário." });
  }
}
