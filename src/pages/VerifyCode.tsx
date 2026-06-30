import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";

const RESEND_COOLDOWN = 60; // segundos

const VerifyCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; password?: string } | null;
  const email = state?.email ?? "";
  const password = state?.password ?? "";

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sem e-mail no state significa acesso direto à URL: volta para o cadastro.
  useEffect(() => {
    if (!email) {
      navigate("/auth", { replace: true });
    }
  }, [email, navigate]);

  // Contagem regressiva do botão de reenvio.
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const verify = async (value: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Código inválido.");

      toast({ title: "E-mail verificado!", description: "Sua conta foi ativada com sucesso." });

      // Login automático quando temos a senha (vinda do cadastro).
      if (password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          navigate("/dashboard", { replace: true });
          return;
        }
      }
      // Sem senha em memória (ex.: reload): envia para o login.
      navigate("/auth", { replace: true });
    } catch (err) {
      toast({
        title: "Falha na verificação",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível reenviar o código.");
      toast({ title: "Código reenviado", description: "Verifique seu e-mail novamente." });
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast({
        title: "Erro ao reenviar",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verifique seu e-mail</CardTitle>
          <CardDescription>
            Enviamos um código de 6 dígitos para{" "}
            <span className="font-medium text-foreground">{email}</span>. O código expira em 10
            minutos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => {
                setCode(value);
                if (value.length === 6 && !busy) verify(value);
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
            onClick={() => verify(code)}
          >
            {busy ? "Verificando..." : "Confirmar código"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Não recebeu o código?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : resending ? "Reenviando..." : "Reenviar código"}
            </button>
          </div>

          <div className="text-center">
            <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground">
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyCode;
