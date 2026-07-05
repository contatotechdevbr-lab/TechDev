import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";

type Phase = "loading" | "enroll" | "challenge" | "ok" | "error";

/**
 * Portão de verificação em duas etapas (2FA/TOTP) OBRIGATÓRIO para o painel CEO.
 *
 * - Se o administrador ainda não configurou o 2FA -> força o cadastro (QR code).
 * - Se já configurou mas a sessão atual é aal1 -> exige o código de 6 dígitos.
 * - Só libera o painel quando a sessão atinge aal2 (verificada nesta sessão).
 *
 * Recuperação em caso de perda do aparelho: use o script
 * `scripts/admin-mfa-reset.mjs` (executado com a service role) para remover o
 * fator TOTP do administrador e permitir novo cadastro.
 */
export const AdminMfaGate = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const evaluate = useCallback(async () => {
    setPhase("loading");
    const { data: aalData, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) {
      setPhase("error");
      return;
    }
    if (aalData?.currentLevel === "aal2") {
      setPhase("ok");
      return;
    }

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setPhase("error");
      return;
    }
    const verifiedTotp = factorsData?.totp?.find((f) => f.status === "verified");

    if (verifiedTotp) {
      // Já tem 2FA: precisa apenas confirmar o código nesta sessão.
      setFactorId(verifiedTotp.id);
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: verifiedTotp.id,
      });
      if (chErr) {
        setPhase("error");
        return;
      }
      setChallengeId(ch.id);
      setPhase("challenge");
      return;
    }

    // Sem fator verificado: limpa fatores pendentes e inicia novo cadastro.
    const pending = factorsData?.all?.filter((f) => f.status !== "verified") ?? [];
    for (const f of pending) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data: enroll, error: enrollErr } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `TechDev Admin ${Date.now()}`,
    });
    if (enrollErr || !enroll) {
      setPhase("error");
      return;
    }
    setFactorId(enroll.id);
    setQr(enroll.totp.qr_code);
    setSecret(enroll.totp.secret);
    setPhase("enroll");
  }, []);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  const verify = async () => {
    if (!factorId || code.length !== 6) return;
    setBusy(true);
    try {
      // No cadastro ainda não há challenge; cria um. No login já existe.
      let chId = challengeId;
      if (phase === "enroll" || !chId) {
        const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
        if (chErr || !ch) {
          toast({ title: "Erro", description: "Falha ao iniciar a verificação.", variant: "destructive" });
          return;
        }
        chId = ch.id;
      }
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: chId,
        code,
      });
      if (error) {
        setCode("");
        toast({ title: "Código inválido", description: "Verifique o app e tente novamente.", variant: "destructive" });
        return;
      }
      toast({ title: "Verificado!", description: "Acesso ao painel liberado." });
      await evaluate();
    } finally {
      setBusy(false);
    }
  };

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando segurança do painel...</p>
      </div>
    );
  }

  if (phase === "ok") return <>{children}</>;

  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6 rounded-xl border border-border bg-card p-8">
          <h1 className="text-xl font-semibold text-foreground">Falha na verificação de segurança</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Não foi possível validar a verificação em duas etapas. Recarregue a página e tente novamente.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => void evaluate()} className="w-full">Tentar novamente</Button>
            <Button variant="ghost" onClick={() => void signOut()} className="w-full">Sair</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="max-w-md w-full space-y-6 rounded-xl border border-border bg-card p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          {phase === "enroll" ? (
            <ShieldCheck className="h-7 w-7 text-primary" />
          ) : (
            <KeyRound className="h-7 w-7 text-primary" />
          )}
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {phase === "enroll" ? "Ative a verificação em duas etapas" : "Verificação em duas etapas"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {phase === "enroll"
              ? "O painel CEO exige 2FA. Escaneie o QR code com um app autenticador (Google Authenticator, Authy, 1Password) e digite o código gerado."
              : "Digite o código de 6 dígitos do seu app autenticador para acessar o painel."}
          </p>
        </div>

        {phase === "enroll" && qr && (
          <div className="flex flex-col items-center gap-3">
            <img
              src={qr}
              alt="QR code para configurar a verificação em duas etapas"
              className="h-44 w-44 rounded-lg border border-border bg-white p-2"
            />
            {secret && (
              <p className="text-center text-xs text-muted-foreground">
                Ou insira manualmente a chave:
                <br />
                <code className="mt-1 inline-block break-all font-mono text-foreground">{secret}</code>
              </p>
            )}
          </div>
        )}

        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(v) => {
              setCode(v);
              if (v.length === 6) void verify();
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
          onClick={() => void verify()}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : phase === "enroll" ? "Ativar e entrar" : "Verificar e entrar"}
        </Button>

        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => void signOut()}
        >
          Sair
        </button>
      </div>
    </div>
  );
};
