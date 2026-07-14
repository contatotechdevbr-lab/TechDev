import pg from "pg"
const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/g,""), ssl:{rejectUnauthorized:false} })
await c.connect()
const r = await c.query(`select ur.role, count(*) from user_roles ur group by ur.role order by 1`)
console.table(r.rows)
const a = await c.query(`select p.email, ur.role from user_roles ur join profiles p on p.id=ur.user_id where ur.role='admin'`)
console.log("Admins:"); console.table(a.rows)
await c.end()
