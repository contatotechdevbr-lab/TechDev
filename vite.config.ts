import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Separa dependências grandes em chunks próprios para melhorar o cache do
    // navegador entre deploys e evitar um único bundle gigante.
    rollupOptions: {
      output: {
        // Só isolamos react/roteador (usados em toda a app). recharts NÃO entra
        // aqui de propósito: forçar um chunk manual faria o Vite pré-carregá-lo
        // (modulepreload) na home. Deixando o Vite decidir, ele fica apenas nos
        // chunks das rotas admin (lazy), fora do carregamento inicial.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
}));
