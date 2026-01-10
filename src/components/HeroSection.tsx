import { Button } from "@/components/ui/button";
import { LogoText } from "@/components/Logo";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/5500000000000?text=Olá!%20Vim%20pelo%20site%20e%20gostaria%20de%20mais%20informações!";

export const HeroSection = () => {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center bg-grid overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container relative z-10 px-4 pt-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-primary/30 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Transforme sua ideia em realidade digital
            </span>
          </div>

          {/* Logo Title */}
          <div className="mb-8 animate-float">
            <LogoText />
          </div>

          {/* Subtitle */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            A solução para <span className="text-gradient">turbinar suas vendas</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
            Sua empresa merece o melhor. Transformamos suas ideias em soluções que multiplicam suas vendas e tudo de forma automática!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <Button variant="hero" size="xl" asChild>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Quero Meu Site Agora!
              </a>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#servicos">
                Ver Serviços
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-muted-foreground animate-fade-in" style={{ animationDelay: "0.8s" }}>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-primary">100+</span>
              <span className="text-sm">Clientes<br />Satisfeitos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-primary">24/7</span>
              <span className="text-sm">Suporte<br />Dedicado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-primary">5★</span>
              <span className="text-sm">Avaliação<br />Média</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
