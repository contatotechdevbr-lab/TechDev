import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ClienteFormDialog } from "@/components/admin/ClienteFormDialog";
import { useClientes, clientesStore } from "@/lib/clientes-store";
import { fmtBRL, fmtData, type Cliente } from "@/lib/mock-data";

const Customers = () => {
  const clientes = useClientes();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [planoFiltro, setPlanoFiltro] = useState("todos");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [removendo, setRemovendo] = useState<Cliente | null>(null);

  const filtrados = useMemo(
    () =>
      clientes.filter((c) => {
        const q = search.toLowerCase();
        const matchBusca =
          !q ||
          c.nome.toLowerCase().includes(q) ||
          c.empresa.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q);
        const matchPlano = planoFiltro === "todos" || c.plano === planoFiltro;
        const matchStatus = statusFiltro === "todos" || c.status === statusFiltro;
        return matchBusca && matchPlano && matchStatus;
      }),
    [clientes, search, planoFiltro, statusFiltro]
  );

  const abrirNovo = () => {
    setEditando(null);
    setFormOpen(true);
  };
  const abrirEdicao = (c: Cliente) => {
    setEditando(c);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description={`${clientes.length} clientes cadastrados na TechDev.`}
        actions={
          <Button onClick={abrirNovo}>
            <Plus className="mr-1.5 h-4 w-4" /> Adicionar cliente
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, empresa ou email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={planoFiltro} onValueChange={setPlanoFiltro}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os planos</SelectItem>
                <SelectItem value="Essencial">Essencial</SelectItem>
                <SelectItem value="Profissional">Profissional</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor mensal</TableHead>
                  <TableHead>Contratação</TableHead>
                  <TableHead>Próximo pgto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/clientes/${c.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback
                            className="text-xs font-semibold"
                            style={{ background: `hsl(${c.avatarCor} / 0.15)`, color: `hsl(${c.avatarCor})` }}
                          >
                            {c.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium leading-tight">{c.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.empresa}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{c.plano}</TableCell>
                    <TableCell className="font-medium">{fmtBRL(c.valorMensalCents)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtData(c.contratacao)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtData(c.proximoPagamento)}</TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/clientes/${c.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => abrirEdicao(c)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setRemovendo(c)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ClienteFormDialog open={formOpen} onOpenChange={setFormOpen} cliente={editando} />

      <AlertDialog open={!!removendo} onOpenChange={(v) => !v && setRemovendo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {removendo && `Tem certeza que deseja remover "${removendo.nome}"? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removendo) clientesStore.remove(removendo.id);
                setRemovendo(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;
