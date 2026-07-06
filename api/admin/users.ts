import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { getAdminUser } from "../_lib/require-admin.js";
import { rateLimit } from "../_lib/rate-limit.js";

/**
 * GET /api/admin/users
 *
 * Fonte ÚNICA e real da aba "Clientes": faz o merge de TODOS os usuários
 * cadastrados no Supabase Auth (auth.users) com os dados de negócio das
 * tabelas `clients`, `profiles` e `user_roles`.
 *
 * Por que partir de auth.users? Porque "usuário cadastrado" = conta de login.
 * Assim, todo cadastro novo aparece automaticamente aqui, mesmo que ainda não
 * exista linha em `clients`. O status (ativo/banido/pendente) é derivado do
 * próprio Auth (banned_until / email_confirmed_at), nunca só de uma flag local.
 *
 * Acesso restrito a administradores (getAdminUser).
 */

interface ClientRow {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  avatar_color: string | null;
  plano: string | null;
  valor_mensal_cents: number | null;
  site_id: string | null;
  next_payment: string | null;
  created_at: string;
}

export interface AdminUser {
  /** id do usuário no Auth (chave para banir/remover). */
  userId: string;
  /** id da linha em `clients`, quando existir. */
  clientId: string | null;
  nome: string;
  email: string;
  empresa: string;
  telefone: string;
  plano: string;
  valorMensalCents: number;
  contratacao: string;
  proximoPagamento: string;
  observacoes: string;
  avatarCor: string;
  siteId: string | null;
  role: string;
  /** "ativo" | "banido" | "pendente" */
  status: "ativo" | "banido" | "pendente";
  isAdmin: boolean;
}

const DEFAULT_COLOR = "205 85% 55%";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (rateLimit(req, res, { key: "admin-users", limit: 60, windowMs: 60_000 })) return;

  const admin = await getAdminUser(req);
  if (!admin) {
    return res.status(403).json({ error: "Acesso restrito a administradores." });
  }

  try {
    // 1) Todos os usuários do Auth (paginado).
    const authUsers: {
      id: string;
      email: string;
      banned: boolean;
      confirmed: boolean;
      createdAt: string;
      fullName: string;
    }[] = [];
    const perPage = 200;
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users ?? [];
      for (const u of users) {
        const bannedUntil = (u as { banned_until?: string | null }).banned_until ?? null;
        const banned = !!bannedUntil && new Date(bannedUntil).getTime() > Date.now();
        authUsers.push({
          id: u.id,
          email: (u.email ?? "").toLowerCase(),
          banned,
          confirmed: !!u.email_confirmed_at,
          createdAt: u.created_at ?? new Date().toISOString(),
          fullName: (u.user_metadata?.full_name as string) ?? "",
        });
      }
      if (users.length < perPage) break;
    }

    // 2) Dados de negócio: clients + roles (uma consulta cada).
    const [{ data: clientsData }, { data: rolesData }] = await Promise.all([
      supabaseAdmin.from("clients").select("*"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const clientsByUser = new Map<string, ClientRow>();
    const clientsByEmail = new Map<string, ClientRow>();
    for (const c of (clientsData as ClientRow[]) ?? []) {
      if (c.user_id) clientsByUser.set(c.user_id, c);
      if (c.email) clientsByEmail.set(c.email.toLowerCase(), c);
    }

    const adminIds = new Set<string>();
    for (const r of (rolesData as { user_id: string; role: string }[]) ?? []) {
      if (r.role === "admin") adminIds.add(r.user_id);
    }

    // 3) Merge auth.users -> AdminUser.
    const result: AdminUser[] = authUsers.map((u) => {
      const c = clientsByUser.get(u.id) ?? clientsByEmail.get(u.email) ?? null;
      const status: AdminUser["status"] = u.banned
        ? "banido"
        : u.confirmed
          ? "ativo"
          : "pendente";
      return {
        userId: u.id,
        clientId: c?.id ?? null,
        nome: c?.full_name || u.fullName || u.email.split("@")[0] || "Sem nome",
        email: c?.email || u.email,
        empresa: c?.company || "",
        telefone: c?.phone || "",
        plano: c?.plano || "",
        valorMensalCents: c?.valor_mensal_cents ?? 0,
        contratacao: c?.created_at || u.createdAt,
        proximoPagamento: c?.next_payment || c?.created_at || u.createdAt,
        observacoes: c?.notes || "",
        avatarCor: c?.avatar_color || DEFAULT_COLOR,
        siteId: c?.site_id ?? null,
        role: adminIds.has(u.id) ? "admin" : "user",
        status,
        isAdmin: adminIds.has(u.id),
      };
    });

    // Mais recentes primeiro.
    result.sort((a, b) => new Date(b.contratacao).getTime() - new Date(a.contratacao).getTime());

    return res.status(200).json({ users: result });
  } catch (err) {
    console.error("[v0] admin/users error:", err);
    return res.status(500).json({ error: "Não foi possível carregar os usuários." });
  }
}
