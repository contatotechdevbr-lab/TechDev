import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { MailCheck, Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  fullName: z.string().trim().min(2, "Informe seu nome").max(100).optional(),
});

const RESEND_COOLDOWN = 60;

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin, roleLoaded } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Fluxo de verificação por código (OTP)
  const [otpStep, setOtpStep] = useState(false);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading && roleLoaded && user) {
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, loading, roleLoaded, isAdmin, navigate]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

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

  const postJson = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data } as { ok: boolean; data: { error?: string; message?: string } };
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.pick({ email: true, password: true }).safeParse({ email, password });
    if (!parsed.success) {
      toast({ title: "Erro", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const desc =
        error.message === "Email not confirmed"
          ? "Confirme seu e-mail com o código que enviamos antes de entrar."
          : error.message;
      toast({ title: "Falha no login", description: desc, variant: "destructive" });
      return;
    }
    navigate("/dashboard");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName });
    if (!parsed.success) {
      toast({ title: "Erro", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    const { ok, data } = await postJson("/api/auth/register", { email, password, fullName });
    setBusy(false);
    if (!ok) {
      toast({ title: "Falha no cadastro", description: data.error ?? "Tente novamente.", variant: "destructive" });
      return;
    }
    setCode("");
    setOtpStep(true);
    startCooldown();
    toast({ title: "Código enviado!", description: `Enviamos um código de 6 dígitos para ${email}.` });
  };

  const handleVerify = async (value?: string) => {
    const finalCode = value ?? code;
    if (finalCode.length !== 6) return;
    setBusy(true);
    const { ok, data } = await postJson("/api/auth/verify", { email, code: finalCode });
    if (!ok) {
      setBusy(false);
      setCode("");
      toast({ title: "Código inválido", description: data.error ?? "Tente novamente.", variant: "destructive" });
      return;
    }
    // Verificado: faz login automático com a senha ainda em memória.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast({ title: "E-mail confirmado!", description: "Sua conta foi ativada. Faça login para continuar." });
      setOtpStep(false);
      return;
    }
    toast({ title: "Bem-vindo!", description: "Conta verificada e login realizado." });
    navigate("/dashboard");
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setBusy(true);
    const { ok, data } = await postJson("/api/auth/resend", { email });
    setBusy(false);
    if (!ok) {
      toast({ title: "Não foi possível reenviar", description: data.error ?? "Tente novamente.", variant: "destructive" });
      if (data.error?.includes("Aguarde")) startCooldown();
      return;
    }
    startCooldown();
    toast({ title: "Código reenviado", description: "Verifique seu e-mail novamente." });
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      setBusy(false);
      toast({ title: "Erro Google", description: String(result.error), variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <Link to="/" className="text-gradient">TechDev</Link>
          </CardTitle>
          <CardDescription>
            {otpStep ? "Verifique seu e-mail" : "Entre ou crie sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {otpStep ? (
            <div className="space-y-6 py-2">
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <MailCheck className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">Digite o código</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Enviamos um código de 6 dígitos para{" "}
                    <span className="font-medium text-foreground">{email}</span>. Ele expira em 10 minutos.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(v) => {
                    setCode(v);
                    if (v.length === 6) void handleVerify(v);
                  }}
                  disabled={busy}
                >
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

              <Button
                variant="hero"
                className="w-full"
                disabled={busy || code.length !== 6}
                onClick={() => void handleVerify()}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar e entrar"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setOtpStep(false)}
                  disabled={busy}
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </button>
                <button
                  type="button"
                  className="text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                  onClick={() => void handleResend()}
                  disabled={busy || cooldown > 0}
                >
                  {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <Tabs defaultValue="signin">
                <TabsList className="grid grid-cols-2 w-full mb-6">
                  <TabsTrigger value="signin">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <Label htmlFor="se">Email</Label>
                      <Input id="se" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="sp">Senha</Label>
                      <Input id="sp" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="un">Nome completo</Label>
                      <Input id="un" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="ue">Email</Label>
                      <Input id="ue" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="up">Senha (mín. 8)</Label>
                      <Input id="up" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
                Continuar com Google
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
