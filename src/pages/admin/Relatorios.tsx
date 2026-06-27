import { useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { exportarOperacoes } from "@/lib/export-excel";
import {
  faturamentoMensal, crescimentoClientes, distribuicaoPlanos,
  statusProjetos, cancelamentosMensais, fmtBRL,
} from "@/lib/mock-data";

const chartTooltip = {
  contentStyle: {
    background: "hsl(220 18% 10%)",
    border: "1px solid hsl(220 15% 20%)",
    borderRadius: "0.5rem",
    fontSize: "12px",
    color: "hsl(210 20% 95%)",
  },
};

const eixo = {
  stroke: "hsl(215 15% 55%)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

export default function Relatorios() {
  const [periodo, setPeriodo] = useState("6m");

  const exportar = () => {
    exportarOperacoes();
    toast({ title: "Relatório exportado", description: "Arquivo Excel gerado com sucesso." });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Visão analítica do desempenho da TechDev."
        actions={
          <div className="flex items-center gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportar}>
              <FileSpreadsheet className="mr-1.5 size-4" /> Exportar
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Evolução do faturamento</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={faturamentoMensal} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(205 85% 55%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(205 85% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" vertical={false} />
                <XAxis dataKey="mes" {...eixo} />
                <YAxis {...eixo} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...chartTooltip} formatter={(v: number) => [fmtBRL(v * 100), "Receita"]} />
                <Area type="monotone" dataKey="valor" stroke="hsl(205 85% 55%)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Crescimento de clientes</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={crescimentoClientes} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" vertical={false} />
                <XAxis dataKey="mes" {...eixo} />
                <YAxis {...eixo} />
                <Tooltip {...chartTooltip} formatter={(v: number) => [v, "Clientes"]} />
                <Line type="monotone" dataKey="clientes" stroke="hsl(152 60% 50%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição de planos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={distribuicaoPlanos}
                  dataKey="quantidade"
                  nameKey="plano"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {distribuicaoPlanos.map((d) => (
                    <Cell key={d.plano} fill={`hsl(${d.cor})`} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltip} formatter={(v: number, n) => [`${v} clientes`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {distribuicaoPlanos.map((d) => (
                <div key={d.plano} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ background: `hsl(${d.cor})` }} />
                  {d.plano}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Cancelamentos por mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cancelamentosMensais} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" vertical={false} />
                <XAxis dataKey="mes" {...eixo} />
                <YAxis {...eixo} allowDecimals={false} />
                <Tooltip {...chartTooltip} cursor={{ fill: "hsl(220 15% 18% / 0.5)" }} formatter={(v: number) => [v, "Cancelamentos"]} />
                <Bar dataKey="cancelamentos" fill="hsl(0 70% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Projetos por status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusProjetos} margin={{ left: -10, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" vertical={false} />
                <XAxis dataKey="status" {...eixo} />
                <YAxis {...eixo} allowDecimals={false} />
                <Tooltip {...chartTooltip} cursor={{ fill: "hsl(220 15% 18% / 0.5)" }} formatter={(v: number) => [v, "Projetos"]} />
                <Bar dataKey="quantidade" fill="hsl(205 85% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
