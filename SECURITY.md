# Política de Segurança

## Como reportar uma vulnerabilidade

Se você encontrar uma vulnerabilidade de segurança neste projeto, **não abra uma
issue pública**. Envie um e-mail para a equipe TechDev descrevendo o problema e,
se possível, os passos para reproduzi-lo. Responderemos o mais rápido possível.

## Práticas adotadas neste repositório

- **Segredos:** nenhum segredo de servidor é versionado. Chaves sensíveis
  (`SUPABASE_SERVICE_ROLE_KEY`, `MERCADO_PAGO_ACCESS_TOKEN`, `RESEND_API_KEY`,
  `MERCADO_PAGO_WEBHOOK_SECRET`, etc.) ficam apenas nas Environment Variables da
  Vercel. O arquivo `.env` versionado contém somente chaves públicas `VITE_`
  (anon/publishable), destinadas ao navegador e protegidas por RLS no Supabase.
- **Backend:** todas as rotas `/api` sensíveis exigem autenticação via JWT da
  sessão do Supabase, derivam o usuário do token (nunca do corpo) e aplicam
  rate limiting.
- **Banco de dados:** Row Level Security (RLS) habilitado em todas as tabelas de
  dados de usuário, com papéis (`roles`) em tabela separada.
- **Cabeçalhos HTTP:** CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy` e `Permissions-Policy` configurados em `vercel.json`.
- **Dependências:** monitoradas pelo Dependabot (`.github/dependabot.yml`).

## Recomendações de configuração no GitHub

Estas proteções são configuradas na interface do GitHub (não no código):

- Ativar **2FA obrigatório** na conta/organização.
- Ativar **Dependabot alerts** e **security updates** em *Settings > Code security*.
- Configurar **Branch Protection Rules** na branch `main` (exigir Pull Request e
  revisão antes do merge, bloquear force-push).
- Manter o **Secret Scanning** e o **Push Protection** habilitados.
