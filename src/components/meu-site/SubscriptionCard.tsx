import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";
import { RefreshCw, RotateCcw, CalendarClock, CheckCircle2, Clock, XCircle } from "lucide-react";

export type SubscriptionRow = {
  id: string;
  status: string;
  billing_type: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  plan_name: string | null;
  plan_price_cents: number | null;
};

const fmtBRL = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return { label: "Ativa", className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600", Icon: CheckCircle2 };
    case "pending":
      return { label: "Aguardando pagamento", className: "border-amber-500/30 bg-amber-500/15 text-amber-600", Icon: Clock };
    case "past_due":
      return { label: "Pagamento atrasado", className: "border-red-500/30 bg-red-500/15 text-red-600", Icon: XCircle };
    case "canceled":
      return { label: "Cancelada", className: "border-border bg-muted text-muted-foreground", Icon: XCircle };
    case "paused":
    case "suspended":
      return { label: "Pausada", className: "border-sky-500/30 bg-sky-500/15 text-sky-600", Icon: Clock };
    default:
      return { label: status, className: "border-border bg-muted text-muted-foreground", Icon: Clock };
  }
}

/**
 * Cartão de assinatura recorrente na página "Meu Site".
 * Mostra o plano, status e valor mensal, e permite cancelar a assinatura
 * (interrompe as cobranças mensais futuras no cartão do cliente).
 */
export function SubscriptionCard({
  subscription,
  onChanged,
}: {
  subscription: SubscriptionRow;
  onChanged: () => void;
}) {
  const [canceling, setCanceling] = useState(false);
  const b = statusBadge(subscription.status);
  const isCancelable = ["active", "pending", "past_due", "paused", "suspended"].includes(subscription.status);
  const isCanceled = subscription.status === "canceled";

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const res = await apiFetch("/api/mercadopago/payment-status", {
        method: "POST",
        body: JSON.stringify({ action: "cancelSubscription" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Não foi possível cancelar a assinatura.");
      toast({
        title: "Assinatura cancelada",
        description: "Nenhuma cobrança futura será feita no seu cartão.",
      });
      onChanged();
    } catch (e: any) {
      toast({ title: "Erro ao cancelar", description: e.message, variant: "destructive" });
    } finally {
      setCanceling(false);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Assinatura recorrente</CardTitle>
              <CardDescription>
                {subscription.plan_name ?? "Plano"}
                {subscription.plan_price_cents ? ` · ${fmtBRL(subscription.plan_price_cents)}/mês` : ""}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={`border ${b.className}`}>
            <b.Icon className="mr-1 h-3.5 w-3.5" />
            {b.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          {isCanceled ? (
            <span>Cancelada em {fmtDate(subscription.canceled_at)} — não haverá novas cobranças.</span>
          ) : (
            <span>Próxima cobrança prevista para {fmtDate(subscription.current_period_end)}.</span>
          )}
        </div>

        {isCancelable && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-500/30 text-red-600 hover:bg-red-500/10" disabled={canceling}>
                {canceling ? (
                  <>
                    <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> Cancelando...
                  </>
                ) : (
                  "Cancelar assinatura"
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ao confirmar, sua assinatura será cancelada no Mercado Pago e{" "}
                  <strong>nenhuma cobrança futura</strong> será feita no seu cartão. Você continuará com acesso até o
                  fim do período já pago. Esta ação não pode ser desfeita — para voltar, será necessário assinar
                  novamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Sim, cancelar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
