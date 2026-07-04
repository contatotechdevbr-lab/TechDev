import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingSection } from "@/components/PricingSection";
import { LogoLink } from "@/components/LogoLink";
import { InstallmentCheckoutDialog, type ChargeToPay } from "@/components/meu-site/InstallmentCheckoutDialog";
import { NewRequestDialog } from "@/components/meu-site/NewRequestDialog";
import {
  LogOut,
  Shield,
  RefreshCw,
  Globe,
  ShieldCheck,
  HardDrive,
  Activity,
  DatabaseBackup,
  CalendarClock,
  ExternalLink,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  MessageSquare,
  History,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

// Tipos das linhas usadas nesta página (as tabelas não estão no types.ts gerado).
type SiteRow = {
  id: string;
  name: string;
  domain: string | null;
  link: string | null;
  tech: string | null;
  status: string;
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

type ClientRow = {
  id: string;
  user_id: string;
  full_name: string;
  plano: string | null;
  valor_mensal_cents: number | null;
  next_payment: string | null;
  site_id: string | null;
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
  created_at: string;
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

type TimelineRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
};

const fmtBRL = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const chargeBadge = (status: string) => {
  switch (status) {
    case "paid":
      return { label: "Pago", className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600", Icon: CheckCircle2 };
    case "pending":
      return { label: "Em aberto", className: "border-amber-500/30 bg-amber-500/15 text-amber-600", Icon: Clock };
    case "processing":
      return { label: "Processando", className: "border-sky-500/30 bg-sky-500/15 text-sky-600", Icon: RefreshCw };
    case "failed":
      return { label: "Falhou", className: "border-red-500/30 bg-red-500/15 text-red-600", Icon: XCircle };
    default:
      return { label: status, className: "border-border bg-muted text-muted-foreground", Icon: Clock };
  }
};

const requestStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return { label: "Aberta", className: "border-amber-500/30 bg-amber-500/15 text-amber-600" };
    case "in_progress":
      return { label: "Em andamento", className: "border-sky-500/30 bg-sky-500/15 text-sky-600" };
    case "done":
      return { label: "Concluída", className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600" };
    case "rejected":
      return { label: "Recusada", className: "border-red-500/30 bg-red-500/15 text-red-600" };
    default:
      return { label: status, className: "border-border bg-muted text-muted-foreground" };
  }
};

const MeuSite = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [client, setClient] = useState<ClientRow | null>(null);
  const [site, setSite] = useState<SiteRow | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [payCharge, setPayCharge] = useState<ChargeToPay | null>(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    // 1) Cliente vinculado ao usuário logado (RLS garante que só vê o próprio).
    const { data: clientData } = await supabase
      .from("clients")
      .select("id, user_id, full_name, plano, valor_mensal_cents, next_payment, site_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const c = (clientData as ClientRow) ?? null;
    setClient(c);

    if (!c) {
      setSite(null);
      setInstallments([]);
      setRequests([]);
      setTimeline([]);
      return;
    }

    // 2) Site + cobranças + solicitações + timeline em paralelo.
    const [siteRes, instRes, reqRes, tlRes] = await Promise.all([
      c.site_id
        ? supabase
            .from("sites")
            .select(
              "id, name, domain, link, tech, status, disk_used_mb, disk_total_mb, uptime_pct, ssl_active, ssl_expires_at, backup_enabled, last_backup_at, domain_expires_at, tech_notes",
            )
            .eq("id", c.site_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("site_installments")
        .select("id, description, amount_cents, due_date, status, installment_no, installments_total, paid_at, created_at")
        .eq("client_id", c.id)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("site_requests")
        .select("id, type, title, description, status, admin_response, created_at")
        .eq("client_id", c.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("site_timeline")
        .select("id, title, description, event_date")
        .eq("client_id", c.id)
        .order("event_date", { ascending: false }),
    ]);

    setSite((siteRes.data as SiteRow) ?? null);
    setInstallments((instRes.data as Installment[]) ?? []);
    setRequests((reqRes.data as RequestRow[]) ?? []);
    setTimeline((tlRes.data as TimelineRow[]) ?? []);
  }, [user]);

  // Reconcilia cobranças pendentes com o Mercado Pago e recarrega.
  const syncAndLoad = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await fetch("/api/mercadopago/payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});
      await loadData();
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [user, loadData]);

  useEffect(() => {
    void syncAndLoad();
  }, [syncAndLoad]);

  const openCharges = installments.filter((i) => i.status !== "paid");
  const hasSite = Boolean(site);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4">
          <LogoLink className="text-xl font-bold text-gradient">
            TechDev
          </LogoLink>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="mr-1 h-4 w-4" />
                Painel
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <Shield className="mr-1 h-4 w-4" />
                  Admin
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl space-y-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Meu Site</h1>
            <p className="text-muted-foreground">Acompanhe sua hospedagem, cobranças e solicitações.</p>
          </div>
          <Button variant="outline" size="sm" onClick={syncAndLoad} disabled={syncing}>
            <RefreshCw className={`mr-1 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Carregando seus dados...
          </div>
        ) : !hasSite ? (
          /* ---- Estado vazio: sem site cadastrado ---- */
          <EmptyState hasClient={Boolean(client)} openCharges={openCharges} onPay={setPayCharge} />
        ) : (
          <div className="space-y-8">
            {/* Visão geral do site */}
            <SiteOverview site={site!} client={client} openCharges={openCharges} />

            {/* Abas: cobranças, solicitações, histórico */}
            <Tabs defaultValue="cobrancas">
              <TabsList className="flex-wrap">
                <TabsTrigger value="cobrancas">
                  Cobranças{openCharges.length > 0 ? ` (${openCharges.length})` : ""}
                </TabsTrigger>
                <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="cobrancas" className="mt-4">
                <ChargesCard installments={installments} onPay={setPayCharge} />
              </TabsContent>

              <TabsContent value="solicitacoes" className="mt-4">
                <RequestsCard requests={requests} onNew={() => setNewRequestOpen(true)} />
              </TabsContent>

              <TabsContent value="historico" className="mt-4">
                <TimelineCard timeline={timeline} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <InstallmentCheckoutDialog
        charge={payCharge}
        open={!!payCharge}
        onOpenChange={(o) => !o && setPayCharge(null)}
        onPaid={syncAndLoad}
      />

      {client && (
        <NewRequestDialog
          open={newRequestOpen}
          onOpenChange={setNewRequestOpen}
          clientId={client.id}
          siteId={client.site_id}
          userId={user!.id}
          onCreated={loadData}
        />
      )}
    </div>
  );
};

/* ---------------- Subcomponentes ---------------- */

function EmptyState({
  hasClient,
  openCharges,
  onPay,
}: {
  hasClient: boolean;
  openCharges: Installment[];
  onPay: (c: ChargeToPay) => void;
}) {
  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Você ainda não tem um site conosco</h2>
            <p className="mx-auto mt-1 max-w-md text-muted-foreground">
              {hasClient
                ? "Seu cadastro já está ativo. Assim que seu site for configurado pela nossa equipe, ele aparecerá aqui com todos os detalhes de hospedagem."
                : "Escolha um dos planos abaixo para começar. Depois da contratação, você acompanha tudo por aqui."}
            </p>
          </div>
          <Button variant="default" asChild>
            <a href="#planos">
              <Sparkles className="mr-1.5 h-4 w-4" /> Ver planos
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Cobranças em aberto mesmo sem site (ex.: setup inicial) */}
      {openCharges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Cobranças em aberto
            </CardTitle>
            <CardDescription>Você possui cobranças pendentes de pagamento.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {openCharges.map((c) => (
              <ChargeRow key={c.id} charge={c} onPay={onPay} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Planos reutilizados da home */}
      <div className="rounded-2xl border border-border">
        <PricingSection />
      </div>
    </div>
  );
}

function SiteOverview({
  site,
  client,
  openCharges,
}: {
  site: SiteRow;
  client: ClientRow | null;
  openCharges: Installment[];
}) {
  const diskPct =
    site.disk_used_mb && site.disk_total_mb ? Math.min(100, Math.round((site.disk_used_mb / site.disk_total_mb) * 100)) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{site.name}</CardTitle>
              <CardDescription>{site.domain ?? "Domínio a definir"}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="border border-emerald-500/30 bg-emerald-500/15 text-emerald-600">
              {site.status === "ativo" || site.status === "online" ? "Online" : site.status}
            </Badge>
            {site.link && (
              <Button variant="outline" size="sm" asChild>
                <a href={site.link} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Visitar
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <InfoTile
          icon={ShieldCheck}
          label="Certificado SSL"
          value={site.ssl_active ? "Ativo" : "Inativo"}
          hint={site.ssl_expires_at ? `Renova em ${fmtDate(site.ssl_expires_at)}` : undefined}
          ok={!!site.ssl_active}
        />
        <InfoTile
          icon={Activity}
          label="Disponibilidade"
          value={site.uptime_pct != null ? `${site.uptime_pct}%` : "—"}
          hint="Últimos 30 dias"
          ok={site.uptime_pct != null && Number(site.uptime_pct) >= 99}
        />
        <InfoTile
          icon={DatabaseBackup}
          label="Backup automático"
          value={site.backup_enabled ? "Ativado" : "Desativado"}
          hint={site.last_backup_at ? `Último: ${fmtDate(site.last_backup_at)}` : undefined}
          ok={!!site.backup_enabled}
        />
        <div className="rounded-lg border border-border p-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <HardDrive className="h-4 w-4" /> Armazenamento
          </div>
          {diskPct != null ? (
            <>
              <Progress value={diskPct} className="h-2" />
              <p className="mt-2 text-sm font-medium">
                {site.disk_used_mb} MB de {site.disk_total_mb} MB ({diskPct}%)
              </p>
            </>
          ) : (
            <p className="text-sm font-medium">—</p>
          )}
        </div>
        <InfoTile
          icon={CalendarClock}
          label="Domínio expira em"
          value={fmtDate(site.domain_expires_at)}
        />
        <InfoTile
          icon={CreditCard}
          label="Próximo pagamento"
          value={fmtDate(client?.next_payment ?? null)}
          hint={
            client?.valor_mensal_cents
              ? `${fmtBRL(client.valor_mensal_cents)}/mês`
              : openCharges.length > 0
                ? `${openCharges.length} em aberto`
                : undefined
          }
        />
        {site.tech && (
          <div className="rounded-lg border border-border p-4 sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-muted-foreground">Tecnologia</p>
            <p className="font-medium">{site.tech}</p>
            {site.tech_notes && <p className="mt-1 text-sm text-muted-foreground">{site.tech_notes}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  hint,
  ok,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
  ok?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={`h-4 w-4 ${ok === undefined ? "" : ok ? "text-emerald-600" : "text-amber-600"}`} /> {label}
      </div>
      <p className="font-medium">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ChargeRow({ charge, onPay }: { charge: Installment; onPay: (c: ChargeToPay) => void }) {
  const b = chargeBadge(charge.status);
  const canPay = charge.status !== "paid";
  const label =
    charge.installments_total && charge.installments_total > 1
      ? `${charge.description} (${charge.installment_no}/${charge.installments_total})`
      : charge.description;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">
          {fmtBRL(charge.amount_cents)}
          {charge.due_date ? ` · vence ${fmtDate(charge.due_date)}` : ""}
          {charge.paid_at ? ` · pago em ${fmtDate(charge.paid_at)}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`border ${b.className}`}>
          <b.Icon className="mr-1 h-3.5 w-3.5" />
          {b.label}
        </Badge>
        {canPay && (
          <Button
            size="sm"
            onClick={() => onPay({ id: charge.id, description: label, amount_cents: charge.amount_cents })}
          >
            Pagar
          </Button>
        )}
      </div>
    </div>
  );
}

function ChargesCard({ installments, onPay }: { installments: Installment[]; onPay: (c: ChargeToPay) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Cobranças
        </CardTitle>
        <CardDescription>Parcelas e cobranças da sua hospedagem e serviços.</CardDescription>
      </CardHeader>
      <CardContent>
        {installments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma cobrança registrada.</p>
        ) : (
          <div className="divide-y divide-border">
            {installments.map((c) => (
              <ChargeRow key={c.id} charge={c} onPay={onPay} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RequestsCard({ requests, onNew }: { requests: RequestRow[]; onNew: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Solicitações de alteração
          </CardTitle>
          <CardDescription>Peça ajustes no seu site e acompanhe o andamento.</CardDescription>
        </div>
        <Button size="sm" onClick={onNew}>
          <Plus className="mr-1 h-4 w-4" /> Nova
        </Button>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Você ainda não fez nenhuma solicitação.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const b = requestStatusBadge(r.status);
              return (
                <div key={r.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</p>
                    </div>
                    <Badge variant="outline" className={`border ${b.className}`}>
                      {b.label}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                  {r.admin_response && (
                    <div className="mt-3 rounded-md border border-border bg-secondary/40 p-3">
                      <p className="text-xs font-semibold text-primary">Resposta da equipe</p>
                      <p className="mt-1 text-sm">{r.admin_response}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineCard({ timeline }: { timeline: TimelineRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" /> Histórico
        </CardTitle>
        <CardDescription>Eventos e alterações do seu site ao longo do tempo.</CardDescription>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
        ) : (
          <div className="space-y-4">
            {timeline.map((t, i) => (
              <div key={t.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  {i < timeline.length - 1 && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className="pb-2">
                  <p className="text-sm font-medium">{t.title}</p>
                  {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                  <p className="text-xs text-muted-foreground">{fmtDateTime(t.event_date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MeuSite;
