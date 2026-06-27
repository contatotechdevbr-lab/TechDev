import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Building2, Bell, ScrollText, ShieldCheck } from "lucide-react";
import { logs } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

const fmtDataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Configuracoes() {
  const { toast } = useToast();
  const [empresa, setEmpresa] = useState({
    nome: "TechDev",
    email: "contato@techdev.com",
    telefone: "(11) 99999-0000",
    site: "https://techdev.com",
  });
  const [notif, setNotif] = useState({
    pagamentos: true,
    novosClientes: true,
    cancelamentos: true,
    resumoSemanal: false,
  });

  const salvar = (secao: string) =>
    toast({ title: "Configurações salvas", description: `${secao} atualizado com sucesso.` });

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Gerencie as preferências do painel e da empresa." />

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList>
          <TabsTrigger value="empresa"><Building2 className="mr-1.5 size-4" /> Empresa</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell className="mr-1.5 size-4" /> Notificações</TabsTrigger>
          <TabsTrigger value="seguranca"><ShieldCheck className="mr-1.5 size-4" /> Segurança</TabsTrigger>
          <TabsTrigger value="logs"><ScrollText className="mr-1.5 size-4" /> Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados da empresa</CardTitle>
              <CardDescription>Informações exibidas em documentos e comunicações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nome da empresa</Label>
                  <Input value={empresa.nome} onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail de contato</Label>
                  <Input value={empresa.email} onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={empresa.telefone} onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Site</Label>
                  <Input value={empresa.site} onChange={(e) => setEmpresa({ ...empresa, site: e.target.value })} />
                </div>
              </div>
              <Button onClick={() => salvar("Dados da empresa")}>Salvar alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferências de notificação</CardTitle>
              <CardDescription>Escolha quais alertas deseja receber.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { key: "pagamentos", label: "Pagamentos recebidos", desc: "Notificar quando um cliente realizar um pagamento." },
                { key: "novosClientes", label: "Novos clientes", desc: "Notificar quando um novo cliente for cadastrado." },
                { key: "cancelamentos", label: "Cancelamentos", desc: "Notificar quando uma assinatura for cancelada." },
                { key: "resumoSemanal", label: "Resumo semanal", desc: "Receber um resumo de desempenho toda segunda-feira." },
              ].map((item, i, arr) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notif[item.key as keyof typeof notif]}
                      onCheckedChange={(v) => setNotif({ ...notif, [item.key]: v })}
                    />
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
              <Button className="mt-4" onClick={() => salvar("Preferências de notificação")}>Salvar preferências</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Segurança</CardTitle>
              <CardDescription>Altere sua senha de acesso ao painel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Senha atual</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nova senha</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirmar senha</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button onClick={() => salvar("Senha")}>Atualizar senha</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logs de atividade</CardTitle>
              <CardDescription>Histórico de ações realizadas no painel.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Alvo</TableHead>
                      <TableHead>Data e hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium text-foreground">{l.usuario}</TableCell>
                        <TableCell>{l.acao}</TableCell>
                        <TableCell className="text-muted-foreground">{l.alvo}</TableCell>
                        <TableCell className="text-muted-foreground">{fmtDataHora(l.data)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
