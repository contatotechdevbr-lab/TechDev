import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preloadMercadoPago, isMercadoPagoConfigured } from "./lib/mercadopago";

// Inicializa o SDK oficial MercadoPago.js V2 logo no carregamento da aplicação.
// Isso executa `new MercadoPago(publicKey)` em toda visita, registrando o uso
// do SDK junto ao Mercado Pago (necessário para o requisito "SDK do frontend").
if (isMercadoPagoConfigured()) {
  void preloadMercadoPago();
}

createRoot(document.getElementById("root")!).render(<App />);
