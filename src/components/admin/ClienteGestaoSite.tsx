import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Save, Trash2, Server, CreditCard, MessageSquare, History } from "lucide-react";

type Props = {
  clientId: string;
  siteId: string | null;
};

type SiteInfra = {
  disk_used_mb: number | null;
  disk_total_mb: number | null;
  uptime_pct: number | null;
  ssl_active: boolean | null;
  ssl_expires_at: string | null;
  backup_enabled: boolean | null;
  last_backup_at: string | null;
  domain_expires_at: string | null;
  tech_notes: string | null;
};

type Installment = {
  id: string;
  description: string;
  amount_cents: number;
  due_date: string | null;
  status: string;
  installment_no: number | null;
  installments_total: number | null;
  paid_at: string | null;
};

type RequestRow = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  admin_response: string | null;
  created_at: string;
};

type TimelineRow = { id: string; title: string; description: string | null; event_date: string };

const fmtBRL = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateInput = (d: string | null) => (d ? d.slice(0, 10) : "");

/**
 * Painel administrativo de gestão do site de um cliente.
 * Escreve direto no Supabase (RLS "admin manage" via has_role).
 */
export const ClienteGestaoSite = ({ clientId, siteId }: Props) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [infra, setInfra] = useState<SiteInfra | null>(null);
  const [savingInfra, setSavingInfra] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);

  // Formulário de nova cobrança
  const [chgDesc, setChgDesc] = useState("");
  const [chgValue, setChgValue] = useState("");
  const [chgDue, setChgDue] = useState("");
  const [chgTotal, setChgTotal] = useState("1");
  const [addingCharge, setAddingCharge] = useState(false);

  // Formulário de novo evento na timeline
  const [tlTitle, setTlTitle] = useState("");
  const [tlDesc, setTlDesc] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);

  const load = useCallback(async () => {
    // user_id do cliente (necessário para inserir nas tabelas com user_id NOT NULL)
    const { data: c } = await supabase.from("clients").select("user_id").eq("id", clientId).maybeSingle();
    setUserId((c as any)?.user_id ?? null);

    const [instRes, reqRes, tlRes] = await Promise.all([
      supabase
        .from("site_installments")
        .select("id, description, amount_cents, due_date, status, installment_no, installments_total, paid_at")
        .eq("client_id", clientId)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("site_requests")
        .select("id, type, title, description, status, admin_response, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("site_timeline")
        .select("id, title, description, event_date")
        .eq("client_id", clientId)
        .order("event_date", { ascending: false }),
    ]);
    setInstallments((instRes.data as Installment[]) ?? []);
    setRequests((reqRes.data as RequestRow[]) ?? []);
    setTimeline((tlRes.data as TimelineRow[]) ?? []);

    if (siteId) {
      const { data: s } = await supabase
        .from("sites")
        .select(
          "disk_used_mb, disk_total_mb, uptime_pct, ssl_active, ssl_expires_at, backup_enabled, last_backup_at, domain_expires_at, tech_notes",
        )
        .eq("id", siteId)
        .maybeSingle();
      setInfra((s as SiteInfra) ?? null);
    }
  }, [clientId, siteId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ---- Infra do site ---- */
  const saveInfra = async () => {
    if (!siteId || !infra) return;
    setSavingInfra(true);
    try {
      const { error } = await supabase
        .from("sites")
        .update({
          disk_used_mb: infra.disk_used_mb,
          disk_total_mb: infra.disk_total_mb,
          uptime_pct: infra.uptime_pct,
          ssl_active: infra.ssl_active,
          ssl_expires_at: infra.ssl_expires_at || null,
          backup_enabled: infra.backup_enabled,
          last_backup_at: infra.last_backup_at || null,
          domain_expires_at: infra.domain_expires_at || null,
          tech_notes: infra.tech_notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", siteId);
      if (error) throw error;
      toast({ title: "Dados de hospedagem salvos" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSavingInfra(false);
    }
  };

  const setInfraField = <K extends keyof SiteInfra>(key: K, value: SiteInfra[K]) =>
    setInfra((prev) => ({ ...(prev ?? ({} as SiteInfra)), [key]: value }));

  /* ---- Cobranças ---- */
  const addCharge = async () => {
    if (!userId) {
      toast({ title: "Cliente sem conta vinculada", description: "Não é possível criar cobrança sem usuário.", variant: "destructive" });
      return;
    }
    const cents = Math.round(parseFloat(chgValue.replace(",", ".")) * 100);
    if (!chgDesc.trim() || !cents || cents <= 0) {
      toast({ title: "Preencha descrição e valor", variant: "destructive" });
      return;
    }
    setAddingCharge(true);
    try {
      const total = Math.max(1, parseInt(chgTotal || "1", 10));
      // Cria N parcelas quando total > 1, dividindo o valor informado.
      const rows = Array.from({ length: total }).map((_, i) => {
        const due = chgDue ? new Date(chgDue) : null;
        if (due) due.setMonth(due.getMonth() + i);
        return {
          client_id: clientId,
          site_id: siteId,
          user_id: userId,
          description: chgDesc.trim(),
          amount_cents: Math.round(cents / total),
          due_date: due ? due.toISOString().slice(0, 10) : null,
          status: "pending",
          installment_no: i + 1,
          installments_total: total,
        };
      });
      const { error } = await supabase.from("site_installments").insert(rows);
      if (error) throw error;
      toast({ title: total > 1 ? `${total} parcelas criadas` : "Cobrança criada" });
      setChgDesc("");
      setChgValue("");
      setChgDue("");
      setChgTotal("1");
      await load();
    } catch (e: any) {
      toast({ title: "Erro ao criar cobrança", description: e.message, variant: "destructive" });
    } finally {
      setAddingCharge(false);
    }
  };

  const markChargePaid = async (id: string) => {
    const { error } = await supabase
      .from("site_installments")
      .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Cobrança marcada como paga" });
    await load();
  };

  const deleteCharge = async (id: string) => {
    const { error } = await supabase.from("site_installments").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    await load();
  };

  /* ---- Solicitações ---- */
  const updateRequest = async (id: string, patch: Partial<RequestRow>) => {
    const { error } = await supabase
      .from("site_requests")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Solicitação atualizada" });
    await load();
  };

  /* ---- Timeline ---- */
  const addEvent = async () => {
    if (!userId) {
      toast({ title: "Cliente sem conta vinculada", variant: "destructive" });
      return;
    }
    if (!tlTitle.trim()) {
      toast({ title: "Informe o título do evento", variant: "destructive" });
      return;
    }
    setAddingEvent(true);
    try {
      const { error } = await supabase.from("site_timeline").insert({
        client_id: clientId,
        user_id: userId,
        title: tlTitle.trim(),
        description: tlDesc.trim() || null,
        event_date: new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: "Evento adicionado ao histórico" });
      setTlTitle("");
      setTlDesc("");
      await load();
    } catch (e: any) {
      toast({ title: "Erro ao adicionar evento", description: e.message, variant: "destructive" });
    } finally {
      setAddingEvent(false);
    }
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("site_timeline").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    await load();
  };

  return (
    <div className="space-y-6">
      {/* ---- Infra / Hospedagem ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" /> Hospedagem e infraestrutura
          </CardTitle>
          <CardDescription>
            {siteId
              ? "Dados exibidos ao cliente na área Meu Site."
              : "Vincule um site a este cliente para editar os dados de hospedagem."}
          </CardDescription>
        </CardHeader>
        {siteId && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Espaço usado (MB)</Label>
                <Input
                  type="number"
                  value={infra?.disk_used_mb ?? ""}
                  onChange={(e) => setInfraField("disk_used_mb", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Espaço total (MB)</Label>
                <Input
                  type="number"
                  value={infra?.disk_total_mb ?? ""}
                  onChange={(e) => setInfraField("disk_total_mb", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Uptime (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={infra?.uptime_pct ?? ""}
                  onChange={(e) => setInfraField("uptime_pct", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>SSL expira em</Label>
                <Input
                  type="date"
                  value={dateInput(infra?.ssl_expires_at ?? null)}
                  onChange={(e) => setInfraField("ssl_expires_at", e.target.value || null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Último backup</Label>
                <Input
                  type="date"
                  value={dateInput(infra?.last_backup_at ?? null)}
                  onChange={(e) => setInfraField("last_backup_at", e.target.value || null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Domínio expira em</Label>
                <Input
                  type="date"
                  value={dateInput(infra?.domain_expires_at ?? null)}
                  onChange={(e) => setInfraField("domain_expires_at", e.target.value || null)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!infra?.ssl_active}
                  onCheckedChange={(v) => setInfraField("ssl_active", v)}
                  id="ssl-active"
                />
                <Label htmlFor="ssl-active">SSL ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!infra?.backup_enabled}
                  onCheckedChange={(v) => setInfraField("backup_enabled", v)}
                  id="backup-enabled"
                />
                <Label htmlFor="backup-enabled">Backup automático</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas técnicas</Label>
              <Textarea
                rows={2}
                value={infra?.tech_notes ?? ""}
                onChange={(e) => setInfraField("tech_notes", e.target.value)}
                placeholder="Ex.: Next.js na Vercel, banco Supabase..."
              />
            </div>
            <Button onClick={saveInfra} disabled={savingInfra}>
              {savingInfra ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Salvar hospedagem
            </Button>
          </CardContent>
        )}
      </Card>

      {/* ---- Cobranças ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" /> Cobranças
          </CardTitle>
          <CardDescription>Crie cobranças/parcelas que o cliente pode pagar via PIX ou cartão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            <div className="space-y-1.5 lg:col-span-2">
              <Label>Descrição</Label>
              <Input value={chgDesc} onChange={(e) => setChgDesc(e.target.value)} placeholder="Ex.: Mensalidade Junho" />
            </div>
            <div className="space-y-1.5">
              <Label>Valor total (R$)</Label>
              <Input value={chgValue} onChange={(e) => setChgValue(e.target.value)} placeholder="199,90" inputMode="decimal" />
            </div>
            <div className="space-y-1.5">
              <Label>1º vencimento</Label>
              <Input type="date" value={chgDue} onChange={(e) => setChgDue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Parcelas</Label>
              <Input type="number" min="1" value={chgTotal} onChange={(e) => setChgTotal(e.target.value)} />
            </div>
          </div>
          <Button onClick={addCharge} disabled={addingCharge}>
            {addingCharge ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
            Criar cobrança
          </Button>

          <div className="divide-y divide-border border-t border-border pt-2">
            {installments.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma cobrança criada.</p>
            ) : (
              installments.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {c.description}
                      {c.installments_total && c.installments_total > 1
                        ? ` (${c.installment_no}/${c.installments_total})`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtBRL(c.amount_cents)}
                      {c.due_date ? ` · vence ${new Date(c.due_date).toLocaleDateString("pt-BR")}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        c.status === "paid"
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600"
                          : "border-amber-500/30 bg-amber-500/15 text-amber-600"
                      }
                    >
                      {c.status === "paid" ? "Pago" : c.status === "pending" ? "Em aberto" : c.status}
                    </Badge>
                    {c.status !== "paid" && (
                      <Button variant="outline" size="sm" onClick={() => markChargePaid(c.id)}>
                        Marcar pago
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => deleteCharge(c.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---- Solicitações ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" /> Solicitações do cliente
          </CardTitle>
          <CardDescription>Responda e atualize o status das solicitações de alteração.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma solicitação recebida.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <RequestEditor key={r.id} request={r} onSave={updateRequest} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Timeline ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Histórico do cliente
          </CardTitle>
          <CardDescription>
            Eventos aparecem automaticamente (pagamentos) e você pode adicionar entradas manuais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={tlTitle} onChange={(e) => setTlTitle(e.target.value)} placeholder="Ex.: Redesign concluído" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input value={tlDesc} onChange={(e) => setTlDesc(e.target.value)} placeholder="Detalhes do evento" />
            </div>
            <Button onClick={addEvent} disabled={addingEvent}>
              {addingEvent ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
              Adicionar
            </Button>
          </div>

          <div className="space-y-3 border-t border-border pt-3">
            {timeline.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum evento registrado.</p>
            ) : (
              timeline.map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.event_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => deleteEvent(t.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* Editor inline de uma solicitação (status + resposta). */
function RequestEditor({
  request,
  onSave,
}: {
  request: RequestRow;
  onSave: (id: string, patch: Partial<RequestRow>) => Promise<void>;
}) {
  const [status, setStatus] = useState(request.status);
  const [response, setResponse] = useState(request.admin_response ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(request.id, { status, admin_response: response.trim() || null });
    setSaving(false);
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{request.title}</p>
          <p className="text-xs text-muted-foreground">
            {request.type} · {new Date(request.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{request.description}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Aberta</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="done">Concluída</SelectItem>
              <SelectItem value="rejected">Recusada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Resposta ao cliente</Label>
          <Textarea rows={2} value={response} onChange={(e) => setResponse(e.target.value)} />
        </div>
      </div>
      <Button className="mt-3" size="sm" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
        Salvar resposta
      </Button>
    </div>
  );
}
