import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { getAuthedUser } from "../_lib/require-auth.js";
import { rateLimit } from "../_lib/rate-limit.js";
import { encryptField, decryptField } from "../_lib/crypto.js";

/**
 * Dados de cobrança do próprio usuário (CPF + endereço).
 *
 * - GET  -> devolve o CPF descriptografado e o endereço, para pré-preencher.
 * - POST -> criptografa o CPF (AES-256-GCM) e salva junto ao endereço.
 *
 * O CPF NUNCA é gravado em texto puro: fica apenas em `cpf_encrypted`.
 * A identidade vem sempre do JWT (getAuthedUser) — nunca do corpo.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rateLimit(req, res, { key: "profile-billing", limit: 30, windowMs: 10 * 60_000 })) return;

  const authed = await getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Autenticação necessária." });

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("cpf, cpf_encrypted, address_city, address_state, address_zip_code")
      .eq("id", authed.id)
      .maybeSingle();
    if (error) return res.status(500).json({ error: "Erro ao carregar dados." });

    const row = (data ?? {}) as {
      cpf?: string | null;
      cpf_encrypted?: string | null;
      address_city?: string | null;
      address_state?: string | null;
      address_zip_code?: string | null;
    };
    // Prioriza o valor criptografado; cai para o legado (texto puro) se existir.
    const cpf = row.cpf_encrypted ? decryptField(row.cpf_encrypted) : row.cpf ?? null;
    return res.status(200).json({
      cpf: cpf ?? "",
      addressCity: row.address_city ?? "",
      addressState: row.address_state ?? "",
      addressZipCode: row.address_zip_code ?? "",
    });
  }

  if (req.method === "POST") {
    try {
      const { cpf, addressCity, addressState, addressZipCode } = (req.body ?? {}) as {
        cpf?: string;
        addressCity?: string;
        addressState?: string;
        addressZipCode?: string;
      };

      const update: Record<string, string | null> = {};
      if (typeof cpf === "string" && cpf.trim()) {
        update.cpf_encrypted = encryptField(cpf.trim());
        update.cpf = null; // remove qualquer texto puro remanescente
      }
      if (typeof addressCity === "string") update.address_city = addressCity.trim() || null;
      if (typeof addressState === "string") update.address_state = addressState.trim().toUpperCase().slice(0, 2) || null;
      if (typeof addressZipCode === "string") update.address_zip_code = addressZipCode.replace(/\D/g, "") || null;

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: "Nada para salvar." });
      }

      const { error } = await supabaseAdmin.from("profiles").update(update).eq("id", authed.id);
      if (error) {
        console.error("[v0] billing update error:", error);
        return res.status(500).json({ error: "Erro ao salvar os dados." });
      }
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[v0] billing error:", err);
      const msg = err instanceof Error && /PROFILE_ENCRYPTION_KEY/.test(err.message)
        ? "Criptografia não configurada no servidor."
        : "Erro interno.";
      return res.status(500).json({ error: msg });
    }
  }

  return res.status(405).json({ error: "Método não permitido" });
}
