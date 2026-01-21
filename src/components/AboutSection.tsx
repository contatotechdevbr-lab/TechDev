import { CheckCircle } from "lucide-react";

export const AboutSection = () => {
  return (
    <section id="sobre" className="py-24 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Sobre nós
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            Sobre a <span className="text-gradient">TechDev</span>
          </h2>
          
          <p className="text-xl text-subtle-foreground mb-6 leading-relaxed">
            Transformamos pequenos negócios em máquinas de vendas online.
          </p>
          
          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            Somos a TechDev – especialistas em criar sites, chatbots e automações que trabalham 24h por dia para o seu negócio.
          </p>
          
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            Nascemos com uma missão clara: levar tecnologia acessível para empreendedores que querem crescer sem complicação.
          </p>

          {/* Por que escolher */}
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Por que escolher a <span className="text-gradient">TechDev</span>?
          </h3>
          
          <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
            Diferente de agências caras que entregam soluções prontas e te abandonam, nós trabalhamos como parceiros do seu negócio. Cada projeto começa com uma conversa real no WhatsApp, onde entendemos:
          </p>
          
          <ul className="space-y-3 mb-10 text-left max-w-2xl mx-auto">
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
          
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Com essas informações, criamos uma solução 100% sob medida que resolve seus problemas imediatamente:
          </p>
          
          {/* Soluções */}
          <div className="space-y-4 text-left max-w-2xl mx-auto">
            <div className="flex items-start gap-3 text-foreground">
              <span className="text-primary text-xl">✅</span>
              <div>
                <span className="font-semibold">Sites que vendem sozinhos</span>
                <span className="text-muted-foreground"> – rápidos, bonitos e otimizados para captar orçamentos</span>
              </div>
            </div>
            <div className="flex items-start gap-3 text-foreground">
              <span className="text-primary text-xl">✅</span>
              <div>
                <span className="font-semibold">Chatbots que atendem 24/7</span>
                <span className="text-muted-foreground"> – respondem dúvidas, qualificam leads e fecham vendas</span>
              </div>
            </div>
            <div className="flex items-start gap-3 text-foreground">
              <span className="text-primary text-xl">✅</span>
              <div>
                <span className="font-semibold">Automações que organizam tudo</span>
                <span className="text-muted-foreground"> – conectam WhatsApp, agendas, planilhas e CRM automaticamente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
