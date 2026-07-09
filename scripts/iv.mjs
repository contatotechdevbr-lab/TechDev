import pg from "pg"
const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/g,""), ssl:{rejectUnauthorized:false} })
await c.connect()
const en = (await c.query(`select t.typname, e.enumlabel from pg_type t join pg_enum e on e.enumtypid=t.oid where t.typname in ('plan_interval','billing_interval') or t.typname like '%interval%' order by t.typname, e.enumsortorder`)).rows
console.log("interval enums:", JSON.stringify(en))
// tipo real da coluna interval em custom_plans
const col = (await c.query(`select udt_name from information_schema.columns where table_name='custom_plans' and column_name='interval'`)).rows
console.log("custom_plans.interval udt:", JSON.stringify(col))
await c.end()
