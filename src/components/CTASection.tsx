import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, Shield, Headphones } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/5500000000000?text=Olá!%20Quero%20começar%20meu%20projeto%20agora!";

const benefits = [
  { icon: Clock, text: "Resposta em até 5 minutos" },
  { icon: Shield, text: "Orçamento sem compromisso" },
  { icon: Headphones, text: "Atendimento personalizado" },
];

export const CTASection = () => {
  return (
    <section id="contato" className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Urgency Message */}
          <div className="inline-block bg-destructive/20 text-destructive border border-destructive/30 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-pulse">
            ⏰ Vagas limitadas! Garanta seu projeto ainda esta semana!
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Pronto para <span className="text-gradient">Transformar</span><br />
            seu Negócio?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Não deixe para depois! Sua concorrência já está online. 
            Entre em contato agora e receba uma proposta personalizada em minutos.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {benefits.map((benefit) => (
              <div key={benefit.text} className="flex items-center gap-2 text-foreground">
                <benefit.icon className="h-5 w-5 text-primary" />
                <span className="text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button variant="whatsapp" size="xl" className="text-lg px-12" asChild>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-6 w-6" />
              Falar com Especialista Agora
            </a>
          </Button>

          <p className="mt-6 text-sm text-muted-foreground">
            💬 Atendimento via WhatsApp • Resposta imediata
          </p>
        </div>
      </div>
    </section>
  );
};
