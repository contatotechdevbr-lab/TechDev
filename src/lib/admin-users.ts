import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/api-client";

// Usuário exibido na aba Clientes do painel admin. Reflete a fonte real:
// auth.users (todos os cadastrados) + dados de negócio (clients/roles).
export interface AdminUser {
  userId: string;
  clientId: string | null;
  nome: string;
  email: string;
  empresa: string;
  telefone: string;
  plano: string;
  valorMensalCents: number;
  contratacao: string;
  proximoPagamento: string;
  observacoes: string;
  avatarCor: string;
  siteId: string | null;
  role: string;
  status: "ativo" | "banido" | "pendente";
  isAdmin: boolean;
}

interface UseAdminUsers {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  banUser: (userId: string, action: "ban" | "unban") => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

/**
 * Hook da aba Clientes: busca todos os usuários via /api/admin/users e mantém a
 * lista SEMPRE sincronizada com o banco:
 *  - refaz a busca ao montar, ao focar a janela e quando a aba volta a ficar
 *    visível (novos cadastros aparecem sem recarregar a página);
 *  - assina em tempo real a tabela `clients` (INSERT/UPDATE/DELETE) e refaz a
 *    busca para refletir mudanças imediatamente.
 *
 * As ações de banir/remover chamam os endpoints seguros (service role + admin)
 * e, ao concluir, refazem a busca para o status atualizar na hora.
 */
export function useAdminUsers(): UseAdminUsers {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/users");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Falha ao carregar usuários.");
      setUsers((data.users as AdminUser[]) ?? []);
      setError(null);
    } catch (err) {
      console.error("[v0] useAdminUsers refetch:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();

    // Atualiza ao voltar o foco / visibilidade (pega novos cadastros).
    const onFocus = () => void refetch();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    // Realtime: qualquer mudança em clients dispara um refetch.
    const channel = supabase
      .channel("admin-users-clients")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => {
        void refetch();
      })
      .subscribe();

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  const banUser = useCallback(
    async (userId: string, action: "ban" | "unban") => {
      const res = await apiFetch("/api/admin/user-ban", {
        method: "POST",
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Falha ao atualizar o acesso.");
      await refetch();
    },
    [refetch],
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      const res = await apiFetch("/api/admin/user-delete", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Falha ao remover o usuário.");
      await refetch();
    },
    [refetch],
  );

  return { users, loading, error, refetch, banUser, deleteUser };
}
