import { Button } from "@/components/ui/button";
import { CheckCircle, MessageCircle, Code2, Users, Trophy } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/5500000000000?text=Olá!%20Gostaria%20de%20conhecer%20mais%20sobre%20a%20TechDev!";

const highlights = [
  "Equipe especializada em desenvolvimento web",
  "Projetos entregues no prazo",
  "Suporte técnico dedicado",
  "Tecnologias modernas e atualizadas",
  "Foco total na experiência do cliente",
];

const stats = [
  { icon: Code2, value: "500+", label: "Projetos" },
  { icon: Users, value: "100+", label: "Clientes" },
  { icon: Trophy, value: "5", label: "Anos" },
];

export const AboutSection = () => {
  return (
    <section id="sobre" className="py-24 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
      
      <div className="container px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Sobre nós
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
              Somos a <span className="text-gradient">TechDev</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Nascemos com a missão de transformar ideias em soluções digitais de alto impacto. 
              Nossa equipe é formada por profissionais apaixonados por tecnologia, 
              prontos para criar o site perfeito para o seu negócio.
            </p>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Acreditamos que cada empresa merece uma presença digital única e profissional. 
              Por isso, trabalhamos lado a lado com nossos clientes para entregar 
              resultados que superam expectativas.
            </p>

            {/* Highlights */}
            <ul className="space-y-3 mb-8">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <Button variant="whatsapp" size="lg" asChild>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Conheça Nossa Equipe
              </a>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
