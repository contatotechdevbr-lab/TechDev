import { supabaseAdmin } from "./supabase-admin.js";

export interface FoundUser {
  id: string;
  email: string;
  confirmed: boolean;
}

/**
 * Localiza um usuário do Supabase Auth pelo e-mail.
 * Percorre as páginas do admin.listUsers (projeto pequeno) até encontrar.
 */
export async function findUserByEmail(email: string): Promise<FoundUser | null> {
  const alvo = email.trim().toLowerCase();
  const perPage = 200;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((u) => (u.email ?? "").toLowerCase() === alvo);
    if (match) {
      return {
        id: match.id,
        email: match.email ?? alvo,
        confirmed: Boolean(match.email_confirmed_at),
      };
    }
    if (users.length < perPage) break; // última página
  }
  return null;
}
