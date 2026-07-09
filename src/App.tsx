import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
// A home é carregada de forma síncrona (primeira pintura rápida). Todas as demais
// rotas usam lazy loading resiliente (recarrega sozinho se um chunk ficar
// desatualizado após um deploy), então o visitante não baixa admin/dashboard/
// gráficos só para abrir a página inicial, e nenhuma página "trava" sem F5.
import Index from "./pages/Index";

const Auth = lazyWithRetry(() => import("./pages/Auth"));
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const ConfirmEmail = lazyWithRetry(() => import("./pages/ConfirmEmail"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const MeuSite = lazyWithRetry(() => import("./pages/MeuSite"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazyWithRetry(() => import("./pages/TermsOfUse"));
const AdminLayout = lazyWithRetry(() =>
  import("./components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const Overview = lazyWithRetry(() => import("./pages/admin/Overview"));
const Customers = lazyWithRetry(() => import("./pages/admin/Customers"));
const CustomerDetail = lazyWithRetry(() => import("./pages/admin/CustomerDetail"));
const Plans = lazyWithRetry(() => import("./pages/admin/Plans"));
const Sites = lazyWithRetry(() => import("./pages/admin/Sites"));
const Financeiro = lazyWithRetry(() => import("./pages/admin/Financeiro"));
const Assinaturas = lazyWithRetry(() => import("./pages/admin/Assinaturas"));
const Projetos = lazyWithRetry(() => import("./pages/admin/Projetos"));
const ProjetosPersonalizados = lazyWithRetry(() => import("./pages/admin/ProjetosPersonalizados"));
const Usuarios = lazyWithRetry(() => import("./pages/admin/Usuarios"));
const Relatorios = lazyWithRetry(() => import("./pages/admin/Relatorios"));
const Configuracoes = lazyWithRetry(() => import("./pages/admin/Configuracoes"));
const Perfil = lazyWithRetry(() => import("./pages/admin/Perfil"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/esqueci-senha" element={<ForgotPassword />} />
              <Route path="/redefinir-senha" element={<ResetPassword />} />
              <Route path="/confirmar-email" element={<ConfirmEmail />} />
              <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos-de-uso" element={<TermsOfUse />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/meu-site" element={<ProtectedRoute><MeuSite /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Overview />} />
                <Route path="clientes" element={<Customers />} />
                <Route path="clientes/:id" element={<CustomerDetail />} />
                <Route path="planos" element={<Plans />} />
                <Route path="sites" element={<Sites />} />
                <Route path="assinaturas" element={<Assinaturas />} />
                <Route path="projetos" element={<Projetos />} />
                <Route path="projetos-personalizados" element={<ProjetosPersonalizados />} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="usuarios" element={<Usuarios />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route path="perfil" element={<Perfil />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
