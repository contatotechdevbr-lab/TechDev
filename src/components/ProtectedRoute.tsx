import { Navigate, useNavigate } from "react-router-dom";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { TermsGate } from "@/components/TermsGate";
import { AdminMfaGate } from "@/components/admin/AdminMfaGate";

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando seu acesso...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6 rounded-xl border border-border bg-card p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">Acesso restrito</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta área é exclusiva para administradores da TechDev. Sua conta{" "}
              <span className="text-foreground font-medium">{user.email}</span> está
              conectada, mas ainda não tem permissão de administrador.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Ir para meu painel
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await signOut();
                navigate("/auth");
              }}
              className="w-full"
            >
              Sair e entrar com outra conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Todo acesso interno exige aceite dos termos na versão atual.
  // O painel admin exige, adicionalmente, verificação em duas etapas (2FA).
  return (
    <TermsGate>
      {requireAdmin ? <AdminMfaGate>{children}</AdminMfaGate> : children}
    </TermsGate>
  );
};
