import { useState } from "react";
import { Bell, CreditCard, UserPlus, Globe, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificacoes as seed, type Notificacao } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconFor = (tipo: Notificacao["tipo"]) => {
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

export const NotificationsMenu = () => {
  const [items, setItems] = useState<Notificacao[]>(seed);
  const naoLidas = items.filter((n) => !n.lida).length;

  const marcarTodas = () => setItems((prev) => prev.map((n) => ({ ...n, lida: true })));

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
