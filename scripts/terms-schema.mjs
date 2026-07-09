import pg from "pg"
const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/g,""), ssl:{rejectUnauthorized:false} })
await c.connect()
const r = await c.query(`
  select table_name, column_name, data_type
  from information_schema.columns
  where table_schema='public' and (
    column_name ilike '%term%' or column_name ilike '%privacy%' or column_name ilike '%accept%'
    or column_name ilike '%consent%' or table_name ilike '%term%' or table_name ilike '%consent%')
  order by table_name, ordinal_position`)
console.table(r.rows)
const p = await c.query(`select column_name, data_type from information_schema.columns where table_schema='public' and table_name='profiles' order by ordinal_position`)
console.log("PROFILES:"); console.table(p.rows)
await c.end()
