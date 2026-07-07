import { useState } from "react";
import { Link } from "react-router-dom";
import { LogoLink } from "@/components/LogoLink";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { MailCheck, Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("Informe um e-mail válido").max(255);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({ title: "Erro", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }

    setBusy(true);
    // Em produção sempre voltamos para o domínio oficial (nunca a URL interna
    // *.vercel.app). O link do e-mail leva o usuário à página de nova senha.
    const isLocalhost = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    const origin = isLocalhost ? window.location.origin : "https://www.techdev.website";

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${origin}/redefinir-senha`,
    });
    setBusy(false);

    // Segurança: nunca revelamos se o e-mail existe. Mesmo em erro genérico,
    // mostramos a confirmação neutra (só logamos o erro real para diagnóstico).
    if (error) {
      console.error("[v0] resetPasswordForEmail:", error.message);
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <LogoLink className="text-gradient">TechDev</LogoLink>
          </CardTitle>
          <CardDescription>
            {sent ? "Verifique seu e-mail" : "Recuperar senha"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-6 py-2">
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <MailCheck className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">Instruções enviadas</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Se houver uma conta associada a{" "}
                    <span className="font-medium text-foreground">{email}</span>, você receberá um
                    e-mail com o link para redefinir sua senha. Verifique também a caixa de spam.
                  </p>
                </div>
              </div>
              <Button asChild variant="hero" className="w-full">
                <Link to="/auth">Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Informe o e-mail cadastrado e enviaremos um link para você criar uma nova senha.
              </p>
              <div>
                <Label htmlFor="fp-email">E-mail</Label>
                <Input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  required
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link de recuperação"}
              </Button>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
