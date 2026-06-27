import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, ExternalLink, Search, Calendar, RefreshCw, Code2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { sites, clienteById, fmtData } from "@/lib/mock-data";
import { CheckCircle2, Wrench, PauseCircle } from "lucide-react";

const Sites = () => {
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  const filtrados = useMemo(
    () =>
      sites.filter((s) => {
        const q = search.toLowerCase();
        const matchBusca =
          !q || s.nome.toLowerCase().includes(q) || s.dominio.toLowerCase().includes(q);
        const matchStatus = statusFiltro === "todos" || s.status === statusFiltro;
        return matchBusca && matchStatus;
      }),
    [search, statusFiltro]
  );

  const ativos = sites.filter((s) => s.status === "ativo").length;
  const emDev = sites.filter((s) => s.status === "desenvolvimento").length;
  const suspensos = sites.filter((s) => s.status === "suspenso" || s.status === "cancelado").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Sites ativos" description="Todos os sites desenvolvidos pela TechDev." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de sites" value={String(sites.length)} icon={Globe} />
        <StatCard label="Ativos" value={String(ativos)} icon={CheckCircle2} />
        <StatCard label="Em desenvolvimento" value={String(emDev)} icon={Wrench} />
        <StatCard label="Suspensos / cancelados" value={String(suspensos)} icon={PauseCircle} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou domínio"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="sm:w-52">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="desenvolvimento">Em desenvolvimento</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtrados.map((s) => {
          const cliente = clienteById(s.clienteId);
          return (
            <Card key={s.id} className="transition-colors hover:border-primary/40">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{s.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.dominio}</p>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-foreground">Cliente:</span> {cliente?.empresa ?? "—"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Code2 className="h-3.5 w-3.5" /> {s.tecnologia}
                    <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-xs">{s.plano}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Criado em {fmtData(s.criacao)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-3.5 w-3.5" /> Atualizado em {fmtData(s.ultimaAtualizacao)}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={s.link} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-4 w-4" /> Visitar site
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {filtrados.length === 0 && (
          <p className="col-span-full py-10 text-center text-muted-foreground">Nenhum site encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default Sites;
