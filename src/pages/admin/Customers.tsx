import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronRight } from "lucide-react";

type Row = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  status: string | null;
};

const Customers = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id, status")
        .in("status", ["active", "pending", "past_due"]);
      const subMap = new Map((subs ?? []).map((s: any) => [s.user_id, s.status]));
      setRows((profiles ?? []).map((p) => ({ ...p, status: subMap.get(p.id) ?? null })));
    })();
  }, []);

  const filtered = rows.filter((r) =>
    !search ||
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    (r.full_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Clientes ({rows.length})</CardTitle>
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
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-secondary/50">
                <TableCell className="font-medium">{r.email}</TableCell>
                <TableCell>{r.full_name ?? "—"}</TableCell>
                <TableCell>{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  {r.status ? <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge> : <span className="text-xs text-muted-foreground">sem assinatura</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/admin/clientes/${r.id}`} className="inline-flex items-center text-sm text-primary hover:underline">
                    Abrir <ChevronRight className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Customers;
