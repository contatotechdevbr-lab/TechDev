import pg from "pg"
const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/g,""), ssl:{rejectUnauthorized:false} })
await c.connect()
console.log("== custom_plans colunas ==")
console.log((await c.query(`select column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' and table_name='custom_plans' order by ordinal_position`)).rows.map(x=>`${x.column_name}:${x.data_type}${x.is_nullable==='NO'?' NOT NULL':''}`).join("\n"))
console.log("\n== RLS policies custom_plans ==")
console.log((await c.query(`select policyname,cmd,roles::text,qual,with_check from pg_policies where schemaname='public' and tablename='custom_plans'`)).rows)
console.log("\n== linhas existentes ==", (await c.query(`select count(*)::int c from custom_plans`)).rows[0].c)
await c.end()
