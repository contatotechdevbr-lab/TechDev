/**
 * RECUPERAÇÃO DE EMERGÊNCIA DO 2FA (painel CEO).
 *
 * Use quando o administrador perder o app autenticador e ficar travado no
 * portão de verificação em duas etapas. Este script remove os fatores TOTP do
 * usuário para que ele possa cadastrar um novo no próximo login.
 *
 * COMO RODAR (na raiz do projeto):
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/admin-mfa-reset.mjs email@do-admin.com
 *
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Uso: node scripts/admin-mfa-reset.mjs <email-do-admin>");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

// Localiza o usuário pelo e-mail (paginando a lista de usuários).
let userId = null;
for (let page = 1; page <= 20 && !userId; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error("Erro ao listar usuários:", error.message);
    process.exit(1);
  }
  const found = data.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  if (found) userId = found.id;
  if (data.users.length < 200) break;
}

if (!userId) {
  console.error(`Nenhum usuário encontrado com o e-mail ${email}.`);
  process.exit(1);
}

const { data: factorsData, error: listErr } = await admin.auth.admin.mfa.listFactors({ userId });
if (listErr) {
  console.error("Erro ao listar fatores:", listErr.message);
  process.exit(1);
}

const factors = factorsData?.factors ?? [];
if (factors.length === 0) {
  console.log("Nenhum fator 2FA cadastrado para este usuário. Nada a remover.");
  process.exit(0);
}

for (const f of factors) {
  const { error } = await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId });
  if (error) {
    console.error(`Falha ao remover fator ${f.id}:`, error.message);
  } else {
    console.log(`Fator removido: ${f.id} (${f.factor_type ?? "totp"})`);
  }
}

console.log("Concluído. O administrador poderá cadastrar um novo 2FA no próximo login.");
