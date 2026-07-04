import { Button } from "@/components/ui/button";
import { LogoText } from "@/components/Logo";
import { MessageCircle, Sparkles, ArrowDown, Headphones, Layers, Globe } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/5521980386279?text=Olá!%20Vim%20pelo%20site%20e%20gostaria%20de%20mais%20informações!";

const highlights = [
  { icon: Headphones, value: "24/7", label: "Suporte dedicado" },
  { icon: Layers, value: "100%", label: "Sob medida" },
  { icon: Globe, value: "Web", label: "Sites & automações" },
];

export const HeroSection = () => {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid" aria-hidden />
      <div
        className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
        aria-hidden
      />
      <div
        className="absolute bottom-0 right-[10%] h-72 w-72 rounded-full bg-accent/15 blur-[100px]"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background"
        aria-hidden
      />

      <div className="container relative z-10 px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-10 inline-flex animate-fade-in items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 backdrop-blur">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-subtle-foreground">
              Transforme sua ideia em realidade digital
            </span>
          </div>

          {/* Logo */}
          <div className="mb-8 animate-float">
            <LogoText />
          </div>

          {/* Headline */}
          <h1
            className="mb-6 animate-fade-in text-balance text-4xl font-extrabold leading-[1.1] text-foreground md:text-5xl lg:text-6xl"
            style={{ animationDelay: "0.15s" }}
          >
            A solução para <span className="text-gradient">turbinar suas vendas</span>
          </h1>

          <p
            className="mx-auto mb-10 max-w-2xl animate-fade-in text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl"
            style={{ animationDelay: "0.3s" }}
          >
            Melhoramos seu atendimento para você ganhar tempo, vender mais e atender melhor
            seus clientes.
          </p>

          {/* CTAs */}
          <div
            className="flex animate-fade-in flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "0.45s" }}
          >
            <Button variant="hero" size="lg" asChild>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Fale Conosco
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#servicos">
                Ver serviços
                <ArrowDown className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Trust highlights */}
          <div
            className="mx-auto mt-16 grid max-w-2xl animate-fade-in grid-cols-1 gap-4 sm:grid-cols-3"
            style={{ animationDelay: "0.6s" }}
          >
            {highlights.map((item) => (
              <div
                key={item.label}
                className="card-sheen flex items-center justify-center gap-3 rounded-2xl border border-border/70 bg-card/50 px-4 py-4 backdrop-blur"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <div className="text-left">
                  <div className="text-xl font-bold text-foreground">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
