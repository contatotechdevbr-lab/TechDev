import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Controla a rolagem a cada mudança de rota:
 * - Sem hash: rola para o topo (ex.: ao abrir as páginas legais).
 * - Com hash (ex.: /#servicos): rola suavemente até a seção correspondente,
 *   aguardando a renderização da página de destino.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      // Aguarda a montagem da página de destino antes de rolar até a seção.
      const timeout = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 80);
      return () => window.clearTimeout(timeout);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};
