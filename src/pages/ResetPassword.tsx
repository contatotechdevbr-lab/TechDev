import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LogoLink } from "@/components/LogoLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

const RESEND_COOLDOWN = 60;

// Regras de força da senha. Todas precisam ser satisfeitas para permitir a troca.
const rules = [
  { label: "Mínimo de 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Uma letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Uma letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Um número", test: (p: string) => /\d/.test(p) },
];

/**
 * Redefinição de senha por código de 6 dígitos (enviado por e-mail via Resend).
 * O usuário informa o código + a nova senha; o backend valida e altera a senha.
 * Ao concluir, é redirecionado para o login com uma mensagem de confirmação.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const emailFromQuery = (params.get("email") ?? "").trim().toLowerCase();

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const allValid = useMemo(() => rules.every((r) => r.test(password)), [password]);
  const matches = password.length > 0 && password === confirm;
  const canSubmit = /^\d{6}$/.test(code) && allValid && matches && !busy;

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && cooldownRef.current) {
          clearInterval(cooldownRef.current);
          cooldownRef.current = null;
        }
        return c - 1;
      });
    }, 1000);
  };

  // Inicia o cooldown ao montar (o código acabou de ser enviado na etapa anterior).
  useEffect(() => {
    startCooldown();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postReset = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    return { ok: res.ok, data };
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email || busy) return;
    setBusy(true);
    await postReset({ email });
    setBusy(false);
    startCooldown();
    toast({
      title: "Código reenviado",
      description: "Se houver uma conta com este e-mail, enviamos um novo código.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Erro", description: "Informe o e-mail da sua conta.", variant: "destructive" });
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      toast({ title: "Código inválido", description: "Digite o código de 6 dígitos.", variant: "destructive" });
      return;
    }
    if (!allValid) {
      toast({ title: "Senha fraca", description: "Atenda a todos os requisitos de senha.", variant: "destructive" });
      return;
    }
    if (!matches) {
      toast({ title: "Senhas diferentes", description: "A confirmação não coincide com a nova senha.", variant: "destructive" });
      return;
    }

    setBusy(true);
    const { ok, data } = await postReset({ email, code, password });
    setBusy(false);

    if (!ok) {
      toast({
        title: "Não foi possível alterar",
        description: data.error ?? "Tente novamente.",
        variant: "destructive",
      });
      return;
    }

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
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Digite o código de 6 dígitos que enviamos
              {email ? (
                <>
                  {" "}para <span className="font-medium text-foreground">{email}</span>
                </>
              ) : null}{" "}
              e crie uma nova senha.
            </p>

            {!emailFromQuery && (
              <div>
                <Label htmlFor="rp-email">E-mail</Label>
                <Input
                  id="rp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                  placeholder="voce@exemplo.com"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Código de verificação</Label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode} disabled={busy}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

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
              <ul className="mt-2 space-y-1.5">
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
            </div>

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

            <Button type="submit" variant="hero" className="w-full" disabled={!canSubmit}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir senha"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/auth"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </Link>
              <button
                type="button"
                className="text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                onClick={() => void handleResend()}
                disabled={busy || cooldown > 0 || !email}
              >
                {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
