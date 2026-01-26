import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, MessageCircle, Zap } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/5521987850455?text=Olá!%20Tenho%20interesse%20no%20plano%20";

const plans = [
  {
    name: "Básico",
    description: "Ideal para quem está começando",
    price: "997",
    period: "único",
    features: [
      "Site de até 5 páginas",
      "Design responsivo",
      "Formulário de contato",
      "SEO básico",
      "Hospedagem por 1 ano",
      "Suporte por 30 dias",
    ],
    popular: false,
  },
  {
    name: "Profissional",
    description: "Para empresas que querem crescer",
    price: "1.997",
    period: "único",
    features: [
      "Site de até 10 páginas",
      "Design exclusivo",
      "Chatbot básico",
      "SEO avançado",
      "Hospedagem por 1 ano",
      "Integração com redes sociais",
      "Suporte por 90 dias",
      "Painel administrativo",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Solução completa para seu negócio",
    price: "3.997",
    period: "único",
    features: [
      "Páginas ilimitadas",
      "Design premium",
      "Chatbot avançado com IA",
      "SEO completo",
      "Hospedagem por 2 anos",
      "E-commerce integrado",
      "Suporte prioritário 6 meses",
      "Treinamento da equipe",
      "Relatórios mensais",
    ],
    popular: false,
  },
];

export const PricingSection = () => {
  return (
    <section id="planos" className="py-24 bg-secondary/30">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Investimento
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            Escolha seu <span className="text-gradient">Plano</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Investimento único, resultado permanente. Escolha o plano ideal para seu negócio.
          </p>
        </div>

        {/* Urgency Banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center mb-12 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-primary font-semibold">
            <Zap className="h-5 w-5" />
            🔥 OFERTA LIMITADA: 20% OFF nos próximos 5 projetos!
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl ${
                plan.popular ? "border-primary scale-105 shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    <Star className="h-4 w-4" />
                    Mais Popular
                  </div>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl text-foreground">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>
                <div className="pt-4">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-foreground">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.popular ? "hero" : "outline"} 
                  size="lg" 
                  className="w-full"
                  asChild
                >
                  <a 
                    href={`${WHATSAPP_LINK}${plan.name}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Quero Este Plano
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Precisa de algo personalizado? <span className="text-primary font-semibold">Fale conosco!</span>
          </p>
          <p className="text-sm text-muted-foreground">
            ✅ Parcelamos em até 12x | ✅ Pagamento via PIX com desconto
          </p>
        </div>
      </div>
    </section>
  );
};
