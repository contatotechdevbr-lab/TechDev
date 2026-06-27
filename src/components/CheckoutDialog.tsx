import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export type CheckoutPlan = {
  id: string;
  name: string;
  price_cents: number;
  features: string[];
  max_installments: number;
  description?: string;
  is_popular?: boolean;
};

type Props = {
  plan: CheckoutPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CheckoutDialog = ({ plan, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"subscription" | "one_time">("subscription");
  const [installments, setInstallments] = useState(1);
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  if (!plan) return null;

  const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const total = plan.price_cents;
  const perInstallment = Math.round(total / installments);

  const handleConfirm = async () => {
    if (!user) {
      onOpenChange(false);
      navigate(`/auth?plan=${plan.id}`);
      return;
    }
    setLoading(true);
    try {
      if (cpf) {
        await supabase.from("profiles").update({ cpf }).eq("id", user.id);
      }
      const { data: sub, error: subErr } = await supabase
        .from("subscriptions")
        .insert({ user_id: user.id, plan_id: plan.id, status: "pending" })
        .select()
        .single();
      if (subErr) throw subErr;

      await supabase.from("payments").insert({
        user_id: user.id,
        subscription_id: sub.id,
        amount_cents: total,
        installments: mode === "one_time" ? installments : 1,
        status: "pending",
        payment_method: "card",
      });

      toast({
        title: "Pedido registrado!",
        description: "A cobrança será processada assim que a integração de pagamento estiver ativa. Você será notificado por email.",
      });
      onOpenChange(false);
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assinar {plan.name}</DialogTitle>
          <DialogDescription>Revise os detalhes do seu plano abaixo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-semibold">{plan.name}</span>
              <span className="text-2xl font-bold text-primary">{fmt(total)}</span>
            </div>
            <ul className="space-y-1.5">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Label>Forma de cobrança</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)}>
              <div className="flex items-center space-x-2 rounded-md border border-border p-3">
                <RadioGroupItem value="subscription" id="sub" />
                <Label htmlFor="sub" className="flex-1 cursor-pointer font-normal">
                  Assinatura mensal — {fmt(total)}/mês
                </Label>
              </div>
              {plan.max_installments > 1 && (
                <div className="flex items-center space-x-2 rounded-md border border-border p-3">
                  <RadioGroupItem value="one_time" id="once" />
                  <Label htmlFor="once" className="flex-1 cursor-pointer font-normal">
                    Pagamento único — parcele em até {plan.max_installments}x
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {mode === "one_time" && plan.max_installments > 1 && (
            <div className="space-y-2">
              <Label>Parcelas</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
              >
                {Array.from({ length: plan.max_installments }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}x de {fmt(perInstallment)} {n === 1 ? "à vista" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF (para a nota fiscal)</Label>
            <Input id="cpf" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-md p-3">
            <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span>
              Pagamento por cartão será habilitado em breve via Pagar.me (PIX, boleto e cartão). Seu pedido fica reservado até lá.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="hero" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {user ? "Confirmar pedido" : "Entrar para assinar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
