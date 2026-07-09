import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Pagamento, Assinatura, StatusPagamento, StatusAssinatura } from "./mock-data";

// Store de finanças conectado ao Supabase, com sincronização em tempo real.
// Lê as tabelas reais (payments, subscriptions, plans, clients) e as expõe
// no formato usado pelo Painel CEO (Pagamento / Assinatura), para que
// Dashboard, Financeiro, Assinaturas e Relatórios reflitam o dinheiro real.

interface PaymentRow {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  amount_cents: number | null;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  payer_email: string | null;
}

interface SubscriptionRow {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  status: string;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
}

interface PlanRow {
  id: string;
  name: string;
  price_cents: number | null;
}

interface ClientLite {
  user_id: string | null;
  full_name: string;
  company: string | null;
}

export interface FinancasSnapshot {
  pagamentos: Pagamento[];
  assinaturas: Assinatura[];
  loaded: boolean;
}

// --- mapeamentos de status (banco -> interface) ---
const mapPagamentoStatus = (s: string): StatusPagamento => {
  switch (s) {
    case "paid":
      return "pago";
    case "pending":
      return "pendente";
    default:
      // failed, refunded, canceled → tratados como "atrasado" na interface
      return "atrasado";
  }
};

const mapAssinaturaStatus = (s: string): StatusAssinatura => {
  switch (s) {
    case "active":
      return "ativa";
    case "paused":
      return "pausada";
    case "past_due":
    case "unpaid":
      return "atrasada";
    default:
      // canceled, incomplete, etc.
      return "cancelada";
  }
};

const mapMetodo = (m: string | null): Pagamento["metodo"] => {
  const v = (m || "").toLowerCase();
  if (v.includes("pix")) return "Pix";
  if (v.includes("boleto") || v.includes("ticket")) return "Boleto";
  if (v.includes("transfer")) return "Transferência";
  return "Cartão";
};

// --- estado do store ---
let payments: PaymentRow[] = [];
let subscriptions: SubscriptionRow[] = [];
let plans: PlanRow[] = [];
let clients: ClientLite[] = [];
let loaded = false;
let snapshot: FinancasSnapshot = { pagamentos: [], assinaturas: [], loaded: false };

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const rebuild = () => {
  const planById = new Map(plans.map((p) => [p.id, p]));
  const clientByUser = new Map(clients.filter((c) => c.user_id).map((c) => [c.user_id as string, c]));

  const pagamentos: Pagamento[] = payments.map((p) => {
    const plano = p.plan_id ? planById.get(p.plan_id) : undefined;
    return {
      id: p.id,
      clienteId: p.user_id ?? "",
      plano: plano?.name ?? "—",
      valorCents: p.amount_cents ?? plano?.price_cents ?? 0,
      data: p.paid_at ?? p.created_at,
      status: mapPagamentoStatus(p.status),
      metodo: mapMetodo(p.payment_method),
    };
  });

  const assinaturas: Assinatura[] = subscriptions.map((s) => {
    const plano = s.plan_id ? planById.get(s.plan_id) : undefined;
    return {
      id: s.id,
      clienteId: s.user_id ?? "",
      plano: plano?.name ?? "—",
      valorCents: plano?.price_cents ?? 0,
      renovacao: s.current_period_end ?? s.created_at,
      status: mapAssinaturaStatus(s.status),
      cicloMeses: 1,
    };
  });

  snapshot = { pagamentos, assinaturas, loaded };
  emit();
};

// resolve nome/empresa do cliente a partir do user_id (para tabelas e exportação)
const clientMap = new Map<string, ClientLite>();
export const clienteInfoByUserId = (userId: string) => clientMap.get(userId);

const fetchAll = async () => {
  const [payRes, subRes, planRes, cliRes] = await Promise.all([
    supabase.from("payments").select("*").order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    supabase.from("plans").select("id, name, price_cents"),
    supabase.from("clients").select("user_id, full_name, company"),
  ]);

  if (payRes.error) console.error("[v0] erro ao carregar payments:", payRes.error.message);
  if (subRes.error) console.error("[v0] erro ao carregar subscriptions:", subRes.error.message);
  if (planRes.error) console.error("[v0] erro ao carregar plans:", planRes.error.message);
  if (cliRes.error) console.error("[v0] erro ao carregar clients:", cliRes.error.message);

  payments = (payRes.data as PaymentRow[]) ?? [];
  subscriptions = (subRes.data as SubscriptionRow[]) ?? [];
  plans = (planRes.data as PlanRow[]) ?? [];
  clients = (cliRes.data as ClientLite[]) ?? [];

  clientMap.clear();
  clients.forEach((c) => {
    if (c.user_id) clientMap.set(c.user_id, c);
  });

  loaded = true;
  rebuild();
};

let channelStarted = false;
const startRealtime = () => {
  if (channelStarted) return;
  channelStarted = true;
  supabase
    .channel("financas-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, fetchAll)
    .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, fetchAll)
    .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, fetchAll)
    .subscribe();
};

const ensureLoaded = () => {
  if (loaded) return;
  fetchAll();
  startRealtime();
};

const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    ensureLoaded();
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return snapshot;
  },
  refetch: fetchAll,
};

export const useFinancas = () => useSyncExternalStore(store.subscribe, store.getSnapshot);
export const financasStore = store;

// --- helpers de agregação para gráficos ---

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Receita paga agrupada pelos últimos N meses. `valor` em reais (padrão dos gráficos). */
export const faturamentoPorMes = (pagamentos: Pagamento[], meses = 6) => {
  const agora = new Date();
  const buckets: { mes: string; valor: number; chave: string }[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    buckets.push({
      mes: MESES_PT[d.getMonth()],
      valor: 0,
      chave: `${d.getFullYear()}-${d.getMonth()}`,
    });
  }
  const idx = new Map(buckets.map((b, i) => [b.chave, i]));
  pagamentos
    .filter((p) => p.status === "pago")
    .forEach((p) => {
      const d = new Date(p.data);
      const chave = `${d.getFullYear()}-${d.getMonth()}`;
      const i = idx.get(chave);
      if (i !== undefined) buckets[i].valor += p.valorCents / 100;
    });
  return buckets.map(({ mes, valor }) => ({ mes, valor: Math.round(valor) }));
};

const PALETA = ["205 85% 55%", "152 60% 50%", "38 92% 55%", "280 65% 60%", "0 70% 55%", "190 80% 50%"];

/** Distribuição de assinaturas ativas por plano, com cor para o gráfico. */
export const distribuicaoPorPlano = (assinaturas: Assinatura[]) => {
  const cont = new Map<string, number>();
  assinaturas
    .filter((a) => a.status === "ativa")
    .forEach((a) => cont.set(a.plano, (cont.get(a.plano) ?? 0) + 1));
  return Array.from(cont.entries()).map(([plano, quantidade], i) => ({
    plano,
    quantidade,
    cor: PALETA[i % PALETA.length],
  }));
};

/** Total de receita paga (em cents). */
export const receitaPagaCents = (pagamentos: Pagamento[]) =>
  pagamentos.filter((p) => p.status === "pago").reduce((a, p) => a + p.valorCents, 0);

/** MRR: soma do valor das assinaturas ativas (em cents). */
export const mrrCents = (assinaturas: Assinatura[]) =>
  assinaturas.filter((a) => a.status === "ativa").reduce((a, s) => a + s.valorCents, 0);
