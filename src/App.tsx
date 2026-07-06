import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
// A home é carregada de forma síncrona (primeira pintura rápida). Todas as demais
// rotas usam lazy loading, então o visitante não baixa admin/dashboard/gráficos
// só para abrir a página inicial.
import Index from "./pages/Index";

const Auth = lazy(() => import("./pages/Auth"));
const ConfirmEmail = lazy(() => import("./pages/ConfirmEmail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MeuSite = lazy(() => import("./pages/MeuSite"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const AdminLayout = lazy(() =>
  import("./components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const Overview = lazy(() => import("./pages/admin/Overview"));
const Customers = lazy(() => import("./pages/admin/Customers"));
const CustomerDetail = lazy(() => import("./pages/admin/CustomerDetail"));
const Plans = lazy(() => import("./pages/admin/Plans"));
const Sites = lazy(() => import("./pages/admin/Sites"));
const Financeiro = lazy(() => import("./pages/admin/Financeiro"));
const Assinaturas = lazy(() => import("./pages/admin/Assinaturas"));
const Projetos = lazy(() => import("./pages/admin/Projetos"));
const ProjetosPersonalizados = lazy(() => import("./pages/admin/ProjetosPersonalizados"));
const Usuarios = lazy(() => import("./pages/admin/Usuarios"));
const Relatorios = lazy(() => import("./pages/admin/Relatorios"));
const Configuracoes = lazy(() => import("./pages/admin/Configuracoes"));
const Perfil = lazy(() => import("./pages/admin/Perfil"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
