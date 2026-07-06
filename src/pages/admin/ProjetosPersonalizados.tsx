import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, Loader2, FolderKanban } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/admin/PageHeader";

type ClientRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  company: string | null;
};

type CustomPlan = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  notes: string | null;
  price_cents: number;
  max_installments: number;
  active: boolean;
  created_at: string;
};

type PaymentInfo = { custom_plan_id: string; status: string };

const empty = {
  id: "",
  user_id: "",
  name: "",
  description: "",
  price_reais: "0",
  max_installments: 12,
  active: true,
};

const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ProjetosPersonalizados = () => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [projects, setProjects] = useState<CustomPlan[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: cli }, { data: cp }, { data: pay }] = await Promise.all([
      supabase
        .from("clients")
        .select("id, user_id, full_name, company")
        .not("user_id", "is", null)
        .order("full_name"),
      supabase
        .from("custom_plans")
        .select("id, user_id, name, description, notes, price_cents, max_installments, active, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("payments").select("custom_plan_id, status").not("custom_plan_id", "is", null),
    ]);
    setClients((cli as ClientRow[]) ?? []);
    setProjects((cp as CustomPlan[]) ?? []);
    setPayments((pay as PaymentInfo[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const clientByUserId = useMemo(() => {
    const m = new Map<string, ClientRow>();
    clients.forEach((c) => c.user_id && m.set(c.user_id, c));
    return m;
  }, [clients]);

  const paymentStatusByProject = useMemo(() => {
    const m = new Map<string, string>();
    payments.forEach((p) => {
      // "paid" tem prioridade sobre "pending".
      const prev = m.get(p.custom_plan_id);
      if (p.status === "paid" || !prev) m.set(p.custom_plan_id, p.status);
    });
    return m;
  }, [payments]);

  const openNew = () => {
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p: CustomPlan) => {
    setForm({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      description: p.description ?? p.notes ?? "",
      price_reais: (p.price_cents / 100).toFixed(2),
      max_installments: p.max_installments,
      active: p.active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.user_id) {
      toast({ title: "Selecione o cliente", variant: "destructive" });
      return;
    }
    if (!form.name.trim()) {
      toast({ title: "Informe o nome do projeto", variant: "destructive" });
      return;
    }
    const priceCents = Math.round(parseFloat(form.price_reais.replace(",", ".")) * 100);
    if (!priceCents || priceCents <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" });
      return;
    }

    setBusy(true);
    const payload = {
      user_id: form.user_id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      notes: form.description.trim() || null,
      price_cents: priceCents,
      max_installments: Math.min(12, Math.max(1, Number(form.max_installments) || 1)),
      interval: "one_time" as const,
      active: form.active,
    };
    const { error } = form.id
      ? await supabase.from("custom_plans").update(payload).eq("id", form.id)
      : await supabase.from("custom_plans").insert(payload);
    setBusy(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: form.id ? "Projeto atualizado" : "Projeto criado" });
    setOpen(false);
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este projeto personalizado? Pagamentos já feitos não são afetados.")) return;
    const { error } = await supabase.from("custom_plans").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else void load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos personalizados"
        description="Crie projetos com valor sob medida para um cliente. Ele paga à vista (PIX ou cartão) ou parcelado no cartão pelo painel."
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" /> Novo projeto
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const cliente = clientByUserId.get(p.user_id);
          const status = paymentStatusByProject.get(p.id);
          return (
            <Card key={p.id} className={!p.active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <div className="flex flex-shrink-0 flex-wrap justify-end gap-1">
                    {status === "paid" && (
                      <Badge className="border border-emerald-500/30 bg-emerald-500/15 text-emerald-600">Pago</Badge>
                    )}
                    {status === "pending" && <Badge variant="secondary">Aguardando</Badge>}
                    {!p.active && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-primary">{fmt(p.price_cents)}</div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Cliente: </span>
                  {cliente ? (
                    <span className="font-medium">
                      {cliente.full_name}
                      {cliente.company ? ` · ${cliente.company}` : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </p>
                {p.description && <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                <p className="text-xs text-muted-foreground">
                  À vista (PIX/cartão)
                  {p.max_installments > 1 ? ` · parcelado em até ${p.max_installments}x no cartão` : ""}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {projects.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <FolderKanban className="h-8 w-8" />
            <p>Nenhum projeto personalizado criado ainda.</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar projeto" : "Novo projeto personalizado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Cliente</Label>
              <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.user_id as string}>
                      {c.full_name}
                      {c.company ? ` · ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome do projeto</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Site institucional + loja"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price_reais}
                  onChange={(e) => setForm({ ...form, price_reais: e.target.value })}
                />
              </div>
              <div>
                <Label>Máx. parcelas (cartão)</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={form.max_installments}
                  onChange={(e) => setForm({ ...form, max_installments: Number(e.target.value) })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              O cliente pode pagar à vista no PIX ou cartão. Se o máximo de parcelas for maior que 1, ele também poderá
              parcelar o valor no cartão (uma única cobrança dividida em Nx).
            </p>
            <div>
              <Label>Descrição / escopo (opcional)</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhe o que está incluso no projeto..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Disponível para o cliente pagar</Label>
              <Switch id="ativo" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjetosPersonalizados;
