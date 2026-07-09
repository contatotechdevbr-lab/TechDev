-- Guarda o external_reference (UUID) enviado ao Mercado Pago na criação da Order.
-- É o identificador estável que o webhook usa para casar a notificação (que traz
-- o ID numérico do pagamento) com o registro correto em `payments`.
alter table public.payments
  add column if not exists mp_external_reference text;

create index if not exists payments_mp_external_reference_idx
  on public.payments (mp_external_reference);

create index if not exists payments_mp_order_id_idx
  on public.payments (mp_order_id);
