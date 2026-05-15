# Plano: TechDev SaaS

Vou construir em **4 fases incrementais**. Cada fase é testável de forma independente. Aprove para eu começar pela Fase 1.

---

## Fase 1 — Fundação (Auth + Banco + Estrutura)

**O que entrega:**
- Login/cadastro por email+senha e Google
- Tabelas: `profiles`, `user_roles` (com enum `app_role`: admin/user), `plans`, `subscriptions`, `payments`
- RLS configurada (usuário só vê os próprios dados; admin vê tudo)
- Função `has_role()` segura para verificar admin sem recursão
- Você se torna admin manualmente após o primeiro cadastro (insert direto)
- Página `/auth` (login/cadastro) e `/dashboard` (cliente vê assinatura atual)
- Página `/admin` protegida por role

## Fase 2 — Landing + Seção de Planos

- Mantém a landing atual
- Nova seção **"Planos"** com 3 cards (Básico, Profissional, Enterprise) ou os que você definir
- Botão **"Assinar agora"** abre modal de checkout (UI pronta, sem cobrança ainda)
- Substitui CTA de WhatsApp por CTA de assinatura no hero (mantém WhatsApp flutuante para dúvidas)

## Fase 3 — Integração Pagar.me

- Edge function `pagarme-create-customer` — cria customer no Pagar.me
- Edge function `pagarme-create-subscription` — assinatura recorrente mensal
- Edge function `pagarme-create-order` — compra única com parcelamento em até 12x
- Edge function `pagarme-webhook` — recebe eventos (paid, failed, canceled) e atualiza tabelas
- Edge function `pagarme-cancel-subscription`
- Tokenização do cartão no **frontend** via SDK Pagar.me (CARD_HASH_KEY pública) — servidor nunca vê PAN/CVV
- Modal de checkout com: nome, email, CPF, cartão, escolha mensal vs único, cálculo dinâmico de parcelas
- Secrets necessários: `PAGARME_API_KEY` (privada) e `PAGARME_PUBLIC_KEY`

## Fase 4 — Painel Admin (CEO)

- `/admin/clientes` — lista todos os clientes com busca por email
- `/admin/clientes/:id` — detalhe: assinatura, histórico de pagamentos, status
- Ações: criar plano personalizado para cliente, alterar valor, suspender, cancelar assinatura (chama edge function que cancela no Pagar.me)
- `/admin/planos` — CRUD dos planos públicos
- Tabela `custom_plans` ligada a `user_id` para preços individuais

---

## Detalhes técnicos

**Schema principal:**

```text
profiles            (id=auth.uid, full_name, email, cpf, pagarme_customer_id)
user_roles          (user_id, role: 'admin'|'user')
plans               (id, name, description, price_cents, interval, features[], active)
custom_plans        (id, user_id, base_plan_id, price_cents, interval, notes)
subscriptions       (id, user_id, plan_id|custom_plan_id, pagarme_subscription_id,
                     status, current_period_end)
payments            (id, user_id, subscription_id, amount_cents, installments,
                     status, pagarme_charge_id, paid_at)
```

**Segurança:**
- Roles em tabela separada + `has_role()` security definer (evita escalada de privilégio)
- Webhooks Pagar.me validados por assinatura HMAC
- Cartão tokenizado no browser; servidor armazena apenas `card_id` do Pagar.me
- Edge functions validam JWT do usuário em todas ações sensíveis

**Stack adicional:** Edge functions Deno + SDK Pagar.me via REST (não há SDK oficial pra Deno; uso `fetch` direto).

---

## O que preciso de você (apenas quando chegarmos na Fase 3)

1. Conta Pagar.me criada (sandbox basta para testar)
2. `PAGARME_API_KEY` (chave secreta — modo teste ou produção)
3. `PAGARME_PUBLIC_KEY` (encryption key pública pra tokenização no front)
4. Webhook URL será gerada automaticamente — você cola no painel Pagar.me

Para Fase 1 e 2 **não preciso de nada** — começo imediatamente após aprovação.

---

## Próximo passo

Aprove o plano e eu começo a **Fase 1** (auth + schema + admin protegido). Estimativa: 1 rodada de implementação.