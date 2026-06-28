import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a Service Role Key.
 * USO EXCLUSIVO no servidor (Vercel Functions). Ignora RLS, portanto
 * NUNCA deve ser importado em código do frontend.
 */
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos no ambiente do servidor.",
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
