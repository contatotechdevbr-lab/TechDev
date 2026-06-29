import { createHash } from "node:crypto";

/** Janela de validade do código (minutos). */
export const OTP_TTL_MINUTES = 10;
/** Intervalo mínimo entre reenvios (segundos). */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
/** Número máximo de tentativas de verificação por código. */
export const OTP_MAX_ATTEMPTS = 5;

/** Gera um código numérico de 6 dígitos (000000–999999). */
export function generateOtpCode(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return n.toString().padStart(6, "0");
}

/**
 * Hash determinístico do código. Guardamos apenas o hash no banco,
 * nunca o código em texto puro. O user_id entra como "sal" para evitar
 * que o mesmo código gere o mesmo hash entre usuários diferentes.
 */
export function hashOtp(code: string, userId: string): string {
  return createHash("sha256").update(`${userId}:${code}`).digest("hex");
}
