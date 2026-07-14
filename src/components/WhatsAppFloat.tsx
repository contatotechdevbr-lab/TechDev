import { MessageCircle } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/5521980386279?text=Olá!%20Vim%20pelo%20site%20e%20gostaria%20de%20mais%20informações!";

export const WhatsAppFloat = () => {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#25D366] text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group animate-pulse-glow"
      style={{ 
        boxShadow: "0 0 20px rgba(37, 211, 102, 0.4)" 
      }}
    >
      <MessageCircle className="h-6 w-6" />
      <span className="font-semibold hidden sm:inline">Fale Conosco!</span>
    </a>
  );
};
