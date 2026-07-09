import { CheckCircle2, Globe, Bot, Workflow } from "lucide-react";

const reasons = [
  "Seu público-alvo e como eles compram",
  "Seus principais gargalos (atendimento lento, planilhas bagunçadas, site que não converte)",
  "Seu orçamento e prazo disponível",
];

const solutions = [
  {
    icon: Globe,
    title: "Sites que vendem sozinhos",
    description: "Rápidos, otimizados e prontos para converter.",
  },
  {
    icon: Bot,
    title: "Chatbots 24/7",
    description: "Qualificam leads e fecham vendas a qualquer hora.",
  },
  {
    icon: Workflow,
    title: "Automações completas",
    description: "WhatsApp, agendas e CRM trabalhando por você.",
  },
];

export const AboutSection = () => {
  return (
    <section id="sobre" className="relative overflow-hidden py-24">
      <div
        className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-primary/5 to-transparent"
        aria-hidden
      />

      <div className="container relative z-10 px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Sobre Nós */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Sobre Nós
            </span>
            <h2 className="mb-6 mt-4 text-3xl font-bold text-foreground md:text-4xl">
              Somos a <span className="text-gradient">TechDev</span>
            </h2>
            <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                Transformamos pequenos negócios em máquinas de vendas online. Especialistas
                em criar sites, chatbots e automações que trabalham 24h por dia para o seu
                negócio.
              </p>
              <p>
                Nascemos com uma missão clara: levar tecnologia acessível para empreendedores
                que querem crescer sem complicação.
              </p>
              <p>
                Entendemos a correria do dia a dia: responder WhatsApp de madrugada, organizar
                planilhas manualmente, perder clientes por demora no atendimento ou ter um site
                que ninguém encontra no Google.
              </p>
            </div>
          </div>

          {/* Por que Nós */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Por que Nós
            </span>
            <h3 className="mb-6 mt-4 text-3xl font-bold text-foreground md:text-4xl">
              Por que escolher a <span className="text-gradient">TechDev</span>?
            </h3>
            <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
              Diferente de agências caras que entregam soluções prontas e te abandonam, nós
              trabalhamos como parceiros do seu negócio. Cada projeto começa com uma conversa
              real no WhatsApp, onde entendemos:
            </p>

            <ul className="mb-8 space-y-3">
              {reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-3 text-subtle-foreground">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>

            <p className="mb-5 text-lg font-medium text-foreground">
              Com essas informações, criamos uma solução 100% sob medida:
            </p>

            <div className="grid gap-3">
              {solutions.map((solution) => (
                <div
                  key={solution.title}
                  className="card-sheen flex items-start gap-4 rounded-xl border border-border/70 bg-card/60 p-4 backdrop-blur transition-colors hover:border-primary/50"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <solution.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{solution.title}</p>
                    <p className="text-sm text-muted-foreground">{solution.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
