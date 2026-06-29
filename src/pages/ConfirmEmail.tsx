import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";

type Status = "loading" | "success" | "error";

/**
 * Página de destino do link de confirmação de e-mail.
 * Trata os dois formatos usados pelo Supabase:
 *  - PKCE / detectSessionInUrl: o token chega como ?code= (sessão criada automaticamente)
 *  - Link clássico: chega como ?token_hash=&type= (confirmamos via verifyOtp)
 * Mostra um estado claro de sucesso ou erro e redireciona o usuário.
 */
const ConfirmEmail = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const run = async () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const errorDescription = params.get("error_description");

      if (errorDescription) {
        if (!active) return;
        setStatus("error");
        setMessage(decodeURIComponent(errorDescription));
        return;
      }

      const tokenHash = params.get("token_hash");
      const type = params.get("type") as EmailOtpType | null;

      // Fluxo clássico: confirma o e-mail explicitamente.
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (!active) return;
        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }
        setStatus("success");
        return;
      }

      // Fluxo PKCE: a sessão já pode ter sido criada via detectSessionInUrl.
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setStatus("success");
        return;
      }

      // Sem token e sem sessão: link inválido ou já utilizado.
      setStatus("error");
      setMessage(
        "Não foi possível confirmar o e-mail. O link pode ter expirado ou já ter sido usado.",
      );
    };

    void run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <Link to="/" className="text-gradient">TechDev</Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 py-2 text-center">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Confirmando seu e-mail...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">E-mail confirmado!</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Sua conta foi ativada com sucesso. Agora você já pode acessar a plataforma.
                </p>
              </div>
              <Button variant="hero" className="w-full" onClick={() => navigate("/dashboard")}>
                Ir para meu painel
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <MailWarning className="h-7 w-7 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Não conseguimos confirmar</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                Voltar para o login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEmail;
