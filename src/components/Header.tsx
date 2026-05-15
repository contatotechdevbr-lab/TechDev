import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, LayoutDashboard, LogIn } from "lucide-react";

const navLinks = [
  { name: "Início", href: "#inicio" },
  { name: "Serviços", href: "#servicos" },
  { name: "Planos", href: "#planos" },
  { name: "Sobre", href: "#sobre" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo size="sm" />

          <nav className="hidden md:flex items-center justify-center flex-1 gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-primary hover:text-primary/80 transition-colors duration-300 text-sm font-semibold"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Button variant="hero" size="sm" asChild>
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-1" />Painel</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth"><LogIn className="h-4 w-4 mr-1" />Entrar</Link>
              </Button>
            )}
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Button variant="hero" className="mt-2" asChild>
                <Link to={user ? "/dashboard" : "/auth"}>{user ? "Painel" : "Entrar"}</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
