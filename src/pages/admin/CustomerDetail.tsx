import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Calendar,
  Globe,
  FileText,
  Download,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatCard } from "@/components/admin/StatCard";
import { ClienteFormDialog } from "@/components/admin/ClienteFormDialog";
import { useClientes, clientesStore } from "@/lib/clientes-store";
import { pagamentos, siteById, fmtBRL, fmtData } from "@/lib/mock-data";
import { DollarSign, Package } from "lucide-react";

const documentosExemplo = [
  { nome: "Contrato de prestação de serviços.pdf", tamanho: "248 KB" },
  { nome: "Briefing do projeto.pdf", tamanho: "1.2 MB" },
  { nome: "Nota fiscal - Junho.pdf", tamanho: "96 KB" },
];

const alteracoesExemplo = [
  { data: "2026-06-20", texto: "Plano alterado para Profissional" },
  { data: "2026-05-12", texto: "Atualização de design da home" },
  { data: "2026-03-02", texto: "Cliente cadastrado no sistema" },
];

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  useClientes(); // re-render ao editar
  const cliente = clientesStore.getById(id);
  const [editOpen, setEditOpen] = useState(false);

  if (!cliente) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/clientes">
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Link>
        </Button>
        <p className="text-muted-foreground">Cliente não encontrado.</p>
      </div>
    );
  }

  const site = siteById(cliente.siteId);
  const pagamentosCliente = pagamentos.filter((p) => p.clienteId === cliente.id);
  const totalPago = pagamentosCliente
    .filter((p) => p.status === "pago")
    .reduce((a, p) => a + p.valorCents, 0);
  const iniciais = cliente.nome.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/admin/clientes")}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Voltar para clientes
      </Button>

      <PageHeader
        title={cliente.nome}
        description={cliente.empresa}
        actions={
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" /> Editar
          </Button>
        }
      />

      {/* Resumo */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback
              className="text-lg font-semibold"
              style={{ background: `hsl(${cliente.avatarCor} / 0.15)`, color: `hsl(${cliente.avatarCor})` }}
            >
              {iniciais}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{cliente.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {cliente.telefone}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Desde {fmtData(cliente.contratacao)}
            </div>
            <div>
              <StatusBadge status={cliente.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Plano atual" value={cliente.plano} icon={Package} hint={`${fmtBRL(cliente.valorMensalCents)}/mês`} />
        <StatCard label="Total pago" value={fmtBRL(totalPago)} icon={DollarSign} hint={`${pagamentosCliente.length} pagamentos`} />
        <StatCard label="Próximo pagamento" value={fmtData(cliente.proximoPagamento)} icon={Calendar} />
      </div>

      <Tabs defaultValue="pagamentos">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="site">Site</TabsTrigger>
          <TabsTrigger value="alteracoes">Alterações</TabsTrigger>
          <TabsTrigger value="observacoes">Observações</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="pagamentos" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagamentosCliente.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Sem pagamentos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagamentosCliente.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{fmtData(p.data)}</TableCell>
                        <TableCell>{p.plano}</TableCell>
                        <TableCell className="text-muted-foreground">{p.metodo}</TableCell>
                        <TableCell className="font-medium">{fmtBRL(p.valorCents)}</TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="site" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Site contratado</CardTitle>
            </CardHeader>
            <CardContent>
              {site ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{site.nome}</p>
                        <p className="text-sm text-muted-foreground">{site.dominio}</p>
                      </div>
                    </div>
                    <StatusBadge status={site.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">Tecnologia</p>
                      <p className="font-medium">{site.tecnologia}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Criação</p>
                      <p className="font-medium">{fmtData(site.criacao)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Última atualização</p>
                      <p className="font-medium">{fmtData(site.ultimaAtualizacao)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Plano</p>
                      <p className="font-medium">{site.plano}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={site.link} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1.5 h-4 w-4" /> Visitar site
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum site vinculado a este cliente.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alteracoes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de alterações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alteracoesExemplo.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      {i < alteracoesExemplo.length - 1 && <span className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-medium">{a.texto}</p>
                      <p className="text-xs text-muted-foreground">{fmtData(a.data)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="observacoes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações internas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {cliente.observacoes || "Nenhuma observação registrada para este cliente."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {documentosExemplo.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.nome}</p>
                      <p className="text-xs text-muted-foreground">{d.tamanho}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Baixar</span>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClienteFormDialog open={editOpen} onOpenChange={setEditOpen} cliente={cliente} />
    </div>
  );
};

export default CustomerDetail;
