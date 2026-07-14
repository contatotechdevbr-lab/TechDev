import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Cliente, StatusCliente } from "./mock-data";

// Store de clientes conectado ao Supabase, com sincronização em tempo real.
// Mantém a MESMA assinatura pública de antes (useClientes, clientesStore.add/
// update/remove/getById) para que todas as telas do Painel CEO continuem
// funcionando sem alteração — mas agora lendo/escrevendo no banco de verdade.

// Linha da tabela public.clients
interface ClientRow {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: StatusCliente;
  notes: string | null;
  avatar_color: string | null;
  plano: string | null;
  valor_mensal_cents: number | null;
  site_id: string | null;
  next_payment: string | null;
  created_at: string;
}

const DEFAULT_COLOR = "205 85% 55%";

// DB -> tipo usado pela interface
const toCliente = (r: ClientRow): Cliente => ({
  id: r.id,
  nome: r.full_name || "",
  empresa: r.company || "",
  email: r.email || "",
  telefone: r.phone || "",
  plano: r.plano || "",
  valorMensalCents: r.valor_mensal_cents ?? 0,
  contratacao: r.created_at,
  status: r.status,
  siteId: r.site_id,
  proximoPagamento: r.next_payment || r.created_at,
  observacoes: r.notes || "",
  avatarCor: r.avatar_color || DEFAULT_COLOR,
});

// tipo usado pela interface -> colunas do DB
const toRow = (c: Partial<Cliente>): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if (c.nome !== undefined) row.full_name = c.nome;
  if (c.empresa !== undefined) row.company = c.empresa;
  if (c.email !== undefined) row.email = c.email;
  if (c.telefone !== undefined) row.phone = c.telefone;
  if (c.plano !== undefined) row.plano = c.plano;
  if (c.valorMensalCents !== undefined) row.valor_mensal_cents = c.valorMensalCents;
  if (c.status !== undefined) row.status = c.status;
  if (c.siteId !== undefined) row.site_id = c.siteId;
  if (c.proximoPagamento !== undefined) row.next_payment = c.proximoPagamento;
  if (c.observacoes !== undefined) row.notes = c.observacoes;
  if (c.avatarCor !== undefined) row.avatar_color = c.avatarCor;
  return row;
};

let state: Cliente[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const setState = (next: Cliente[]) => {
  state = next;
  emit();
};

const upsertLocal = (c: Cliente) => {
  const idx = state.findIndex((x) => x.id === c.id);
  if (idx === -1) setState([c, ...state]);
  else setState(state.map((x) => (x.id === c.id ? c : x)));
};

const removeLocal = (id: string) => setState(state.filter((c) => c.id !== id));

const fetchAll = async () => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[v0] erro ao carregar clientes:", error.message);
    return;
  }
  setState((data as ClientRow[]).map(toCliente));
};

// Assina mudanças em tempo real (INSERT/UPDATE/DELETE) na tabela clients.
let channelStarted = false;
const startRealtime = () => {
  if (channelStarted) return;
  channelStarted = true;
  supabase
    .channel("clients-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, (payload) => {
      if (payload.eventType === "DELETE") {
        removeLocal((payload.old as ClientRow).id);
      } else {
        upsertLocal(toCliente(payload.new as ClientRow));
      }
    })
    .subscribe();
};

const ensureLoaded = () => {
  if (loaded) return;
  loaded = true;
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
    return state;
  },
  async add(cliente: Omit<Cliente, "id">) {
    const { data, error } = await supabase
      .from("clients")
      .insert(toRow(cliente))
      .select("*")
      .single();
    if (error) {
      console.error("[v0] erro ao adicionar cliente:", error.message);
      throw error;
    }
    const novo = toCliente(data as ClientRow);
    upsertLocal(novo);
    return novo;
  },
  async update(id: string, patch: Partial<Cliente>) {
    // atualização otimista
    const anterior = state;
    setState(state.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase.from("clients").update(toRow(patch)).eq("id", id);
    if (error) {
      console.error("[v0] erro ao atualizar cliente:", error.message);
      setState(anterior);
      throw error;
    }
  },
  async remove(id: string) {
    const anterior = state;
    removeLocal(id);
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      console.error("[v0] erro ao remover cliente:", error.message);
      setState(anterior);
      throw error;
    }
  },
  getById(id: string | undefined) {
    return state.find((c) => c.id === id);
  },
  refetch: fetchAll,
};

export const useClientes = () => useSyncExternalStore(store.subscribe, store.getSnapshot);
export const clientesStore = store;
