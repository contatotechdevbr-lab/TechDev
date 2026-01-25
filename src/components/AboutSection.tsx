import { CheckCircle } from "lucide-react";

export const AboutSection = () => {
  return (
    <section id="sobre" className="py-24 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
      
      <div className="container px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Sobre Nós - Left Column */}
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Sobre Nós
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-4 mb-6">
              Somos a <span className="text-gradient">TechDev</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Transformamos pequenos negócios em máquinas de vendas online. Especialistas em criar sites, chatbots e automações que trabalham 24h por dia para o seu negócio.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Nascemos com uma missão clara: levar tecnologia acessível para empreendedores que querem crescer sem complicação.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Entendemos perfeitamente a correria do dia a dia: responder WhatsApp até de madrugada, organizar planilhas manualmente, perder clientes por demora no atendimento ou ter um site que ninguém encontra no Google.
            </p>
          </div>

          {/* Por que Nós - Right Column */}
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Por que Nós
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mt-4 mb-6">
              Por que escolher a <span className="text-gradient">TechDev</span>?
            </h3>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Diferente de agências caras que entregam soluções prontas e te abandonam, nós trabalhamos como parceiros do seu negócio. Cada projeto começa com uma conversa real no WhatsApp, onde entendemos:
            </p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                Seu público-alvo e como eles compram
              </li>
              <li className="flex items-center gap-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                Seus principais gargalos (atendimento lento, planilhas bagunçadas, site que não converte)
              </li>
              <li className="flex items-center gap-3 text-foreground">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                Seu orçamento e prazo disponível
              </li>
            </ul>
            
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Com essas informações, criamos uma solução 100% sob medida:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-foreground">
                <span className="text-primary text-lg">✅</span>
                <div>
                  <span className="font-semibold">Sites que vendem sozinhos</span>
                  <span className="text-muted-foreground"> – rápidos e otimizados</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-foreground">
                <span className="text-primary text-lg">✅</span>
                <div>
                  <span className="font-semibold">Chatbots 24/7</span>
                  <span className="text-muted-foreground"> – qualificam leads e fecham vendas</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-foreground">
                <span className="text-primary text-lg">✅</span>
                <div>
                  <span className="font-semibold">Automações completas</span>
                  <span className="text-muted-foreground"> – WhatsApp, agendas e CRM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
