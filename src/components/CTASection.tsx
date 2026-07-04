import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, Shield, Headphones } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/5521980386279?text=Olá!%20Quero%20começar%20meu%20projeto%20agora!";

const benefits = [
  { icon: Clock, text: "Resposta em até 5 minutos" },
  { icon: Shield, text: "Orçamento sem compromisso" },
  { icon: Headphones, text: "Atendimento personalizado" },
];

export const CTASection = () => {
  return (
    <section id="contato" className="py-24">
      <div className="container px-4">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-primary/25 bg-card/70 px-6 py-16 text-center backdrop-blur md:px-16">
          {/* Glow accents */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-accent/12" aria-hidden />
          <div
            className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-[110px]"
            aria-hidden
          />
          <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />

          <div className="relative z-10">
            <h2 className="mb-6 text-balance text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Pronto para <span className="text-gradient">transformar</span> seu negócio?
            </h2>

            <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
              Não deixe para depois! Entre em contato agora e receba um{" "}
              <span className="font-semibold text-primary">orçamento gratuito</span> em minutos.
            </p>

            <div className="mb-10 flex flex-wrap justify-center gap-x-8 gap-y-3">
              {benefits.map((benefit) => (
                <div key={benefit.text} className="flex items-center gap-2 text-subtle-foreground">
                  <benefit.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>

            <Button variant="whatsapp" size="xl" className="px-12 text-lg" asChild>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-6 w-6" />
                Falar com Especialista Agora
              </a>
            </Button>

            <p className="mt-6 text-sm text-muted-foreground">
              Atendimento via WhatsApp • Resposta imediata
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
