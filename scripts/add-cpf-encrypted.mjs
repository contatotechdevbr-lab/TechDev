import pg from "pg";
const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/g, ""), ssl: { rejectUnauthorized: false } });
await c.connect();
await c.query(`alter table public.profiles add column if not exists cpf_encrypted text`);
console.log("Coluna cpf_encrypted garantida.");
const r = await c.query(`select count(*)::int as com_cpf from public.profiles where cpf is not null and cpf <> ''`);
console.log("Perfis com CPF em texto puro a migrar:", r.rows[0].com_cpf);
await c.end();
