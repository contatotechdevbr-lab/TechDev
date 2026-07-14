import type { ReactNode, MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";

interface LogoLinkProps {
  /** Tamanho do logo padrão (ignorado quando `children` é passado). */
  size?: "sm" | "md" | "lg" | "xl";
  /** Classes extras aplicadas ao link. */
  className?: string;
  /** Conteúdo customizado (ex.: marca do painel admin). Se ausente, usa <Logo />. */
  children?: ReactNode;
  /** Callback extra ao clicar (ex.: fechar menu mobile). */
  onClick?: () => void;
}

/**
 * Logo clicável e consistente em todas as páginas.
 * - Na landing page ("/"): rola suavemente até o topo.
 * - Em qualquer outra página: navega para "/".
 * Toda a área (ícone + texto + espaçamento) é um único link com hover suave.
 */
export const LogoLink = ({ size = "sm", className = "", children, onClick }: LogoLinkProps) => {
  const { pathname } = useLocation();

  const handleClick = (e: MouseEvent) => {
    onClick?.();
    if (pathname === "/") {
      // Já estamos na home: evita recarregar a rota e apenas sobe ao topo.
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.replaceState(null, "", "/");
    }
    // Em outras páginas, deixa o <Link> navegar normalmente para "/".
  };

  return (
    <Link
      to="/"
      onClick={handleClick}
      aria-label="TechDev — Ir para a página inicial"
      className={`inline-flex items-center gap-2 cursor-pointer rounded-md outline-none transition duration-200 ease-out hover:scale-105 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/50 ${className}`}
    >
      {children ?? <Logo size={size} />}
    </Link>
  );
};

export default LogoLink;
