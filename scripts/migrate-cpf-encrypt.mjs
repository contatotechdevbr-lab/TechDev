import pg from "pg"
import crypto from "node:crypto"

// Mesma logica de api/_lib/crypto.ts (AES-256-GCM)
function getKey() {
  const raw = process.env.PROFILE_ENCRYPTION_KEY
  if (!raw) throw new Error("PROFILE_ENCRYPTION_KEY ausente")
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) throw new Error("Chave deve ter 32 bytes (base64)")
  return key
}
function encrypt(plain) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`
}

const raw = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
const c = new pg.Client({ connectionString: raw.replace(/[?&]sslmode=[^&]*/g, ""), ssl: { rejectUnauthorized: false } })
await c.connect()

// Migra apenas linhas com cpf em texto puro e sem versao criptografada.
const { rows } = await c.query(
  `select id, cpf from profiles where cpf is not null and cpf <> '' and (cpf_encrypted is null or cpf_encrypted = '')`,
)
console.log(`CPFs a migrar: ${rows.length}`)

let ok = 0
for (const r of rows) {
  const enc = encrypt(String(r.cpf))
  await c.query(`update profiles set cpf_encrypted = $1, cpf = null where id = $2`, [enc, r.id])
  ok++
}
console.log(`Migrados e limpos (texto puro removido): ${ok}`)

// Verificacao: nao deve restar cpf em texto puro
const check = await c.query(`select count(*)::int as restantes from profiles where cpf is not null and cpf <> ''`)
console.log("CPFs em texto puro restantes:", check.rows[0].restantes)
await c.end()
