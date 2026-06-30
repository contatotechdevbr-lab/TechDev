import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  fullName: z.string().trim().min(2).max(100).optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin, roleLoaded } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Redireciona somente depois que a verificação de permissão terminou,
  // garantindo que administradores caiam direto no painel admin.
  useEffect(() => {
    if (!loading && roleLoaded && user) {
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, loading, roleLoaded, isAdmin, navigate]);

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
      toast({ title: "Falha no login", description: error.message, variant: "destructive" });
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
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível criar sua conta.");
      }
      toast({
        title: "Conta criada!",
        description: "Enviamos um código de verificação para o seu e-mail.",
      });
      // Leva o usuário para a tela de verificação por código (OTP).
      // A senha trafega apenas em memória (state) para permitir login automático
      // após a verificação; não é persistida.
      navigate("/verificar-codigo", { state: { email, password }, replace: true });
    } catch (err) {
      toast({
        title: "Falha no cadastro",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
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
          <CardDescription>Entre ou crie sua conta</CardDescription>
        </CardHeader>
        <CardContent>
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
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>Entrar</Button>
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
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>Criar conta</Button>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
