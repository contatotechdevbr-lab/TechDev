import { useEffect } from "react";

type SEOProps = {
  title: string;
  description: string;
  /** Caminho relativo da página, ex: "/termos-de-uso". */
  path: string;
  ogType?: string;
};

const SITE_URL = "https://www.techdev.website";

/** Define/atualiza uma meta tag por name ou property, criando-a se não existir. */
function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Gerencia o <head> de cada página em uma SPA (Vite + React Router):
 * title, meta description, canonical e Open Graph.
 */
export const SEO = ({ title, description, path, ogType = "website" }: SEOProps) => {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    const previousTitle = document.title;

    document.title = title;
    setMeta("name", "description", description);
    setCanonical(url);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, path, ogType]);

  return null;
};
