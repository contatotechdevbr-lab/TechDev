import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogoLink } from "@/components/LogoLink";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

// Regras de força da senha. Todas precisam ser satisfeitas para permitir a troca.
const rules = [
  { label: "Mínimo de 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Uma letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Uma letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Um número", test: (p: string) => /\d/.test(p) },
];

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  // Estado do link: aguardando validação / válido / inválido ou expirado.
  const [linkState, setLinkState] = useState<"checking" | "valid" | "invalid">("checking");

  useEffect(() => {
    // O Supabase processa o token da URL (detectSessionInUrl) e dispara o evento
    // PASSWORD_RECOVERY, criando uma sessão temporária apenas para trocar a senha.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setLinkState("valid");
      }
    });

    // Fallback: se a sessão já foi restaurada antes do listener, valida direto.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setLinkState("valid");
    });

    // Trava de segurança: se em 4s não houver sessão de recuperação, o link é
    // considerado inválido/expirado.
    const timer = setTimeout(() => {
      setLinkState((s) => (s === "checking" ? "invalid" : s));
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const allValid = rules.every((r) => r.test(password));
  const matches = password.length > 0 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) {
      toast({ title: "Senha fraca", description: "Atenda a todos os requisitos de senha.", variant: "destructive" });
      return;
    }
    if (!matches) {
      toast({ title: "Senhas diferentes", description: "A confirmação não coincide com a nova senha.", variant: "destructive" });
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      toast({ title: "Não foi possível alterar", description: error.message, variant: "destructive" });
      return;
    }

    // Encerra a sessão temporária de recuperação e volta ao login.
    await supabase.auth.signOut();
    toast({ title: "Senha alterada!", description: "Sua senha foi redefinida. Faça login com a nova senha." });
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <LogoLink className="text-gradient">TechDev</LogoLink>
          </CardTitle>
          <CardDescription>Definir nova senha</CardDescription>
        </CardHeader>
        <CardContent>
          {linkState === "checking" ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validando seu link de recuperação...</p>
            </div>
          ) : linkState === "invalid" ? (
            <div className="space-y-6 py-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-7 w-7 text-destructive" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">Link inválido ou expirado</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Este link de recuperação não é mais válido. Solicite um novo para redefinir sua senha.
                </p>
              </div>
              <Button variant="hero" className="w-full" onClick={() => navigate("/esqueci-senha")}>
                Solicitar novo link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="np">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="np"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <ul className="space-y-1.5">
                {rules.map((r) => {
                  const ok = r.test(password);
                  return (
                    <li
                      key={r.label}
                      className={`flex items-center gap-2 text-sm ${ok ? "text-emerald-500" : "text-muted-foreground"}`}
                    >
                      {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 opacity-50" />}
                      {r.label}
                    </li>
                  );
                })}
              </ul>

              <div>
                <Label htmlFor="cp">Confirmar nova senha</Label>
                <Input
                  id="cp"
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {confirm.length > 0 && !matches && (
                  <p className="mt-1 text-sm text-destructive">As senhas não coincidem.</p>
                )}
              </div>

              <Button type="submit" variant="hero" className="w-full" disabled={busy || !allValid || !matches}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
