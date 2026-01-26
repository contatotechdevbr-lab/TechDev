import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Bot, Rocket, MessageCircle } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/5521987850455?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20serviços!";

const services = [
  {
    icon: Globe,
    title: "Sites Profissionais",
    description: "Sites modernos e otimizados para converter visitantes em clientes.",
    features: ["Design exclusivo", "SEO otimizado", "Alta velocidade"],
  },
  {
    icon: Bot,
    title: "Chatbots Inteligentes",
    description: "Automatize seu atendimento e venda 24 horas por dia, 7 dias por semana.",
    features: ["Atendimento 24/7", "Integração WhatsApp", "Respostas inteligentes"],
  },
  {
    icon: Rocket,
    title: "Landing Pages",
    description: "Páginas focadas em atrair clientes para suas campanhas.",
    features: ["Alta conversão", "A/B Testing", "Carregamento rápido"],
  },
];

export const ServicesSection = () => {
  return (
    <section id="servicos" className="py-24 bg-secondary/30">
      <div className="container px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Nossos <span className="text-gradient">Serviços</span>
          </h2>
          <p className="text-xl md:text-2xl text-subtle-foreground font-medium max-w-2xl mx-auto">
            Soluções para impulsionar <span className="text-gradient">de vez</span> o seu negócio!
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => (
            <Card 
              key={service.title} 
              className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl text-foreground">{service.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            🚀 Não perca tempo! <span className="text-primary font-semibold">Garanta seu projeto agora!</span>
          </p>
        </div>
      </div>
    </section>
  );
};
