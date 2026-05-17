import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Ban, Loader2, PauseCircle, PlayCircle, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CustomerDetail = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [customPlanOpen, setCustomPlanOpen] = useState(false);
  const [cpForm, setCpForm] = useState({ name: "", price_reais: "97.00", notes: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    setProfile(p);
    const { data: s } = await supabase
      .from("subscriptions")
      .select("*, plans(name, price_cents), custom_plans(name, price_cents)")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    setSubs(s ?? []);
    const { data: pay } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    setPayments(pay ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const updateSub = async (subId: string, status: string) => {
    const { error } = await supabase.from("subscriptions").update({
      status,
      canceled_at: status === "canceled" ? new Date().toISOString() : null,
    }).eq("id", subId);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Atualizado" }); load(); }
  };

  const createCustomPlan = async () => {
    if (!id || !cpForm.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setBusy(true);
    const price_cents = Math.round(parseFloat(cpForm.price_reais.replace(",", ".")) * 100);
    const { data: cp, error } = await supabase
      .from("custom_plans")
      .insert({ user_id: id, name: cpForm.name.trim(), price_cents, notes: cpForm.notes || null })
      .select()
      .single();
    if (error) { setBusy(false); toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    const { error: sErr } = await supabase
      .from("subscriptions")
      .insert({ user_id: id, custom_plan_id: cp.id, status: "pending" });
    setBusy(false);
    if (sErr) toast({ title: "Erro", description: sErr.message, variant: "destructive" });
    else {
      toast({ title: "Plano personalizado criado", description: "Assinatura pendente — será ativada após cobrança." });
      setCustomPlanOpen(false);
      setCpForm({ name: "", price_reais: "97.00", notes: "" });
      load();
    }
  };

  if (!profile) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/admin/clientes"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{profile.full_name ?? profile.email}</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div><div className="text-muted-foreground">CPF</div><div>{profile.cpf ?? "—"}</div></div>
          <div><div className="text-muted-foreground">Telefone</div><div>{profile.phone ?? "—"}</div></div>
          <div><div className="text-muted-foreground">Cadastro</div><div>{new Date(profile.created_at).toLocaleDateString("pt-BR")}</div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Assinaturas</CardTitle>
            <CardDescription>Ações: suspender, reativar, cancelar</CardDescription>
          </div>
          <Button size="sm" variant="hero" onClick={() => setCustomPlanOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Plano personalizado
          </Button>
        </CardHeader>
        <CardContent>
          {subs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem assinaturas.</p>
          ) : (
            <div className="space-y-3">
              {subs.map((s) => {
                const plan = s.plans || s.custom_plans;
                const isCustom = !!s.custom_plans;
                return (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4 border border-border rounded-lg">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {plan?.name ?? "—"} {isCustom && <Badge variant="secondary">Personalizado</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">{plan ? fmt(plan.price_cents) + "/mês" : ""}</div>
                    </div>
                    <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                    <div className="flex gap-2">
                      {s.status === "active" ? (
                        <Button size="sm" variant="outline" onClick={() => updateSub(s.id, "paused")}>
                          <PauseCircle className="h-4 w-4 mr-1" /> Suspender
                        </Button>
                      ) : s.status !== "canceled" ? (
                        <Button size="sm" variant="outline" onClick={() => updateSub(s.id, "active")}>
                          <PlayCircle className="h-4 w-4 mr-1" /> Reativar
                        </Button>
                      ) : null}
                      {s.status !== "canceled" && (
                        <Button size="sm" variant="ghost" onClick={() => updateSub(s.id, "canceled")}>
                          <Ban className="h-4 w-4 mr-1" /> Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico de pagamentos</CardTitle></CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem pagamentos.</p>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{new Date(p.paid_at ?? p.created_at).toLocaleString("pt-BR")}</span>
                  <span>{p.installments}x</span>
                  <span className="font-medium">{fmt(p.amount_cents)}</span>
                  <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={customPlanOpen} onOpenChange={setCustomPlanOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo plano personalizado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do plano</Label><Input value={cpForm.name} onChange={(e) => setCpForm({ ...cpForm, name: e.target.value })} placeholder="Ex: Plano Empresa João" /></div>
            <div><Label>Valor mensal (R$)</Label><Input type="number" step="0.01" value={cpForm.price_reais} onChange={(e) => setCpForm({ ...cpForm, price_reais: e.target.value })} /></div>
            <div><Label>Observações</Label><Input value={cpForm.notes} onChange={(e) => setCpForm({ ...cpForm, notes: e.target.value })} placeholder="Opcional" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCustomPlanOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={createCustomPlan} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDetail;
