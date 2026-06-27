import { useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  usuarios as seed, fmtData,
  type UsuarioAdmin, type CargoUsuario,
} from "@/lib/mock-data";
import { Users, ShieldCheck, UserCog, Plus, MoreHorizontal, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CARGO_LABEL: Record<CargoUsuario, string> = {
  ceo: "CEO",
  administrador: "Administrador",
  funcionario: "Funcionário",
};

const CARGO_COR: Record<CargoUsuario, string> = {
  ceo: "bg-primary/15 text-primary border-primary/30",
  administrador: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  funcionario: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

const iniciais = (nome: string) =>
  nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

export default function Usuarios() {
  const { toast } = useToast();
  const [lista, setLista] = useState<UsuarioAdmin[]>(seed);
  const [busca, setBusca] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", cargo: "funcionario" as CargoUsuario });

  const filtrados = useMemo(
    () => lista.filter((u) => `${u.nome} ${u.email}`.toLowerCase().includes(busca.toLowerCase())),
    [lista, busca]
  );

  const total = lista.length;
  const admins = lista.filter((u) => u.cargo === "administrador" || u.cargo === "ceo").length;
  const ativos = lista.filter((u) => u.ativo).length;

  const toggleAtivo = (id: string) => {
    setLista((prev) => prev.map((u) => (u.id === id ? { ...u, ativo: !u.ativo } : u)));
  };

  const remover = (id: string) => {
    setLista((prev) => prev.filter((u) => u.id !== id));
    toast({ title: "Usuário removido", description: "O acesso foi revogado." });
  };

  const adicionar = () => {
    if (!form.nome || !form.email) return;
    const novo: UsuarioAdmin = {
      id: `u${Date.now()}`,
      nome: form.nome,
      email: form.email,
      cargo: form.cargo,
      ativo: true,
      ultimoAcesso: new Date().toISOString(),
    };
    setLista((prev) => [novo, ...prev]);
    setForm({ nome: "", email: "", cargo: "funcionario" });
    setDialogAberto(false);
    toast({ title: "Usuário adicionado", description: `${novo.nome} agora tem acesso ao painel.` });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários administrativos"
        description="Gerencie quem tem acesso ao painel e seus níveis de permissão."
        actions={
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1.5 size-4" /> Novo usuário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Nome completo</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Ana Souza" />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ana@techdev.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Cargo</Label>
                  <Select value={form.cargo} onValueChange={(v) => setForm({ ...form, cargo: v as CargoUsuario })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="funcionario">Funcionário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
                <Button onClick={adicionar}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total de usuários" value={String(total)} icon={Users} />
        <StatCard label="Administradores" value={String(admins)} icon={ShieldCheck} />
        <StatCard label="Ativos" value={String(ativos)} icon={UserCog} />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar usuário..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {iniciais(u.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{u.nome}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={CARGO_COR[u.cargo]}>{CARGO_LABEL[u.cargo]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmtData(u.ultimoAcesso)}</TableCell>
                    <TableCell>
                      <Switch checked={u.ativo} onCheckedChange={() => toggleAtivo(u.id)} disabled={u.cargo === "ceo"} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" disabled={u.cargo === "ceo"}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => remover(u.id)}>
                            <Trash2 className="mr-2 size-4" /> Remover acesso
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      Nenhum usuário encontrado.
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
