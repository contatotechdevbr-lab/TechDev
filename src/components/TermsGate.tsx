import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/config/legal";

type Status = "checking" | "accepted" | "needed";

/**
 * Garante que todo usuário autenticado tenha aceitado a versão ATUAL dos Termos
 * de Uso e da Política de Privacidade antes de acessar áreas internas.
 *
 * Cobre principalmente quem entra via OAuth (Google), que não passa pelo fluxo
 * de cadastro por e-mail, além de forçar novo aceite quando a versão muda.
 */
export const TermsGate = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("checking");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setStatus("checking");
      return;
    }

    supabase
      .from("legal_acceptances")
      .select("id")
      .eq("user_id", user.id)
      .eq("terms_version", TERMS_VERSION)
      .eq("privacy_version", PRIVACY_VERSION)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        // Em caso de erro de leitura, não bloqueia indevidamente o acesso.
        if (error) {
          setStatus("accepted");
          return;
        }
        setStatus(data ? "accepted" : "needed");
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleAccept = async () => {
    if (!accepted) return;
    setBusy(true);
    try {
      const res = await apiFetch("/api/auth/accept-terms", {
        method: "POST",
        body: JSON.stringify({
          termsVersion: TERMS_VERSION,
          privacyVersion: PRIVACY_VERSION,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          title: "Não foi possível registrar",
          description: (data as { error?: string }).error ?? "Tente novamente.",
          variant: "destructive",
        });
        return;
      }
      setStatus("accepted");
      toast({ title: "Tudo certo!", description: "Aceite registrado com sucesso." });
    } finally {
      setBusy(false);
    }
  };

  if (status === "checking") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (status === "needed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full space-y-6 rounded-xl border border-border bg-card p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold text-foreground">Antes de continuar</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para usar sua conta na TechDev, você precisa ler e aceitar nossos documentos legais.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
            <Checkbox
              id="gate-accept"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="gate-accept"
              className="text-sm font-normal leading-relaxed text-muted-foreground cursor-pointer"
            >
              Li e aceito os{" "}
              <Link
                to="/termos-de-uso"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link
                to="/politica-de-privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Política de Privacidade
              </Link>{" "}
              da TechDev.
            </Label>
          </div>

          <Button
            variant="hero"
            className="w-full"
            disabled={!accepted || busy}
            onClick={() => void handleAccept()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aceitar e continuar"}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
