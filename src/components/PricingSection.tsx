import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Sparkles,
  Server,
  Globe,
  Headphones,
  Wrench,
  Eye,
  Lock,
  DatabaseBackup,
  ShieldAlert,
  MessageCircle,
} from "lucide-react";
import { CheckoutDialog, type CheckoutPlan, type BillingMode } from "@/components/CheckoutDialog";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_LINK =
  "https://wa.me/5521980386279?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20um%20or%C3%A7amento%20para%20um%20projeto%20personalizado.";

// Fallback enquanto os planos reais carregam do banco
const FALLBACK_PLANS: CheckoutPlan[] = [
  {
    id: "p1",
    name: "1 a 5 Profissionais",
    description: "Ideal para pequenas equipes",
    price_cents: 10990,
    features: ["Até 5 profissionais", "Agenda integrada", "Suporte por e-mail", "Hospedagem inclusa"],
    max_installments: 1,
    is_popular: false,
  },
  {
    id: "p2",
    name: "6 a 10 Profissionais",
    description: "Para equipes em crescimento",
    price_cents: 16490,
    features: [
      "Até 10 profissionais",
      "Agenda integrada",
      "Suporte prioritário",
      "Hospedagem inclusa",
      "Relatórios avançados",
    ],
    max_installments: 1,
    is_popular: true,
  },
  {
    id: "p3",
    name: "+10 Profissionais",
    description: "Para grandes operações",
    price_cents: 21990,
    features: [
      "Profissionais ilimitados",
      "Agenda integrada",
      "Suporte 24/7",
      "Hospedagem inclusa",
      "Relatórios avançados",
      "Gerente de conta",
    ],
    max_installments: 1,
    is_popular: false,
  },
];

const CUSTOM_FEATURES = [
  { icon: Server, label: "Hospedagem Premium" },
  { icon: Globe, label: "Domínio (.com ou .com.br*)" },
  { icon: Headphones, label: "Suporte técnico rápido" },
  { icon: Wrench, label: "Manutenção contínua" },
  { icon: Eye, label: "Monitoramento 24 horas" },
  { icon: Lock, label: "Certificado SSL" },
  { icon: DatabaseBackup, label: "Backup automático" },
  { icon: ShieldAlert, label: "Atualizações de segurança" },
];

function formatPrice(cents: number) {
  const value = (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const [reais, centavos] = value.split(",");
  return { reais, centavos };
}

type Tab = "assinatura" | "projeto";

export const PricingSection = () => {
  const [tab, setTab] = useState<Tab>("assinatura");
  // Forma de pagamento escolhida por card (independente entre os planos).
  const [billingModes, setBillingModes] = useState<Record<string, BillingMode>>({});
  const [plans, setPlans] = useState<CheckoutPlan[]>(FALLBACK_PLANS);
  const [selected, setSelected] = useState<CheckoutPlan | null>(null);

  const modeFor = (planId: string): BillingMode => billingModes[planId] ?? "upfront";

  useEffect(() => {
    let active = true;
    supabase
      .from("plans")
      .select(
        "id, name, description, price_cents, features, max_installments, is_popular, discount_annual_pct, allow_recurring, allow_upfront",
      )
      .eq("active", true)
      .order("price_cents", { ascending: true })
      .then(({ data }) => {
        if (active && data && data.length > 0) {
          setPlans(
            data.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description ?? "",
              price_cents: p.price_cents,
              features: p.features ?? [],
              max_installments: p.max_installments ?? 1,
              is_popular: p.is_popular ?? false,
              discount_annual_pct: p.discount_annual_pct ?? 20,
              allow_recurring: p.allow_recurring ?? true,
              allow_upfront: p.allow_upfront ?? true,
            })),
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="planos" className="relative py-24 bg-background overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" aria-hidden />
      <div className="container relative z-10 mx-auto px-4">
        {/* Cabeçalho */}
        <div className="text-center max-w-2xl mx-auto mb-10 animate-fade-in">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-4">Preços</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Escolha o ideal para <span className="text-gradient">você</span>
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Planos pensados para crescer com o tamanho do seu negócio.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 p-1">
            <button
              type="button"
              onClick={() => setTab("projeto")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                tab === "projeto"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Projeto Personalizado
            </button>
            <button
              type="button"
              onClick={() => setTab("assinatura")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                tab === "assinatura"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Assinatura
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mb-10">
          {tab === "assinatura"
            ? "Escolha o plano e, no card, decida como quer pagar."
            : "Orçamento sob medida para o seu projeto, sem mensalidade fixa."}
        </p>

        {/* Aba: Assinatura — 3 cards */}
        {tab === "assinatura" && (
          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto items-stretch">
            {plans.map((plan) => {
              const popular = plan.is_popular;
              const discountPct = plan.discount_annual_pct ?? 20;
              const upfrontTotalCents = Math.round(plan.price_cents * 12 * (1 - discountPct / 100));
              const mode = modeFor(plan.id);
              const isUpfront = mode === "upfront";
              // No modo à vista mostramos o TOTAL dos 12 meses; no parcelado, o valor mensal.
              const { reais, centavos } = formatPrice(isUpfront ? upfrontTotalCents : plan.price_cents);
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-8 animate-fade-in transition-transform hover:-translate-y-1 ${
                    popular
                      ? "border-primary bg-card shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)] md:scale-105"
                      : "border-border bg-card/60"
                  }`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                      Mais popular
                    </span>
                  )}
                  <h3 className="text-center text-base font-medium text-muted-foreground mb-4">
                    {plan.name}
                  </h3>
                  <div className="text-center mb-1">
                    <span className="align-top text-lg font-semibold text-primary">R$ </span>
                    <span className="text-5xl font-bold text-primary">{reais}</span>
                    <span className="text-2xl font-bold text-primary">,{centavos}</span>
                    <span className="text-sm text-muted-foreground">{isUpfront ? " à vista" : "/mês"}</span>
                  </div>
                  <p className="text-center text-xs text-muted-foreground mb-4">
                    {isUpfront ? (
                      <>
                        12 meses de uma vez ·{" "}
                        <span className="font-semibold text-primary">{discountPct}% de desconto</span>
                      </>
                    ) : (
                      "12x no cartão · cobrança mensal automática"
                    )}
                  </p>

                  {/* Seletor de forma de pagamento — discreto, por card */}
                  <div
                    role="radiogroup"
                    aria-label={`Forma de pagamento do plano ${plan.name}`}
                    className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-background/50 p-1"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isUpfront}
                      onClick={() => setBillingModes((prev) => ({ ...prev, [plan.id]: "upfront" }))}
                      className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
                        isUpfront
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      À vista · {discountPct}% OFF
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!isUpfront}
                      onClick={() => setBillingModes((prev) => ({ ...prev, [plan.id]: "recurring" }))}
                      className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
                        !isUpfront
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Recorrência 12x
                    </button>
                  </div>

                  <p className="text-center text-sm text-foreground/80 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={popular ? "default" : "outline"}
                    onClick={() => setSelected(plan)}
                  >
                    {isUpfront ? "Assinar à vista" : "Assinar parcelado"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Aba: Projeto Personalizado — card largo único */}
        {tab === "projeto" && (
          <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="rounded-2xl border border-primary/40 bg-card overflow-hidden md:grid md:grid-cols-[1.1fr_1fr]">
              {/* Lado esquerdo: destaque */}
              <div className="p-8 md:p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                  <Sparkles className="h-3.5 w-3.5" /> Sob medida
                </span>
                <h3 className="text-3xl font-bold mb-3 text-balance">Projeto Personalizado</h3>
                <p className="text-muted-foreground mb-6 text-pretty leading-relaxed">
                  Tudo o que o seu site precisa para permanecer online, seguro e atualizado —
                  desenvolvido especialmente para o seu negócio.
                </p>
                <p className="text-2xl font-bold text-primary mb-6">Valor sob consulta</p>
                <Button variant="whatsapp" size="lg" className="w-full sm:w-auto" asChild>
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" /> Solicitar Orçamento
                  </a>
                </Button>
              </div>
              {/* Lado direito: recursos */}
              <div className="p-8 md:p-10 bg-card/40">
                <p className="text-sm font-semibold text-foreground mb-5">O que está incluso</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CUSTOM_FEATURES.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </span>
                      <span className="font-medium">{label}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-muted-foreground">
                  *Domínio .com.br sujeito a disponibilidade e registro junto ao Registro.br.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <CheckoutDialog
          plan={selected}
          open={!!selected}
          billingMode={modeFor(selected.id)}
          onOpenChange={(o) => !o && setSelected(null)}
        />
      )}
    </section>
  );
};

export default PricingSection;
