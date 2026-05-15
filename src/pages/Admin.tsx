import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, LogOut } from "lucide-react";

type Customer = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  pagarme_customer_id: string | null;
};

const Admin = () => {
  const { signOut } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0 });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at, pagarme_customer_id")
      .order("created_at", { ascending: false });
    setCustomers(data ?? []);

    const { count: total } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: active } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active");
    const { data: paid } = await supabase.from("payments").select("amount_cents").eq("status", "paid");
    const revenue = (paid ?? []).reduce((a, p) => a + p.amount_cents, 0);
    setStats({ total: total ?? 0, active: active ?? 0, revenue });
  };

  const filtered = customers.filter((c) =>
    !search ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.full_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <h1 className="text-xl font-bold">Painel Admin</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total de Clientes</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Assinaturas Ativas</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-primary">{stats.active}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Receita Total</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-gradient">{fmt(stats.revenue)}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Clientes</CardTitle>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por email/nome" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Pagar.me</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.email}</TableCell>
                    <TableCell>{c.full_name ?? "—"}</TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      {c.pagarme_customer_id ? <Badge>Sincronizado</Badge> : <Badge variant="secondary">Não</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Próximas etapas</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>✓ Fase 1 concluída: autenticação, banco, RLS e painel base.</p>
            <p>→ Fase 2: seção de Planos na landing + modal de checkout</p>
            <p>→ Fase 3: integração Pagar.me (precisarei das chaves)</p>
            <p>→ Fase 4: ações avançadas no admin (cancelar, criar plano personalizado, etc.)</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
