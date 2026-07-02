import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, ListTree } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import type { LegalDocument } from "@/config/legal";

type Props = { doc: LegalDocument };

export const LegalPageLayout = ({ doc }: Props) => {
  const [activeId, setActiveId] = useState<string>(doc.sections[0]?.id ?? "");

  // Destaca no índice a seção visível durante a rolagem.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    doc.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [doc.sections]);

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
      history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      <SEO title={doc.seo.title} description={doc.seo.description} path={doc.seo.path} />
      <Header />

      <main className="container mx-auto px-4 pt-28 pb-20">
        <div className="mx-auto max-w-5xl">
          {/* Voltar */}
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>

          {/* Cabeçalho do documento */}
          <header className="mb-10 border-b border-border pb-8">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              <span className="text-gradient">{doc.title}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              {doc.intro}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Última atualização: {doc.lastUpdated}
              </span>
              <span className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs">
                Versão {doc.version}
              </span>
            </div>
          </header>

          <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
            {/* Índice */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <nav aria-label="Índice do documento" className="rounded-xl border border-border bg-card/50 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ListTree className="h-4 w-4 text-primary" />
                  Índice
                </p>
                <ul className="space-y-1">
                  {doc.sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        onClick={(e) => handleTocClick(e, s.id)}
                        className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                          activeId === s.id
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Conteúdo */}
            <article className="max-w-2xl">
              {doc.sections.map((s) => (
                <section key={s.id} id={s.id} className="mb-10 scroll-mt-24">
                  <h2 className="mb-4 text-2xl font-semibold text-foreground">{s.title}</h2>
                  {s.paragraphs.map((p, i) => (
                    <p key={i} className="mb-4 leading-relaxed text-subtle-foreground">
                      {p}
                    </p>
                  ))}
                  {s.list && (
                    <ul className="mb-4 list-disc space-y-2 pl-6 text-subtle-foreground marker:text-primary">
                      {s.list.map((item, i) => (
                        <li key={i} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
