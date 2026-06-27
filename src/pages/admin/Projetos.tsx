import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  projetos as seed, type Projeto, type StatusProjeto, fmtData,
} from "@/lib/mock-data";
import { FolderKanban, Clock, CheckCircle2, ListTodo, User, Calendar } from "lucide-react";

const COLUNAS: { id: StatusProjeto; titulo: string; cor: string }[] = [
  { id: "briefing", titulo: "Briefing", cor: "262 60% 60%" },
  { id: "design", titulo: "Design", cor: "32 90% 55%" },
  { id: "desenvolvimento", titulo: "Desenvolvimento", cor: "205 85% 55%" },
  { id: "revisao", titulo: "Revisão", cor: "45 90% 55%" },
  { id: "finalizado", titulo: "Finalizado", cor: "152 60% 50%" },
];

export default function Projetos() {
  const [lista, setLista] = useState<Projeto[]>(seed);
  const [aberto, setAberto] = useState<Projeto | null>(null);

  const emAndamento = lista.filter((p) => p.status !== "finalizado").length;
  const finalizados = lista.filter((p) => p.status === "finalizado").length;
  const progressoMedio = Math.round(lista.reduce((a, p) => a + p.progresso, 0) / lista.length);

  const porColuna = useMemo(
    () => COLUNAS.map((c) => ({ ...c, itens: lista.filter((p) => p.status === c.id) })),
    [lista]
  );

  const toggleChecklist = (projetoId: string, idx: number) => {
    setLista((prev) =>
      prev.map((p) => {
        if (p.id !== projetoId) return p;
        const checklist = p.checklist.map((c, i) => (i === idx ? { ...c, done: !c.done } : c));
        const concluidos = checklist.filter((c) => c.done).length;
        const progresso = Math.round((concluidos / checklist.length) * 100);
        return { ...p, checklist, progresso };
      })
    );
    setAberto((prev) => {
      if (!prev || prev.id !== projetoId) return prev;
      const checklist = prev.checklist.map((c, i) => (i === idx ? { ...c, done: !c.done } : c));
      const concluidos = checklist.filter((c) => c.done).length;
      const progresso = Math.round((concluidos / checklist.length) * 100);
      return { ...prev, checklist, progresso };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        description="Acompanhe o andamento dos projetos dos clientes por etapa."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Em andamento" value={String(emAndamento)} icon={Clock} />
        <StatCard label="Finalizados" value={String(finalizados)} icon={CheckCircle2} />
        <StatCard label="Progresso médio" value={`${progressoMedio}%`} icon={FolderKanban} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {porColuna.map((coluna) => (
          <div key={coluna.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: `hsl(${coluna.cor})` }} />
                <h3 className="text-sm font-semibold text-foreground">{coluna.titulo}</h3>
              </div>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">{coluna.itens.length}</Badge>
            </div>
            <div className="space-y-3">
              {coluna.itens.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setAberto(p)}
                  className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50"
                >
                  <p className="font-medium text-foreground text-sm">{p.cliente}</p>
                  <p className="text-xs text-muted-foreground">{p.tipo}</p>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{p.progresso}%</span>
                    </div>
                    <Progress value={p.progresso} className="h-1.5" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><User className="size-3" />{p.responsavel}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{fmtData(p.prazo)}</span>
                  </div>
                </button>
              ))}
              {coluna.itens.length === 0 && (
                <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                  Nenhum projeto
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-w-lg">
          {aberto && (
            <>
              <DialogHeader>
                <DialogTitle>{aberto.cliente}</DialogTitle>
                <DialogDescription>{aberto.tipo} • Responsável: {aberto.responsavel}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{aberto.progresso}%</span>
                  </div>
                  <Progress value={aberto.progresso} className="h-2" />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium flex items-center gap-1.5">
                    <ListTodo className="size-4 text-primary" /> Checklist
                  </p>
                  <div className="space-y-2">
                    {aberto.checklist.map((c, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={c.done} onCheckedChange={() => toggleChecklist(aberto.id, i)} />
                        <span className={c.done ? "line-through text-muted-foreground" : "text-foreground"}>
                          {c.item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium">Anotações</p>
                  <p className="text-sm text-muted-foreground">{aberto.anotacoes}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Prazo de entrega</span>
                  <span className="font-medium">{fmtData(aberto.prazo)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
