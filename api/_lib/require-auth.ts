import type { VercelRequest } from "@vercel/node";
import { supabaseAdmin } from "./supabase-admin.js";

/**
 * Autenticação no servidor (Vercel Functions).
 *
 * NUNCA confie no `userId` enviado pelo corpo da requisição: um usuário
 * autenticado poderia informar o id de OUTRO usuário (IDOR / Broken Access
 * Control). Aqui validamos o Access Token (JWT) do Supabase presente no header
 * `Authorization: Bearer <token>` e derivamos a identidade do próprio token.
 */
export interface AuthedUser {
  id: string;
  email: string | null;
}

/** Extrai o Bearer token do header Authorization. */
function getBearerToken(req: VercelRequest): string | null {
  const header = req.headers["authorization"] ?? req.headers["Authorization" as never];
  const value = Array.isArray(header) ? header[0] : header;
  if (!value || typeof value !== "string") return null;
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1].trim() : null;
}

/**
 * Valida o token de sessão e devolve o usuário autenticado.
 * Retorna `null` quando não há token válido.
 */
export async function getAuthedUser(req: VercelRequest): Promise<AuthedUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  return { id: data.user.id, email: data.user.email ?? null };
}
