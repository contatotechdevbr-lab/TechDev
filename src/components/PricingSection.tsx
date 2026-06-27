import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, Sparkles, Server, Globe, Headphones, Wrench, Eye, Lock, DatabaseBackup, ShieldAlert, MessageCircle, Palette, Gauge, Search, Plug, Smartphone, LayoutDashboard, Code2 } from "lucide-react";
import { CheckoutDialog, type CheckoutPlan } from "@/components/CheckoutDialog";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_LINK =
  "https://wa.me/5521987850455?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20um%20or%C3%A7amento%20para%20um%20projeto%20personalizado.";

// Plano mensal fixo da TechDev (fallback enquanto o plano real carrega do banco)
const MONTHLY_PLAN: CheckoutPlan = {
  id: "plano-mensal",
  name: "Plano Mensal",
  price_cents: 10000,
  features: [
    "Hospedagem Premium",
    "Domínio (.com ou .com.br*)",
    "Suporte técnico rápido",
    "Manutenção contínua",
    "Monitoramento 24 horas",
    "Certificado SSL",
    "Backup automático",
    "Atualizações de segurança",
  ],
  max_installments: 1,
};

const MONTHLY_BENEFITS = [
  { icon: Server, label: "Hospedagem Premium" },
  { icon: Globe, label: "Domínio (.com ou .com.br*)" },
  { icon: Headphones, label: "Suporte técnico rápido" },
  { icon: Wrench, label: "Manutenção contínua" },
  { icon: Eye, label: "Monitoramento 24 horas" },
  { icon: Lock, label: "Certificado SSL" },
  { icon: DatabaseBackup, label: "Backup automático" },
  { icon: ShieldAlert, label: "Atualizações de segurança" },
];

const CUSTOM_FEATURES = [
  { icon: Sparkles, label: "Site exclusivo e personalizado" },
  { icon: Palette, label: "Design moderno e profissional" },
  { icon: Gauge, label: "Alta performance" },
  { icon: Search, label: "SEO otimizado" },
  { icon: Plug, label: "Integrações sob medida" },
  { icon: Smartphone, label: "Responsivo para todos os dispositivos" },
  { icon: LayoutDashboard, label: "Painel administrativo (quando necessário)" },
  { icon: Code2, label: "Funcionalidades conforme a necessidade do projeto" },
];

export const PricingSection = () => {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<CheckoutPlan>(MONTHLY_PLAN);

  useEffect(() => {
    let active = true;
    supabase
      .from("plans")
      .select("id, name, price_cents, features, max_installments")
      .eq("name", "Plano Mensal")
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) {
          setPlan({
            id: data.id,
            name: data.name,
            price_cents: data.price_cents,
            features: data.features ?? MONTHLY_PLAN.features,
            max_installments: data.max_installments ?? 1,
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="planos" className="relative overflow-hidden">
      {/* ============ SEÇÃO 1 — PLANO MENSAL ============ */}
      <div className="relative py-24 bg-secondary/30 border-y border-border">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" aria-hidden />
        <div className="container relative z-10 px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Texto + preço */}
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" /> Assinatura recorrente
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4 text-balance">
                Plano <span className="text-gradient">Mensal</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl text-pretty leading-relaxed">
                Tudo o que seu site precisa para permanecer online, seguro e atualizado, sem
                preocupações.
              </p>

              <div className="flex items-end gap-2 mb-8">
                <span className="text-lg text-muted-foreground mb-2">R$</span>
                <span className="text-6xl md:text-7xl font-bold text-foreground leading-none">100</span>
                <span className="text-xl text-muted-foreground mb-2">/mês</span>
              </div>

              <Button variant="hero" size="lg" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
                Assinar Plano
              </Button>
              <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Cancele quando quiser • Sem fidelidade
              </p>
            </div>

            {/* Lista de benefícios */}
            <div className="grid sm:grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {MONTHLY_BENEFITS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============ SEÇÃO 2 — PROJETO PERSONALIZADO ============ */}
      <div className="relative py-24 bg-background">
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" aria-hidden />
        <div className="container relative z-10 px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Lista de recursos (primeiro no desktop) */}
            <div className="order-2 lg:order-1 grid sm:grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {CUSTOM_FEATURES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Texto + CTA */}
            <div className="order-1 lg:order-2 animate-fade-in">
              <span className="inline-flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <Sparkles className="h-4 w-4" /> Sob medida
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4 text-balance">
                Projeto <span className="text-gradient">Personalizado</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl text-pretty leading-relaxed">
                Cada empresa possui necessidades únicas. Desenvolvemos um site totalmente
                personalizado para o seu negócio.
              </p>

              <div className="mb-8">
                <span className="text-4xl md:text-5xl font-bold text-gradient leading-none">
                  Valor sob consulta
                </span>
              </div>

              <p className="text-muted-foreground mb-8 max-w-xl text-pretty leading-relaxed">
                Solicite um orçamento e receba uma proposta personalizada, desenvolvida de acordo
                com os objetivos do seu negócio.
              </p>

              <Button variant="whatsapp" size="lg" className="w-full sm:w-auto" asChild>
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Solicitar Orçamento
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CheckoutDialog plan={plan} open={open} onOpenChange={setOpen} />
    </section>
  );
};
