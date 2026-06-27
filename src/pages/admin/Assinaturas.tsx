import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  assinaturas as seed, clienteById, fmtBRL, fmtData,
  type Assinatura, type StatusAssinatura,
} from "@/lib/mock-data";
import { RefreshCw, Search, MoreHorizontal, Pause, Play, XCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Assinaturas() {
  const { toast } = useToast();
  const [lista, setLista] = useState<Assinatura[]>(seed);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string>("todas");

  const filtradas = useMemo(() => {
    return lista.filter((a) => {
      const cliente = clienteById(a.clienteId);
      const texto = `${cliente?.nome ?? ""} ${cliente?.empresa ?? ""} ${a.plano}`.toLowerCase();
      const okBusca = texto.includes(busca.toLowerCase());
      const okStatus = status === "todas" || a.status === status;
      return okBusca && okStatus;
    });
  }, [lista, busca, status]);

  const mrr = lista
    .filter((a) => a.status === "ativa")
    .reduce((acc, a) => acc + a.valorCents, 0);
  const ativas = lista.filter((a) => a.status === "ativa").length;
  const atrasadas = lista.filter((a) => a.status === "atrasada").length;
  const canceladas = lista.filter((a) => a.status === "cancelada").length;

  const mudarStatus = (id: string, novo: StatusAssinatura, label: string) => {
    setLista((prev) => prev.map((a) => (a.id === id ? { ...a, status: novo } : a)));
    toast({ title: "Assinatura atualizada", description: `Status alterado para ${label}.` });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assinaturas"
        description="Acompanhe renovações, status e receita recorrente dos clientes."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Receita recorrente (MRR)" value={fmtBRL(mrr)} icon={RefreshCw} />
        <StatCard label="Assinaturas ativas" value={String(ativas)} icon={Play} />
        <StatCard label="Em atraso" value={String(atrasadas)} icon={RotateCcw} />
        <StatCard label="Canceladas" value={String(canceladas)} icon={XCircle} />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou plano..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os status</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="pausada">Pausadas</SelectItem>
                <SelectItem value="atrasada">Atrasadas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Renovação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((a) => {
                  const cliente = clienteById(a.clienteId);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{cliente?.nome ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{cliente?.empresa}</div>
                      </TableCell>
                      <TableCell>{a.plano}</TableCell>
                      <TableCell className="font-medium">{fmtBRL(a.valorCents)}</TableCell>
                      <TableCell>{a.cicloMeses === 1 ? "Mensal" : `${a.cicloMeses} meses`}</TableCell>
                      <TableCell>{fmtData(a.renovacao)}</TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {a.status !== "ativa" && (
                              <DropdownMenuItem onClick={() => mudarStatus(a.id, "ativa", "Ativa")}>
                                <Play className="mr-2 size-4" /> Reativar
                              </DropdownMenuItem>
                            )}
                            {a.status === "ativa" && (
                              <DropdownMenuItem onClick={() => mudarStatus(a.id, "pausada", "Pausada")}>
                                <Pause className="mr-2 size-4" /> Pausar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => mudarStatus(a.id, "cancelada", "Cancelada")}
                            >
                              <XCircle className="mr-2 size-4" /> Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Nenhuma assinatura encontrada.
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
}
