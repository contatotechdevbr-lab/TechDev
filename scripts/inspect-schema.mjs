import pg from "pg"
const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/g,""), ssl:{rejectUnauthorized:false} })
await c.connect()
const tables = (await c.query(`select table_name from information_schema.tables where table_schema='public' order by table_name`)).rows.map(r=>r.table_name)
console.log("TABELAS:", tables.join(", "))
for (const t of ["plans","clients","payments","profiles","subscriptions"]) {
  const cols = (await c.query(`select column_name,data_type from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position`,[t])).rows
  console.log(`\n== ${t} ==`); console.log(cols.map(x=>`${x.column_name}:${x.data_type}`).join(", "))
}
// enum de payment status
const en = (await c.query(`select t.typname, e.enumlabel from pg_type t join pg_enum e on e.enumtypid=t.oid where t.typname like '%status%' order by t.typname, e.enumsortorder`)).rows
console.log("\nENUMS status:", JSON.stringify(en))
await c.end()
