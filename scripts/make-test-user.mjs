import { createClient } from "@supabase/supabase-js"

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = "qa_login_test@example.com"
const password = "SenhaTeste12345"

// remove se já existir
const { data: list } = await admin.auth.admin.listUsers()
const existing = list?.users?.find((u) => u.email === email)
if (existing) {
  await admin.auth.admin.deleteUser(existing.id)
  console.log("removido usuário anterior")
}

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: "QA Login Test" },
})
if (error) {
  console.error("erro ao criar:", error.message)
  process.exit(1)
}
console.log("criado:", data.user.id, email)
console.log("SENHA:", password)
