import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { findUserByEmail } from "../_lib/auth-users.js";
import {
  generateCode,
  hashCode,
  codeMatches,
  sendPasswordResetEmail,
  OTP_TTL_MINUTES,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "../_lib/otp.js";
import { rateLimit } from "../_lib/rate-limit.js";

/**
 * POST /api/auth/password-reset  — endpoint único de recuperação de senha.
 *
 * Envia o e-mail de redefinição pelo NOSSO provedor (Resend) com a marca
 * TechDev, em vez do template padrão do Supabase. Isso resolve dois problemas:
 *   1) o e-mail feio "powered by Supabase";
 *   2) o limite baixíssimo do SMTP compartilhado do Supabase (que impedia o
 *      reenvio). Agora o cooldown é nosso (OTP_RESEND_COOLDOWN_SECONDS).
 *
 * O código (6 dígitos) é guardado apenas como hash no app_metadata do usuário
 * (não editável pelo cliente), com validade e contador de tentativas.
 *
 *  - Corpo { email }                    -> SOLICITAÇÃO (envia o código)
 *  - Corpo { email, code, password }    -> CONFIRMAÇÃO (define a nova senha)
 *
 * Segurança: nunca revela se o e-mail existe (resposta sempre genérica).
 */

type ResetMeta = { hash: string; exp: number; attempts: number; sentAt: number };

/** Regras de força da nova senha (validadas também no servidor). */
function passwordIssue(pw: string): string | null {
  if (typeof pw !== "string" || pw.length < 8) return "A senha deve ter ao menos 8 caracteres.";
  if (pw.length > 72) return "A senha é muito longa (máximo 72 caracteres).";
  if (!/[a-z]/.test(pw)) return "A senha deve conter uma letra minúscula.";
  if (!/[A-Z]/.test(pw)) return "A senha deve conter uma letra maiúscula.";
  if (!/\d/.test(pw)) return "A senha deve conter um número.";
  return null;
}

const firstName = (u: { user_metadata?: Record<string, unknown> } | null): string | undefined => {
  const full = (u?.user_metadata?.full_name as string | undefined) ?? undefined;
  return full;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { email, code, password } = (req.body ?? {}) as {
    email?: string;
    code?: string;
    password?: string;
  };
  const emailNorm = (email ?? "").trim().toLowerCase();

  if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return res.status(400).json({ error: "Informe um e-mail válido." });
  }

  // Distingue os dois modos pelo corpo.
  const isConfirm = typeof code === "string" && typeof password === "string";

  if (isConfirm) {
    return handleConfirm(req, res, emailNorm, code!.trim(), password!);
  }
  return handleRequest(req, res, emailNorm);
}

/** SOLICITAÇÃO: gera o código, guarda o hash e envia o e-mail branded. */
async function handleRequest(req: VercelRequest, res: VercelResponse, email: string) {
  if (rateLimit(req, res, { key: "pwd-reset-request", limit: 8, windowMs: 10 * 60_000 })) return;

  // Resposta genérica para não revelar se o e-mail existe.
  const generic = {
    ok: true,
    message:
      "Se houver uma conta associada a este e-mail, enviamos um código para redefinir a senha.",
  };

  try {
    const user = await findUserByEmail(email);
    // Só envia para contas existentes e confirmadas; caso contrário, resposta genérica.
    if (!user || !user.confirmed) {
      return res.status(200).json(generic);
    }

    const { data: full } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const meta = (full?.user?.app_metadata?.pwd_reset as ResetMeta | undefined) ?? null;

    // Cooldown: evita spam de e-mail. Dentro da janela, responde genérico sem reenviar.
    if (meta?.sentAt && (Date.now() - meta.sentAt) / 1000 < OTP_RESEND_COOLDOWN_SECONDS) {
      return res.status(200).json(generic);
    }

    const code = generateCode();
    const resetMeta: ResetMeta = {
      hash: hashCode(code, email),
      exp: Date.now() + OTP_TTL_MINUTES * 60 * 1000,
      attempts: 0,
      sentAt: Date.now(),
    };

    const existingAppMeta = full?.user?.app_metadata ?? {};
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...existingAppMeta, pwd_reset: resetMeta },
    });
    if (updErr) {
      console.error("[v0] password-reset request updateUser error:", updErr.message);
      return res.status(500).json({ error: "Não foi possível iniciar a redefinição agora." });
    }

    await sendPasswordResetEmail(email, code, firstName(full?.user ?? null));
    return res.status(200).json(generic);
  } catch (err) {
    console.error("[v0] password-reset request error:", err);
    // Mesmo em erro de envio, não revela existência do e-mail.
    return res.status(200).json(generic);
  }
}

/** CONFIRMAÇÃO: valida o código e define a nova senha. */
async function handleConfirm(
  req: VercelRequest,
  res: VercelResponse,
  email: string,
  code: string,
  password: string,
) {
  if (rateLimit(req, res, { key: "pwd-reset-confirm", limit: 20, windowMs: 10 * 60_000 })) return;

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Informe o código de 6 dígitos." });
  }
  const pwIssue = passwordIssue(password);
  if (pwIssue) {
    return res.status(400).json({ error: pwIssue });
  }

  const invalid = { error: "Código inválido ou expirado. Solicite um novo." };

  try {
    const user = await findUserByEmail(email);
    if (!user || !user.confirmed) {
      return res.status(400).json(invalid);
    }

    const { data: full } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const appMeta = full?.user?.app_metadata ?? {};
    const meta = (appMeta.pwd_reset as ResetMeta | undefined) ?? null;

    if (!meta || !meta.hash || !meta.exp) {
      return res.status(400).json(invalid);
    }
    if (Date.now() > meta.exp) {
      await clearResetMeta(user.id, appMeta);
      return res.status(400).json(invalid);
    }
    if ((meta.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      await clearResetMeta(user.id, appMeta);
      return res.status(429).json({ error: "Muitas tentativas. Solicite um novo código." });
    }

    if (!codeMatches(code, email, meta.hash)) {
      const attempts = (meta.attempts ?? 0) + 1;
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...appMeta, pwd_reset: { ...meta, attempts } },
      });
      const restantes = Math.max(0, OTP_MAX_ATTEMPTS - attempts);
      return res.status(400).json({
        error:
          restantes > 0
            ? `Código incorreto. Tentativas restantes: ${restantes}.`
            : "Código incorreto.",
      });
    }

    // Código correto: define a nova senha e limpa o estado de reset.
    const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
      app_metadata: { ...appMeta, pwd_reset: null },
    });
    if (pwErr) {
      console.error("[v0] password-reset confirm updateUser error:", pwErr.message);
      return res.status(500).json({ error: "Não foi possível alterar a senha. Tente novamente." });
    }

    return res.status(200).json({ ok: true, message: "Senha alterada com sucesso." });
  } catch (err) {
    console.error("[v0] password-reset confirm error:", err);
    return res.status(500).json({ error: "Erro interno. Tente novamente." });
  }
}

async function clearResetMeta(userId: string, appMeta: Record<string, unknown>) {
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { ...appMeta, pwd_reset: null },
  });
}
