import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Rola a janela para o topo sempre que a rota (pathname) muda.
 * Ignora mudanças de hash para não atrapalhar as âncoras internas da home
 * (ex.: #planos, #servicos), que continuam com rolagem suave própria.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};
