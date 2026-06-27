import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { clientes, sites, projetos } from "@/lib/mock-data";

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary sm:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="hidden rounded border border-border bg-background px-1.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar clientes, sites, projetos..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Páginas">
            <CommandItem onSelect={() => go("/admin")}>Dashboard</CommandItem>
            <CommandItem onSelect={() => go("/admin/clientes")}>Clientes</CommandItem>
            <CommandItem onSelect={() => go("/admin/sites")}>Sites ativos</CommandItem>
            <CommandItem onSelect={() => go("/admin/planos")}>Planos</CommandItem>
            <CommandItem onSelect={() => go("/admin/financeiro")}>Financeiro</CommandItem>
            <CommandItem onSelect={() => go("/admin/assinaturas")}>Assinaturas</CommandItem>
            <CommandItem onSelect={() => go("/admin/projetos")}>Projetos</CommandItem>
            <CommandItem onSelect={() => go("/admin/relatorios")}>Relatórios</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Clientes">
            {clientes.slice(0, 5).map((c) => (
              <CommandItem key={c.id} onSelect={() => go(`/admin/clientes/${c.id}`)}>
                {c.nome} · {c.empresa}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Sites">
            {sites.slice(0, 4).map((s) => (
              <CommandItem key={s.id} onSelect={() => go("/admin/sites")}>
                {s.nome} · {s.dominio}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Projetos">
            {projetos.slice(0, 4).map((p) => (
              <CommandItem key={p.id} onSelect={() => go("/admin/projetos")}>
                {p.cliente} · {p.tipo}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
