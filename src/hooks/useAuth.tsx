import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  // true assim que a verificação de permissão (admin) foi concluída.
  // Útil para decidir o redirecionamento correto sem "pular" para a rota errada.
  roleLoaded: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  roleLoaded: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    // Consulta o papel do usuário e SEMPRE conclui a verificação (mesmo em erro),
    // para nunca deixar telas dependentes de `roleLoaded` presas.
    const resolveRole = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!data);
      } catch {
        setIsAdmin(false);
      } finally {
        setRoleLoaded(true);
      }
    };

    // 1. Listener primeiro. O supabase-js emite `INITIAL_SESSION` logo ao
    //    inicializar, lendo a sessão do localStorage — isso libera a UI
    //    imediatamente, sem depender da rede nem do getSession() (que pode
    //    travar no lock de refresh de token).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        setRoleLoaded(false);
        // Defer para evitar deadlock com o lock interno do supabase-auth.
        setTimeout(() => void resolveRole(s.user.id), 0);
      } else {
        setIsAdmin(false);
        setRoleLoaded(true);
      }
    });

    // 2. Backup: hidrata direto (caso o INITIAL_SESSION demore). Não sobrescreve
    //    um estado já resolvido pelo listener e nunca deixa `loading` preso.
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession((prev) => prev ?? s);
        setUser((prev) => prev ?? s?.user ?? null);
        setLoading(false);
        if (s?.user) void resolveRole(s.user.id);
        else setRoleLoaded(true);
      })
      .catch(() => setLoading(false));

    // 3. Trava de segurança absoluta: se algo travar, libera a UI em 3s para
    //    nunca ficar preso em "Verificando seu acesso...".
    const failsafe = window.setTimeout(() => setLoading(false), 3000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(failsafe);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, session, loading, isAdmin, roleLoaded, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
