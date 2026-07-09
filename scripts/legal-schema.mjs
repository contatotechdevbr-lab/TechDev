import pg from "pg"
const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/g,""), ssl:{rejectUnauthorized:false} })
await c.connect()
console.log("COLUNAS:")
console.table((await c.query(`select column_name,data_type,is_nullable from information_schema.columns where table_schema='public' and table_name='legal_acceptances' order by ordinal_position`)).rows)
console.log("POLICIES:")
console.table((await c.query(`select policyname,cmd,roles::text,qual,with_check from pg_policies where schemaname='public' and tablename='legal_acceptances'`)).rows)
await c.end()
