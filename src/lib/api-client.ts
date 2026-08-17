import { supabase } from "@/integrations/supabase/client";

/**
 * Cache do Access Token mantido pelo listener de autenticação.
 *
 * IMPORTANTE: chamar `supabase.auth.getSession()` a cada requisição pode travar
 * no lock interno de refresh de token do supabase-js (o mesmo deadlock que o
 * AuthProvider evita). Quando isso acontece, o token não é anexado e o backend
 * responde 401 "Autenticação necessária" — mesmo com o usuário logado.
 *
 * Por isso assinamos `onAuthStateChange` UMA vez e guardamos o token mais
 * recente. O listener emite `INITIAL_SESSION` (ao restaurar do localStorage),
 * `SIGNED_IN`, `TOKEN_REFRESHED` e `SIGNED_OUT`, mantendo o cache sempre atual
 * sem readquirir o lock a cada chamada.
 */
let cachedToken: string | null = null;
supabase.auth.onAuthStateChange((_event, session) => {
  cachedToken = session?.access_token ?? null;
});

/**
 * Resolve o Access Token atual. Prioriza o cache do listener; só recorre ao
 * `getSession()` como fallback (ex.: primeiríssima chamada antes do
 * `INITIAL_SESSION`), sempre com timeout para nunca travar a requisição.
 */
async function resolveAccessToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    if (result && "data" in result) {
      cachedToken = result.data.session?.access_token ?? null;
    }
  } catch {
    /* ignora: seguimos sem token e o backend responde 401 tratável */
  }
  return cachedToken;
}

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
  const token = await resolveAccessToken();

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
