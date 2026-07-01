-- Plano único de assinatura: desconto à vista e recorrência configuráveis por plano.

-- plans: desconto do pagamento à vista (12 meses) e flags de meios aceitos.
alter table public.plans
  add column if not exists discount_annual_pct integer not null default 20,
  add column if not exists allow_recurring boolean not null default true,
  add column if not exists allow_upfront boolean not null default true;

-- subscriptions: distingue à vista de recorrência e guarda o id da assinatura no MP.
alter table public.subscriptions
  add column if not exists billing_type text,
  add column if not exists mp_preapproval_id text,
  add column if not exists mp_external_reference text;

-- payments: marca o tipo de cobrança para relatórios/financeiro.
alter table public.payments
  add column if not exists billing_type text;

-- Índices para casar notificações/reconciliação por preapproval e external_reference.
create index if not exists idx_subscriptions_preapproval on public.subscriptions (mp_preapproval_id);
create index if not exists idx_subscriptions_external_ref on public.subscriptions (mp_external_reference);
