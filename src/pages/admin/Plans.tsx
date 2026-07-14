import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  features: string[];
  is_popular: boolean;
  max_installments: number;
  active: boolean;
  discount_annual_pct: number;
  allow_recurring: boolean;
  allow_upfront: boolean;
};

const empty = {
  id: "",
  name: "",
  description: "",
  price_reais: "0",
  features: "",
  is_popular: false,
  max_installments: 1,
  active: true,
  discount_annual_pct: 20,
  allow_recurring: true,
  allow_upfront: true,
};

const Plans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof empty>(empty);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("plans").select("*").order("price_cents");
    setPlans((data as Plan[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (p: Plan) => {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      price_reais: (p.price_cents / 100).toFixed(2),
      features: p.features.join("\n"),
      is_popular: p.is_popular,
      max_installments: p.max_installments,
      active: p.active,
      discount_annual_pct: p.discount_annual_pct ?? 20,
      allow_recurring: p.allow_recurring ?? true,
      allow_upfront: p.allow_upfront ?? true,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_cents: Math.round(parseFloat(form.price_reais.replace(",", ".")) * 100),
      features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      is_popular: form.is_popular,
      max_installments: Number(form.max_installments) || 1,
      active: form.active,
      discount_annual_pct: Math.min(90, Math.max(0, Number(form.discount_annual_pct) || 0)),
      allow_recurring: form.allow_recurring,
      allow_upfront: form.allow_upfront,
    };
    const { error } = form.id
      ? await supabase.from("plans").update(payload).eq("id", form.id)
      : await supabase.from("plans").insert(payload);
    setBusy(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: form.id ? "Plano atualizado" : "Plano criado" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este plano? Assinaturas existentes não são afetadas.")) return;
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else load();
  };

  const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planos públicos</h2>
          <p className="text-sm text-muted-foreground">Os planos exibidos na seção de Planos da landing.</p>
        </div>
        <Button variant="hero" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo plano</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <Card key={p.id} className={!p.active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>{p.name}</CardTitle>
                <div className="flex gap-1">
                  {p.is_popular && <Badge>Popular</Badge>}
                  {!p.active && <Badge variant="secondary">Inativo</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-primary">{fmt(p.price_cents)}<span className="text-sm text-muted-foreground font-normal">/mês</span></div>
              <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              <p className="text-xs text-muted-foreground">{p.features.length} recursos • até {p.max_installments}x</p>
              <div className="flex flex-wrap gap-1.5">
                {p.allow_upfront !== false && (
                  <Badge variant="secondary">À vista {p.discount_annual_pct ?? 20}% off</Badge>
                )}
                {p.allow_recurring !== false && <Badge variant="secondary">Recorrência 12x</Badge>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5 mr-1" /> Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">Nenhum plano cadastrado.</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Editar plano" : "Novo plano"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descrição curta</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Preço (R$/mês)</Label><Input type="number" step="0.01" value={form.price_reais} onChange={(e) => setForm({ ...form, price_reais: e.target.value })} /></div>
              <div><Label>Max. parcelas</Label><Input type="number" min={1} max={12} value={form.max_installments} onChange={(e) => setForm({ ...form, max_installments: Number(e.target.value) })} /></div>
            </div>
            <div>
              <Label>Desconto à vista (% sobre os 12 meses)</Label>
              <Input
                type="number"
                min={0}
                max={90}
                value={form.discount_annual_pct}
                onChange={(e) => setForm({ ...form, discount_annual_pct: Number(e.target.value) })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Aplicado ao pagamento único de 12 meses (PIX ou cartão).
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="up">Aceita pagamento à vista</Label>
              <Switch id="up" checked={form.allow_upfront} onCheckedChange={(v) => setForm({ ...form, allow_upfront: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="rec">Aceita recorrência (12x no cartão)</Label>
              <Switch id="rec" checked={form.allow_recurring} onCheckedChange={(v) => setForm({ ...form, allow_recurring: v })} />
            </div>
            <div>
              <Label>Recursos (um por linha)</Label>
              <Textarea rows={5} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Suporte 24h&#10;Hospedagem inclusa&#10;..." />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pop">Marcar como popular</Label>
              <Switch id="pop" checked={form.is_popular} onCheckedChange={(v) => setForm({ ...form, is_popular: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="act">Plano ativo</Label>
              <Switch id="act" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={save} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Plans;
