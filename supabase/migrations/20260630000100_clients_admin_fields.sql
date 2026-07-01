-- Adiciona os campos que o painel admin usa e que ainda não existiam na tabela clients.
-- Mantém a interface do Painel CEO totalmente funcional com persistência real.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS plano text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS valor_mensal_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS site_id uuid,
  ADD COLUMN IF NOT EXISTS next_payment date;

-- Índice auxiliar para ordenação por próximo pagamento (dashboard).
CREATE INDEX IF NOT EXISTS clients_next_payment_idx ON public.clients (next_payment);
