import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
  import { supabase } from "@/integrations/supabase/client";
  import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoLink } from "@/components/LogoLink";
import {
  LogOut,
  Shield,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  CalendarClock,
} from "lucide-react";

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
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
};

const fmtBRL = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Rótulo e estilo para o status de pagamento. */
const paymentBadge = (status: string) => {
  switch (status) {
    case "paid":
      return { label: "Pago", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", Icon: CheckCircle2 };
    case "pending":
      return { label: "Aguardando", className: "bg-amber-500/15 text-amber-600 border-amber-500/30", Icon: Clock };
    case "failed":
      return { label: "Falhou", className: "bg-red-500/15 text-red-600 border-red-500/30", Icon: XCircle };
    case "refunded":
      return { label: "Reembolsado", className: "bg-sky-500/15 text-sky-600 border-sky-500/30", Icon: RefreshCw };
    case "canceled":
      return { label: "Cancelado", className: "bg-muted text-muted-foreground border-border", Icon: XCircle };
    default:
      return { label: status, className: "bg-muted text-muted-foreground border-border", Icon: Clock };
  }
};

const methodLabel = (m: string | null) => {
  if (m === "pix") return "PIX";
  if (m === "card") return "Cartão de crédito";
  return "—";
};

const subStatusLabel = (s: string) =>
  s === "active" ? "Ativo" : s === "canceled" ? "Cancelado" : s === "past_due" ? "Em atraso" : s;

const Dashboard = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [syncing, setSyncing] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [{ data: subsData }, { data: payData }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("id, status, current_period_end, plans(name, price_cents), custom_plans(name, price_cents)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("id, amount_cents, status, payment_method, paid_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setSubs((subsData as any) ?? []);
    setPayments((payData as Payment[]) ?? []);
  }, [user]);

  // Ao abrir o painel, reconcilia pagamentos pendentes com o Mercado Pago
  // (fallback do webhook) e então recarrega os dados já atualizados.
  const syncAndLoad = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await apiFetch("/api/mercadopago/payment-status", {
        method: "POST",
        body: JSON.stringify({}),
      }).catch(() => {});
      await loadData();
    } finally {
      setSyncing(false);
    }
  }, [user, loadData]);

  useEffect(() => {
    void syncAndLoad();
  }, [syncAndLoad]);

  const activeSub = subs.find((s) => s.status === "active");
  const activePlan = activeSub ? activeSub.plans || activeSub.custom_plans : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4">
          <LogoLink className="text-xl font-bold text-gradient">
            TechDev
          </LogoLink>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <Shield className="mr-1 h-4 w-4" />
                  Admin
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl space-y-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Olá, {user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email}
            </h1>
            <p className="text-muted-foreground">Acompanhe sua assinatura e seus pagamentos.</p>
          </div>
          <Button variant="outline" size="sm" onClick={syncAndLoad} disabled={syncing}>
            <RefreshCw className={`mr-1 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Atualizando..." : "Atualizar status"}
          </Button>
        </div>

        {/* Plano atual em destaque */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-secondary/30">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Sua assinatura
            </CardTitle>
            <CardDescription>Plano ativo e próxima cobrança</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {activePlan ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-bold">{activePlan.name}</div>
                  <div className="text-sm text-muted-foreground">{fmtBRL(activePlan.price_cents)}/mês</div>
                  {activeSub?.current_period_end && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarClock className="h-4 w-4" />
                      Próxima cobrança em {fmtDate(activeSub.current_period_end)}
                    </div>
                  )}
                </div>
                <Badge className="border border-emerald-500/30 bg-emerald-500/15 text-emerald-600">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {subStatusLabel(activeSub!.status)}
                </Badge>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="mb-1 font-medium">Você ainda não tem uma assinatura ativa</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  {syncing ? "Verificando seus pagamentos..." : "Escolha um plano para começar."}
                </p>
                <Button variant="hero" asChild>
                  <Link to="/#planos">Ver planos</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Histórico de pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamentos
            </CardTitle>
            <CardDescription>Histórico das suas cobranças</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pagamento ainda.</p>
            ) : (
              <div className="divide-y divide-border">
                {payments.map((p) => {
                  const b = paymentBadge(p.status);
                  return (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="font-medium">{fmtBRL(p.amount_cents)}</div>
                        <div className="text-xs text-muted-foreground">
                          {fmtDate(p.paid_at ?? p.created_at)} · {methodLabel(p.payment_method)}
                        </div>
                      </div>
                      <Badge variant="outline" className={`border ${b.className}`}>
                        <b.Icon className="mr-1 h-3.5 w-3.5" />
                        {b.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
