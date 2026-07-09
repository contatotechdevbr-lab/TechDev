import crypto from "node:crypto";

/**
 * Criptografia de campos sensíveis (ex.: CPF) em nível de aplicação.
 *
 * Usa AES-256-GCM (cifra autenticada). A chave vive APENAS no servidor
 * (variável de ambiente PROFILE_ENCRYPTION_KEY) — nunca no banco nem no cliente.
 * Assim, mesmo com acesso de leitura à tabela, o valor é inútil sem a chave.
 *
 * Formato do texto cifrado: "v1:<iv_b64>:<tag_b64>:<ciphertext_b64>"
 */
const PREFIX = "v1";

function getKey(): Buffer {
  const raw = process.env.PROFILE_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("PROFILE_ENCRYPTION_KEY não configurada.");
  }
  // Aceita base64 (32 bytes) ou hex (64 chars). Faz fallback por hash SHA-256.
  let key: Buffer;
  try {
    const b = Buffer.from(raw, "base64");
    key = b.length === 32 ? b : crypto.createHash("sha256").update(raw).digest();
  } catch {
    key = crypto.createHash("sha256").update(raw).digest();
  }
  return key;
}

export function encryptField(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptField(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    // Valor legado (texto puro) ou formato desconhecido: devolve como veio.
    return payload;
  }
  try {
    const key = getKey();
    const iv = Buffer.from(parts[1], "base64");
    const tag = Buffer.from(parts[2], "base64");
    const ciphertext = Buffer.from(parts[3], "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    return null;
  }
}

/** Mascara o CPF para exibição segura: 000.***.***-00 */
export function maskCpf(cpf: string | null): string | null {
  if (!cpf) return null;
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}
