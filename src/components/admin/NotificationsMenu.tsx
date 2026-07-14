import { useEffect, useState } from "react";
import { Bell, CreditCard, UserPlus, Globe, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type TipoNotificacao = "pagamento" | "cliente" | "site" | "sistema";

interface NotificacaoUI {
  id: string;
  titulo: string;
  descricao: string;
  tempo: string;
  lida: boolean;
  tipo: TipoNotificacao;
}

interface NotificationRow {
  id: string;
  title: string;
  description: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

const iconFor = (tipo: TipoNotificacao) => {
  switch (tipo) {
    case "pagamento":
      return CreditCard;
    case "cliente":
      return UserPlus;
    case "site":
      return Globe;
    default:
      return Settings2;
  }
};

// Formata a data como tempo relativo (ex.: "há 5 min", "há 2 h", "há 3 d").
const tempoRelativo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
};

const toUI = (r: NotificationRow): NotificacaoUI => ({
  id: r.id,
  titulo: r.title,
  descricao: r.description || "",
  tempo: tempoRelativo(r.created_at),
  lida: r.read,
  tipo: (["pagamento", "cliente", "site", "sistema"].includes(r.type) ? r.type : "sistema") as TipoNotificacao,
});

export const NotificationsMenu = () => {
  const [items, setItems] = useState<NotificacaoUI[]>([]);
  const naoLidas = items.filter((n) => !n.lida).length;

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!ativo) return;
      if (error) {
        console.error("[v0] erro ao carregar notificações:", error.message);
        return;
      }
      setItems((data as NotificationRow[]).map(toUI));
    };

    carregar();

    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((n) => n.id !== (payload.old as NotificationRow).id));
          } else {
            const ui = toUI(payload.new as NotificationRow);
            setItems((prev) => {
              const idx = prev.findIndex((n) => n.id === ui.id);
              if (idx === -1) return [ui, ...prev];
              return prev.map((n) => (n.id === ui.id ? ui : n));
            });
          }
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const marcarTodas = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, lida: true })));
    const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
    if (error) console.error("[v0] erro ao marcar notificações:", error.message);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {naoLidas}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">Notificações</span>
          {naoLidas > 0 && (
            <button onClick={marcarTodas} className="text-xs text-primary hover:underline">
              Marcar todas como lidas
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          <div className="divide-y divide-border">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhuma notificação por enquanto.
              </p>
            )}
            {items.map((n) => {
              const Icon = iconFor(n.tipo);
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/50",
                    !n.lida && "bg-primary/5"
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{n.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.descricao}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{n.tempo}</p>
                  </div>
                  {!n.lida && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
