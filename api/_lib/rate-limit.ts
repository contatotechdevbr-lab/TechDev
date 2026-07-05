import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Rate limiting leve (in-memory) para as Vercel Functions.
 *
 * Objetivo: mitigar brute force, credential stuffing e abuso/DoS de baixo
 * volume nos endpoints sensíveis (auth e pagamentos), sem dependências
 * externas. Observação: em serverless o estado é por instância, então isto é
 * "best effort". Para proteção forte e distribuída, recomenda-se um store
 * compartilhado (ex.: Upstash Redis) — ver o relatório de segurança.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Limpeza periódica para não vazar memória.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

/** Descobre o IP do cliente a partir dos headers da Vercel. */
export function getClientIp(req: VercelRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd ?? "";
  const ip = raw.split(",")[0].trim();
  return ip || (req.socket?.remoteAddress ?? "unknown");
}

export interface RateLimitOptions {
  /** Identificador do endpoint (namespace do bucket). */
  key: string;
  /** Máximo de requisições permitidas na janela. */
  limit: number;
  /** Janela em milissegundos. */
  windowMs: number;
}

/**
 * Aplica o rate limit. Se estourar, responde 429 e retorna `true` (bloqueado).
 * O chamador deve dar `return` quando o resultado for `true`.
 */
export function rateLimit(
  req: VercelRequest,
  res: VercelResponse,
  { key, limit, windowMs }: RateLimitOptions,
): boolean {
  const now = Date.now();
  sweep(now);

  const id = `${key}:${getClientIp(req)}`;
  const existing = buckets.get(id);

  if (!existing || existing.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    return false;
  }

  existing.count += 1;
  if (existing.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({ error: "Muitas requisições. Tente novamente em instantes." });
    return true;
  }
  return false;
}
