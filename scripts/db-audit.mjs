import pg from "pg"
const { Client } = pg
const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
const conn = raw.replace(/[?&]sslmode=[^&]*/g, "")
const c = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
await c.connect()

const q = async (label, sql) => {
  try {
    const r = await c.query(sql)
    console.log(`\n### ${label}`)
    console.table(r.rows)
  } catch (e) {
    console.log(`\n### ${label} -> ERRO: ${e.message}`)
  }
}

await q(
  "RLS por tabela (public)",
  `select relname as tabela, relrowsecurity as rls_on, relforcerowsecurity as rls_forced
   from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r' order by relname;`
)

await q(
  "Politicas RLS",
  `select tablename, policyname, cmd, roles::text as roles, qual, with_check
   from pg_policies where schemaname='public' order by tablename, policyname;`
)

await q(
  "Tabelas roles/admin/profile",
  `select table_name from information_schema.tables
   where table_schema='public' and (table_name ilike '%role%' or table_name ilike '%admin%' or table_name ilike '%profile%');`
)

await q(
  "Funcoes SECURITY DEFINER (public)",
  `select p.proname as func, p.prosecdef as security_definer
   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' order by p.proname;`
)

await c.end()
