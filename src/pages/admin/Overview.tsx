import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, TrendingUp, Activity } from "lucide-react";

const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Overview = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, mrr: 0, revenue: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { count: total } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("status, plans(price_cents), custom_plans(price_cents)")
        .eq("status", "active");
      const active = subs?.length ?? 0;
      const mrr = (subs ?? []).reduce(
        (a: number, s: any) => a + (s.plans?.price_cents ?? s.custom_plans?.price_cents ?? 0),
        0
      );
      const { data: paid } = await supabase.from("payments").select("amount_cents").eq("status", "paid");
      const revenue = (paid ?? []).reduce((a, p) => a + p.amount_cents, 0);
      setStats({ total: total ?? 0, active, mrr, revenue });

      const { data: r } = await supabase
        .from("payments")
        .select("id, amount_cents, status, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(8);
      setRecent(r ?? []);
    })();
  }, []);

  const cards = [
    { label: "Clientes", value: stats.total.toString(), icon: Users },
    { label: "Assinaturas ativas", value: stats.active.toString(), icon: Activity },
    { label: "MRR (Receita mensal)", value: fmt(stats.mrr), icon: TrendingUp },
    { label: "Receita total", value: fmt(stats.revenue), icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem pagamentos ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("pt-BR")}
                  </span>
                  <span className="font-medium">{fmt(p.amount_cents)}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
