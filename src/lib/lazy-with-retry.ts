import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "techdev:chunk-reloaded";

/**
 * Igual ao React.lazy, mas resiliente a falhas de download de chunk.
 *
 * Quando um novo deploy troca os hashes dos arquivos, um usuário que ainda tem
 * a versão antiga da página aberta tenta baixar um chunk que não existe mais
 * (erro 404 / "Failed to fetch dynamically imported module"). Sem tratamento, a
 * tela fica presa no fallback e "a página não abre" até um F5 manual.
 *
 * Aqui, ao detectar essa falha, recarregamos a página automaticamente UMA vez
 * para buscar o index.html e os chunks atualizados. A flag em sessionStorage
 * evita loop de reload caso a falha seja real (ex.: offline).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      window.sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err) {
      const alreadyReloaded = window.sessionStorage.getItem(RELOAD_KEY);
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();
        // Mantém o Suspense suspenso enquanto a página recarrega.
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
