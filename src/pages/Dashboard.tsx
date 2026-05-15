import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, CreditCard } from "lucide-react";

type Sub = {
  id: string;
  status: string;
  current_period_end: string | null;
  plans: { name: string; price_cents: number } | null;
  custom_plans: { name: string; price_cents: number } | null;
};

type Payment = {
  id: string;
  amount_cents: number;
  status: string;
  paid_at: string | null;
  created_at: string;
};

const Dashboard = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select("id, status, current_period_end, plans(name, price_cents), custom_plans(name, price_cents)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setSubs((data as any) ?? []));

    supabase
      .from("payments")
      .select("id, amount_cents, status, paid_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setPayments(data ?? []));
  }, [user]);

  const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gradient">TechDev</Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin"><Shield className="h-4 w-4 mr-1" />Admin</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" />Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Olá, {user?.email}</h1>
          <p className="text-muted-foreground">Bem-vindo ao seu painel</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Suas Assinaturas</CardTitle>
            <CardDescription>Planos ativos e histórico</CardDescription>
          </CardHeader>
          <CardContent>
            {subs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Você ainda não tem assinaturas</p>
                <Button variant="hero" asChild><Link to="/#planos">Ver Planos</Link></Button>
              </div>
            ) : (
              <div className="space-y-3">
                {subs.map((s) => {
                  const plan = s.plans || s.custom_plans;
                  return (
                    <div key={s.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <div className="font-semibold">{plan?.name ?? "Plano"}</div>
                        <div className="text-sm text-muted-foreground">
                          {plan ? fmt(plan.price_cents) + "/mês" : ""}
                        </div>
                      </div>
                      <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum pagamento ainda.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between py-2 border-b border-border last:border-0">
                    <div className="text-sm">
                      {new Date(p.paid_at ?? p.created_at).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-sm font-semibold">{fmt(p.amount_cents)}</div>
                    <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
