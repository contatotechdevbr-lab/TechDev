import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Zap } from "lucide-react";
import { CheckoutDialog, type CheckoutPlan } from "@/components/CheckoutDialog";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  features: string[];
  is_popular: boolean;
  interval: string;
  max_installments: number;
};

export const PricingSection = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<CheckoutPlan | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("plans")
      .select("id, name, description, price_cents, features, is_popular, interval, max_installments")
      .eq("active", true)
      .order("price_cents", { ascending: true })
      .then(({ data }) => setPlans(data ?? []));
  }, []);

  const openCheckout = (p: Plan) => {
    setSelected({ id: p.id, name: p.name, price_cents: p.price_cents, features: p.features, max_installments: p.max_installments });
    setOpen(true);
  };

  const fmt = (c: number) => (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return (
    <section id="planos" className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Planos</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4">
            Escolha o ideal para <span className="text-gradient">você</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Assinatura mensal recorrente. Cancele quando quiser.
          </p>
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center mb-12 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm">
            <Zap className="h-4 w-4" /> Comece hoje, primeira cobrança no ato
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((p) => (
            <Card
              key={p.id}
              className={`relative bg-card transition-all hover:shadow-xl ${
                p.is_popular ? "border-primary scale-105 shadow-lg" : "border-border hover:border-primary/50"
              }`}
            >
              {p.is_popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    <Star className="h-4 w-4" /> Mais Popular
                  </div>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl">{p.name}</CardTitle>
                <CardDescription>{p.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-5xl font-bold">{fmt(p.price_cents)}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={p.is_popular ? "hero" : "outline"} size="lg" className="w-full" asChild>
                  <Link to={`/auth?plan=${p.id}`}>Assinar agora</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-12">
          ✅ Cancele a qualquer momento ✅ Suporte incluído ✅ Pagamento seguro
        </p>
      </div>
    </section>
  );
};
