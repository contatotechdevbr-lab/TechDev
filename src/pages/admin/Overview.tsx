import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, TrendingUp, Users, Globe, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  sites,
  crescimentoClientes,
  statusProjetos,
  fmtBRL,
  fmtData,
} from "@/lib/mock-data";
import { useClientes } from "@/lib/clientes-store";
import {
  useFinancas,
  clienteInfoByUserId,
  faturamentoPorMes,
  distribuicaoPorPlano,
  receitaPagaCents,
  mrrCents,
} from "@/lib/financas-store";

const chartTooltip = {
  contentStyle: {
    background: "hsl(220 18% 10%)",
    border: "1px solid hsl(220 15% 20%)",
    borderRadius: "0.5rem",
    fontSize: "12px",
    color: "hsl(210 20% 95%)",
  },
};

// Mensagem exibida em gráficos/listas quando ainda não há dados reais.
const EmptyChart = ({ height = 280 }: { height?: number }) => (
  <div
    className="flex flex-col items-center justify-center gap-1 text-center"
    style={{ height }}
  >
    <p className="text-sm font-medium text-muted-foreground">Sem dados ainda</p>
    <p className="text-xs text-muted-foreground/70">
      Os números aparecerão aqui conforme houver atividade.
    </p>
  </div>
);

const Overview = () => {
  const clientes = useClientes();
  const { pagamentos, assinaturas } = useFinancas();
  const faturamentoTotal = receitaPagaCents(pagamentos);
  const mrr = mrrCents(assinaturas);
  const faturamentoMensal = faturamentoPorMes(pagamentos, 6);
  const distribuicaoPlanos = distribuicaoPorPlano(assinaturas);
  const clientesAtivos = clientes.filter((c) => c.status === "ativo").length;
  const sitesPublicados = sites.filter((s) => s.status === "ativo").length;
  const assinaturasAtivas = assinaturas.filter((a) => a.status === "ativa").length;

  const proximosPagamentos = [...clientes]
    .filter((c) => c.status !== "inativo")
    .sort((a, b) => +new Date(a.proximoPagamento) - +new Date(b.proximoPagamento))
    .slice(0, 5);

  const clientesPendentes = clientes.filter((c) => c.status === "pendente");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral das operações da TechDev em tempo real."
      />

      {/* Cards principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Faturamento total" value={fmtBRL(faturamentoTotal)} icon={DollarSign} hint="acumulado" />
        <StatCard label="MRR" value={fmtBRL(mrr)} icon={TrendingUp} hint="recorrente" />
        <StatCard label="Clientes ativos" value={String(clientesAtivos)} icon={Users} hint="total" />
        <StatCard label="Sites publicados" value={String(sitesPublicados)} icon={Globe} hint={`${sites.length} no total`} />
        <StatCard label="Assinaturas ativas" value={String(assinaturasAtivas)} icon={RefreshCw} hint="ativas" />
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução do faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            {faturamentoMensal.length === 0 ? (
              <EmptyChart />
            ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={faturamentoMensal} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="fat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(205 85% 55%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(205 85% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                <XAxis dataKey="mes" stroke="hsl(215 15% 55%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...chartTooltip} formatter={(v: number) => [fmtBRL(v * 100), "Faturamento"]} />
                <Area type="monotone" dataKey="valor" stroke="hsl(205 85% 55%)" strokeWidth={2} fill="url(#fat)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição dos planos</CardTitle>
          </CardHeader>
          <CardContent>
            {distribuicaoPlanos.length === 0 ? (
              <EmptyChart />
            ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={distribuicaoPlanos} dataKey="quantidade" nameKey="plano" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {distribuicaoPlanos.map((d) => (
                    <Cell key={d.plano} fill={`hsl(${d.cor})`} stroke="hsl(220 18% 10%)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltip} formatter={(v: number, n) => [`${v} clientes`, n]} />
              </PieChart>
            </ResponsiveContainer>
            )}
            {distribuicaoPlanos.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {distribuicaoPlanos.map((d) => (
                  <div key={d.plano} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${d.cor})` }} />
                    {d.plano}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crescimento de clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {crescimentoClientes.length === 0 ? (
              <EmptyChart height={240} />
            ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={crescimentoClientes} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                <XAxis dataKey="mes" stroke="hsl(215 15% 55%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltip} formatter={(v: number) => [`${v} clientes`, "Total"]} />
                <Line type="monotone" dataKey="clientes" stroke="hsl(152 60% 50%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(152 60% 50%)" }} />
              </LineChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status dos projetos</CardTitle>
          </CardHeader>
          <CardContent>
            {statusProjetos.length === 0 ? (
              <EmptyChart height={240} />
            ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusProjetos} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" vertical={false} />
                <XAxis dataKey="status" stroke="hsl(215 15% 55%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltip} cursor={{ fill: "hsl(220 15% 18% / 0.5)" }} formatter={(v: number) => [`${v} projetos`, "Quantidade"]} />
                <Bar dataKey="quantidade" fill="hsl(205 85% 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Listas inferiores */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos pagamentos</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {proximosPagamentos.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">Nenhum pagamento agendado.</p>
            )}
            {proximosPagamentos.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{c.empresa}</p>
                  <p className="text-xs text-muted-foreground">{c.plano} · vence {fmtData(c.proximoPagamento)}</p>
                </div>
                <span className="text-sm font-semibold">{fmtBRL(c.valorMensalCents)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes pendentes</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {clientesPendentes.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">Nenhum cliente pendente.</p>
            ) : (
              clientesPendentes.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{c.empresa}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))
            )}
            {pagamentos.filter((p) => p.status !== "pago").map((p) => {
              const c = clienteInfoByUserId(p.clienteId);
              return (
                <div key={p.id} className="flex items-center justify-between py-2.5 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{c?.company ?? c?.full_name ?? "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{p.plano} · {fmtData(p.data)}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
