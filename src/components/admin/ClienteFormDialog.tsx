import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { clientesStore } from "@/lib/clientes-store";
import type { Cliente, StatusCliente } from "@/lib/mock-data";

const planos = [
  { nome: "Essencial", valor: 19900 },
  { nome: "Profissional", valor: 49900 },
  { nome: "Premium", valor: 89900 },
];

const vazio = {
  nome: "",
  empresa: "",
  email: "",
  telefone: "",
  plano: "Profissional",
  status: "ativo" as StatusCliente,
  observacoes: "",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cliente?: Cliente | null;
}

export const ClienteFormDialog = ({ open, onOpenChange, cliente }: Props) => {
  const [form, setForm] = useState(vazio);

  useEffect(() => {
    if (cliente) {
      setForm({
        nome: cliente.nome,
        empresa: cliente.empresa,
        email: cliente.email,
        telefone: cliente.telefone,
        plano: cliente.plano,
        status: cliente.status,
        observacoes: cliente.observacoes ?? "",
      });
    } else {
      setForm(vazio);
    }
  }, [cliente, open]);

  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      toast({ title: "Preencha nome e email", variant: "destructive" });
      return;
    }
    const valorMensalCents = planos.find((p) => p.nome === form.plano)?.valor ?? 49900;
    setSalvando(true);
    try {
      if (cliente) {
        await clientesStore.update(cliente.id, { ...form, valorMensalCents });
        toast({ title: "Cliente atualizado" });
      } else {
        const hoje = new Date().toISOString().slice(0, 10);
        const prox = new Date();
        prox.setMonth(prox.getMonth() + 1);
        await clientesStore.add({
          ...form,
          valorMensalCents,
          contratacao: hoje,
          proximoPagamento: prox.toISOString().slice(0, 10),
          siteId: null,
          avatarCor: "205 85% 55%",
        });
        toast({ title: "Cliente adicionado" });
      }
      onOpenChange(false);
    } catch {
      toast({ title: "Erro ao salvar cliente", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Adicionar cliente"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Empresa</Label>
            <Input value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Plano</Label>
            <Select value={form.plano} onValueChange={(v) => setForm({ ...form, plano: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {planos.map((p) => (
                  <SelectItem key={p.nome} value={p.nome}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StatusCliente })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações internas</Label>
            <Textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : cliente ? "Salvar alterações" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
