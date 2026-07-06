import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  // clientes
  ativo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pendente: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  inativo: "bg-muted text-muted-foreground border-border",
  banido: "bg-destructive/15 text-destructive border-destructive/30",
  // sites
  desenvolvimento: "bg-primary/15 text-primary border-primary/30",
  suspenso: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  cancelado: "bg-destructive/15 text-destructive border-destructive/30",
  // assinaturas
  ativa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pausada: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  cancelada: "bg-destructive/15 text-destructive border-destructive/30",
  atrasada: "bg-destructive/15 text-destructive border-destructive/30",
  // pagamentos
  pago: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  atrasado: "bg-destructive/15 text-destructive border-destructive/30",
  // projetos
  briefing: "bg-muted text-muted-foreground border-border",
  design: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
  revisao: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  finalizado: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const labels: Record<string, string> = {
  ativo: "Ativo",
  pendente: "Pendente",
  inativo: "Inativo",
  banido: "Banido",
  desenvolvimento: "Em desenvolvimento",
  suspenso: "Suspenso",
  cancelado: "Cancelado",
  ativa: "Ativa",
  pausada: "Pausada",
  cancelada: "Cancelada",
  atrasada: "Atrasada",
  pago: "Pago",
  atrasado: "Atrasado",
  briefing: "Briefing",
  design: "Design",
  revisao: "Revisão",
  finalizado: "Finalizado",
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
      styles[status] ?? "bg-secondary text-secondary-foreground border-border"
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
    {labels[status] ?? status}
  </span>
);
