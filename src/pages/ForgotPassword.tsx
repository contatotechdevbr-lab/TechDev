import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoLink } from "@/components/LogoLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("Informe um e-mail válido").max(255);

/**
 * Solicitação de recuperação de senha.
 * Envia o e-mail pelo nosso backend (Resend, com a marca TechDev) e, em seguida,
 * leva o usuário para a página onde ele digita o código e define a nova senha.
 * Segurança: a resposta é sempre genérica — nunca revela se o e-mail existe.
 */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({ title: "Erro", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data }),
      });
    } catch (err) {
      // Não revela detalhes; segue para a etapa de código de qualquer forma.
      console.error("[v0] password-reset request:", err);
    }
    setBusy(false);

    toast({
      title: "Verifique seu e-mail",
      description: "Se houver uma conta com este e-mail, enviamos um código de redefinição.",
    });
    navigate(`/redefinir-senha?email=${encodeURIComponent(parsed.data)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <LogoLink className="text-gradient">TechDev</LogoLink>
          </CardTitle>
          <CardDescription>Recuperar senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Informe o e-mail cadastrado e enviaremos um código de 6 dígitos para você criar uma
              nova senha.
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
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar código de recuperação"}
            </Button>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para o login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
