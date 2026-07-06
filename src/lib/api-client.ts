import { supabase } from "@/integrations/supabase/client";

/**
 * Wrapper de fetch para as rotas /api que anexa automaticamente o Access Token
 * da sessão do Supabase no header `Authorization: Bearer <token>`.
 *
 * O backend valida esse token e deriva a identidade do usuário a partir dele,
 * em vez de confiar em um `userId` enviado no corpo (o que permitiria a um
 * usuário agir em nome de outro — IDOR). Sempre use este helper para chamar as
 * funções que exigem autenticação.
 */
export async function apiFetch(
  input: string,
  init: RequestInit = {},
  timeoutMs = 15000,
): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Timeout com AbortController: uma função serverless lenta (ex.: Mercado Pago)
  // nunca pode deixar a UI presa em "Carregando..." indefinidamente.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, headers, signal: controller.signal });
  } catch (err) {
    console.error(`[v0] apiFetch falhou (${input}):`, err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
