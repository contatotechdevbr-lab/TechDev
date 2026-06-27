import { useSyncExternalStore } from "react";
import { clientes as seed, type Cliente } from "./mock-data";

// Store em memória para os clientes (dados de exemplo).
// Pronto para ser substituído por chamadas a um banco de dados futuramente,
// mantendo a mesma assinatura (lista, add, update, remove).

let state: Cliente[] = [...seed];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  add(cliente: Omit<Cliente, "id">) {
    const novo: Cliente = { ...cliente, id: `c${Date.now()}` };
    state = [novo, ...state];
    emit();
    return novo;
  },
  update(id: string, patch: Partial<Cliente>) {
    state = state.map((c) => (c.id === id ? { ...c, ...patch } : c));
    emit();
  },
  remove(id: string) {
    state = state.filter((c) => c.id !== id);
    emit();
  },
  getById(id: string | undefined) {
    return state.find((c) => c.id === id);
  },
};

export const useClientes = () => useSyncExternalStore(store.subscribe, store.getSnapshot);
export const clientesStore = store;
