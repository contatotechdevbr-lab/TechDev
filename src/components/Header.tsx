import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogoLink } from "@/components/LogoLink";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, LayoutDashboard, LogIn, Globe } from "lucide-react";

const navLinks = [
  { name: "Início", hash: "#inicio" },
  { name: "Serviços", hash: "#servicos" },
  { name: "Assinaturas", hash: "#planos" },
  { name: "Sobre", hash: "#sobre" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  // Na home, faz rolagem suave até a seção. Em outras páginas (ex.: legais),
  // deixa o Link navegar para "/#secao" e o ScrollToTop cuida da rolagem.
  const handleNavClick = (e: React.MouseEvent, hash: string) => {
    setIsMenuOpen(false);
    if (isHome) {
      e.preventDefault();
      const id = hash.replace("#", "");
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", hash);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:pt-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-2.5 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)] backdrop-blur-xl sm:px-5">
          <LogoLink size="sm" />

          <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/50 bg-secondary/40 px-2 py-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={`/${link.hash}`}
                onClick={(e) => handleNavClick(e, link.hash)}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:bg-primary/10 hover:text-foreground"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/meu-site"><Globe className="h-4 w-4 mr-1" />Meu Site</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-1" />Painel</Link>
                </Button>
              </>
            ) : (
              <Button variant="hero" size="sm" asChild>
                <Link to="/auth"><LogIn className="h-4 w-4 mr-1" />Entrar</Link>
              </Button>
            )}
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-2 rounded-2xl border border-border/60 bg-background/90 p-4 shadow-lg backdrop-blur-xl animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={`/${link.hash}`}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                  onClick={(e) => handleNavClick(e, link.hash)}
                >
                  {link.name}
                </Link>
              ))}
              {user && (
                <Button variant="outline" className="mt-2" asChild>
                  <Link to="/meu-site" onClick={() => setIsMenuOpen(false)}>
                    <Globe className="h-4 w-4 mr-1" />Meu Site
                  </Link>
                </Button>
              )}
              <Button variant="hero" className="mt-2" asChild>
                <Link to={user ? "/dashboard" : "/auth"} onClick={() => setIsMenuOpen(false)}>
                  {user ? "Painel" : "Entrar"}
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
