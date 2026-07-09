import { Globe, Bot, Rocket, Check } from "lucide-react";

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
    <section id="servicos" className="relative overflow-hidden py-24">
      <div
        className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-primary/10 blur-[110px]"
        aria-hidden
      />
      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            O que fazemos
          </p>
          <h2 className="mb-5 text-balance text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Nossos <span className="text-gradient">Serviços</span>
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Soluções para impulsionar de vez o seu negócio.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={service.title}
              className="card-sheen group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-8 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50"
            >
              <span
                className="pointer-events-none absolute right-6 top-4 text-6xl font-black text-primary/5 transition-colors group-hover:text-primary/10"
                aria-hidden
              >
                0{index + 1}
              </span>

              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_28px_-4px_hsl(var(--primary)/0.7)]">
                <service.icon className="h-7 w-7" />
              </div>

              <h3 className="mb-2 text-xl font-bold text-foreground">{service.title}</h3>
              <p className="mb-6 text-muted-foreground">{service.description}</p>

              <ul className="mt-auto space-y-2.5 border-t border-border/60 pt-5">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-subtle-foreground">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-12 text-center text-muted-foreground">
          Não perca tempo!{" "}
          <span className="font-semibold text-primary">Garanta seu projeto agora.</span>
        </p>
      </div>
    </section>
  );
};
