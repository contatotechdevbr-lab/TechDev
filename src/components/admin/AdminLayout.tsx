import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Globe,
  Package,
  CreditCard,
  RefreshCw,
  FolderKanban,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Menu,
  Home,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsMenu } from "./NotificationsMenu";

const groups = [
  {
    label: "Principal",
    items: [{ to: "/admin", end: true, icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "Gestão",
    items: [
      { to: "/admin/clientes", icon: Users, label: "Clientes" },
      { to: "/admin/sites", icon: Globe, label: "Sites ativos" },
      { to: "/admin/planos", icon: Package, label: "Planos" },
      { to: "/admin/assinaturas", icon: RefreshCw, label: "Assinaturas" },
      { to: "/admin/projetos", icon: FolderKanban, label: "Projetos" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { to: "/admin/financeiro", icon: CreditCard, label: "Financeiro" },
      { to: "/admin/relatorios", icon: BarChart3, label: "Relatórios" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/admin/usuarios", icon: UserCog, label: "Usuários" },
      { to: "/admin/configuracoes", icon: Settings, label: "Configurações" },
    ],
  },
];

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
  );

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
  <div className="flex h-full flex-col">
    <div className="flex h-16 items-center gap-2 border-b border-border px-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
        <span className="font-logo text-lg font-bold text-primary">T</span>
      </div>
      <div className="leading-tight">
        <p className="font-logo text-sm font-bold tracking-wide">TechDev</p>
        <p className="text-[11px] text-muted-foreground">Painel CEO</p>
      </div>
    </div>

    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {group.label}
          </p>
          {group.items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navItemClass} onClick={onNavigate}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>

    <div className="border-t border-border p-3">
      <Link
        to="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Home className="h-4 w-4" />
        Voltar ao site
      </Link>
    </div>
  </div>
);

export const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const initials =
    user?.email?.slice(0, 2).toUpperCase() ?? "CE";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Conteúdo */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <GlobalSearch />
          </div>

          <NotificationsMenu />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">CEO TechDev</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email ?? "ceo@techdev.com"}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/perfil">
                  <User className="mr-2 h-4 w-4" /> Meu perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/configuracoes">
                  <Settings className="mr-2 h-4 w-4" /> Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main key={location.pathname} className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
