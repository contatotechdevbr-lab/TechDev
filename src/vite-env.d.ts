/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Chave pública do Mercado Pago (credencial de teste/produção). Segura para uso no frontend. */
  readonly VITE_MERCADO_PAGO_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
