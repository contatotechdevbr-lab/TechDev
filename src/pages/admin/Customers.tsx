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
  DropdownMenuSeparator,
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
import { Search, MoreHorizontal, Eye, Trash2, Ban, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminUsers, type AdminUser } from "@/lib/admin-users";
import { toast } from "@/hooks/use-toast";
import { fmtBRL, fmtData } from "@/lib/mock-data";

type Acao = { tipo: "remover" | "banir" | "desbanir"; user: AdminUser };

const Customers = () => {
  const { users, loading, error, refetch, banUser, deleteUser } = useAdminUsers();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [acao, setAcao] = useState<Acao | null>(null);
  const [processando, setProcessando] = useState(false);

  const filtrados = useMemo(
    () =>
      users.filter((c) => {
        const q = search.toLowerCase();
        const matchBusca =
          !q ||
          c.nome.toLowerCase().includes(q) ||
          c.empresa.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q);
        const matchStatus = statusFiltro === "todos" || c.status === statusFiltro;
        return matchBusca && matchStatus;
      }),
    [users, search, statusFiltro]
  );

  const ativos = users.filter((u) => u.status === "ativo").length;
  const banidos = users.filter((u) => u.status === "banido").length;

  const confirmarAcao = async () => {
    if (!acao) return;
    setProcessando(true);
    try {
      if (acao.tipo === "remover") {
        await deleteUser(acao.user.userId);
        toast({ title: "Conta removida", description: `${acao.user.nome} não poderá mais fazer login.` });
      } else if (acao.tipo === "banir") {
        await banUser(acao.user.userId, "ban");
        toast({ title: "Usuário banido", description: `${acao.user.nome} está com o acesso suspenso.` });
      } else {
        await banUser(acao.user.userId, "unban");
        toast({ title: "Acesso liberado", description: `${acao.user.nome} pode fazer login novamente.` });
      }
      setAcao(null);
    } catch (err) {
      toast({
        title: "Não foi possível concluir",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessando(false);
    }
  };

  const dialogTexto = () => {
    if (!acao) return { titulo: "", desc: "", botao: "", destrutivo: false };
    if (acao.tipo === "remover")
      return {
        titulo: "Remover conta permanentemente?",
        desc: `A conta de "${acao.user.nome}" (${acao.user.email}) será excluída do banco e da autenticação. Ela não poderá mais fazer login. Esta ação não pode ser desfeita.`,
        botao: "Remover conta",
        destrutivo: true,
      };
    if (acao.tipo === "banir")
      return {
        titulo: "Banir usuário?",
        desc: `"${acao.user.nome}" ficará impedido de fazer login e verá uma mensagem de conta suspensa. A conta é mantida e você pode desbanir a qualquer momento.`,
        botao: "Banir",
        destrutivo: true,
      };
    return {
      titulo: "Desbanir usuário?",
      desc: `"${acao.user.nome}" voltará a ter acesso normal à conta.`,
      botao: "Desbanir",
      destrutivo: false,
    };
  };

  const txt = dialogTexto();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description={`${users.length} usuários cadastrados · ${ativos} ativos · ${banidos} banidos.`}
        actions={
          <Button variant="outline" onClick={() => void refetch()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
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
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="banido">Banido</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4 text-sm">
            <span className="text-destructive">{error}</span>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor mensal</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((c) => {
                  const banido = c.status === "banido";
                  const podeAgir = !c.isAdmin;
                  return (
                    <TableRow
                      key={c.userId}
                      className={c.clientId ? "cursor-pointer" : ""}
                      onClick={() => c.clientId && navigate(`/admin/clientes/${c.clientId}`)}
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
                            <p className="flex items-center gap-1.5 font-medium leading-tight">
                              {c.nome}
                              {c.isAdmin && (
                                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                                  Admin
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{c.plano || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="font-medium">
                        {c.valorMensalCents ? fmtBRL(c.valorMensalCents) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{fmtData(c.contratacao)}</TableCell>
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
                            {c.clientId && (
                              <DropdownMenuItem onClick={() => navigate(`/admin/clientes/${c.clientId}`)}>
                                <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                              </DropdownMenuItem>
                            )}
                            {podeAgir ? (
                              <>
                                {banido ? (
                                  <DropdownMenuItem onClick={() => setAcao({ tipo: "desbanir", user: c })}>
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Desbanir
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setAcao({ tipo: "banir", user: c })}>
                                    <Ban className="mr-2 h-4 w-4" /> Banir
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setAcao({ tipo: "remover", user: c })}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Remover conta
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem disabled>Conta de administrador</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {loading && filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!acao} onOpenChange={(v) => !v && !processando && setAcao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{txt.titulo}</AlertDialogTitle>
            <AlertDialogDescription>{txt.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={txt.destrutivo ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              disabled={processando}
              onClick={(e) => {
                e.preventDefault();
                void confirmarAcao();
              }}
            >
              {processando ? <Loader2 className="h-4 w-4 animate-spin" /> : txt.botao}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;
