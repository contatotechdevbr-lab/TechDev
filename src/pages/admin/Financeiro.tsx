import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, CalendarRange, Wallet, PiggyBank, FileSpreadsheet, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "@/hooks/use-toast";
import { exportarOperacoes } from "@/lib/export-excel";
import { pagamentos, assinaturas, faturamentoMensal, clienteById, fmtBRL, fmtData } from "@/lib/mock-data";

const chartTooltip = {
  contentStyle: {
    background: "hsl(220 18% 10%)",
    border: "1px solid hsl(220 15% 20%)",
    borderRadius: "0.5rem",
    fontSize: "12px",
    color: "hsl(210 20% 95%)",
  },
};

// Gastos de exemplo para cálculo de lucro estimado.
const gastosMensaisCents = 182000;

const Financeiro = () => {
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  const receitaTotal = pagamentos.filter((p) => p.status === "pago").reduce((a, p) => a + p.valorCents, 0);
  const mrr = assinaturas.filter((a) => a.status === "ativa").reduce((a, s) => a + s.valorCents, 0);
  const receitaAnual = mrr * 12;
  const lucroEstimado = mrr - gastosMensaisCents;

  const filtrados = useMemo(
    () =>
      pagamentos.filter((p) => {
        const cliente = clienteById(p.clienteId);
        const q = search.toLowerCase();
        const matchBusca = !q || (cliente?.nome.toLowerCase().includes(q) || cliente?.empresa.toLowerCase().includes(q));
        const matchStatus = statusFiltro === "todos" || p.status === statusFiltro;
        return matchBusca && matchStatus;
      }),
    [search, statusFiltro]
  );

  const exportar = () => {
    exportarOperacoes();
    toast({ title: "Exportação concluída", description: "Arquivo Excel gerado com 5 abas." });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Receitas, gastos e operações financeiras da TechDev."
        actions={
          <Button onClick={exportar}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Exportar operações
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Receita total" value={fmtBRL(receitaTotal)} icon={DollarSign} />
        <StatCard label="Receita mensal (MRR)" value={fmtBRL(mrr)} icon={TrendingUp} />
        <StatCard label="Receita anual" value={fmtBRL(receitaAnual)} icon={CalendarRange} />
        <StatCard label="Gastos mensais" value={fmtBRL(gastosMensaisCents)} icon={Wallet} />
        <StatCard label="Lucro estimado" value={fmtBRL(lucroEstimado)} icon={PiggyBank} trend={{ value: "+14%", positive: true }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={faturamentoMensal} margin={{ left: -10, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" vertical={false} />
              <XAxis dataKey="mes" stroke="hsl(215 15% 55%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...chartTooltip} cursor={{ fill: "hsl(220 15% 18% / 0.5)" }} formatter={(v: number) => [fmtBRL(v * 100), "Receita"]} />
              <Bar dataKey="valor" fill="hsl(205 85% 55%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data pagamento</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => {
                  const cliente = clienteById(p.clienteId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium">{cliente?.nome ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{cliente?.empresa}</p>
                      </TableCell>
                      <TableCell>{p.plano}</TableCell>
                      <TableCell className="font-medium">{fmtBRL(p.valorCents)}</TableCell>
                      <TableCell className="text-muted-foreground">{fmtData(p.data)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.metodo}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Nenhum pagamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financeiro;
