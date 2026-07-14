import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a Service Role Key.
 * USO EXCLUSIVO no servidor (Vercel Functions). Ignora RLS, portanto
 * NUNCA deve ser importado em código do frontend.
 */
// Projeto Supabase REAL (o mesmo usado pelo frontend / login dos usuários).
// A URL é pública e é fixada aqui para garantir que o backend valide os tokens
// no MESMO projeto que os emitiu — caso contrário toda requisição autenticada
// falha com "Autenticação necessária". Pode ser sobrescrita via env se preciso.
const supabaseUrl =
  process.env.SUPABASE_URL_OVERRIDE ||
  "https://htqxxfgvhowdepzccbqn.supabase.co";

// Chave secreta de servidor do projeto REAL (service_role JWT ou secret key
// sb_secret_...). Defina SUPABASE_SECRET_KEY na Vercel. Ignora RLS: uso restrito
// ao servidor. O fallback para SUPABASE_SERVICE_ROLE_KEY existe apenas por
// compatibilidade, mas deve ser a chave do MESMO projeto da URL acima.
// IMPORTANTE: a integração Supabase da Vercel gerencia SUPABASE_SECRET_KEY /
// SUPABASE_SERVICE_ROLE_KEY apontando para OUTRO projeto. Por isso lemos primeiro
// uma variável dedicada (REAL_SUPABASE_SECRET_KEY), que não sofre override da
// integração e deve conter a Secret Key do projeto REAL (o mesmo da URL acima).
const serviceRoleKey =
  process.env.REAL_SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) precisa estar definido no ambiente do servidor.",
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
