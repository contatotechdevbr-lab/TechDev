import type { VercelRequest } from "@vercel/node";
import { getAuthedUser, type AuthedUser } from "./require-auth.js";
import { supabaseAdmin } from "./supabase-admin.js";

/**
 * Autorização de administrador no servidor.
 *
 * Valida o Access Token (via getAuthedUser) e, em seguida, confirma que o
 * usuário possui o papel `admin` na tabela `user_roles`. A verificação é feita
 * com a Service Role (ignora RLS), então NUNCA confie apenas no frontend:
 * qualquer endpoint sensível do painel precisa passar por aqui.
 *
 * Retorna o usuário autenticado quando ele é admin; caso contrário `null`.
 */
export async function getAdminUser(req: VercelRequest): Promise<AuthedUser | null> {
  const user = await getAuthedUser(req);
  if (!user) return null;

  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) return null;
  return user;
}
