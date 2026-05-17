import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, LayoutDashboard, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const navItem = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
  );

export const AdminLayout = () => {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <h1 className="text-xl font-bold">Painel CEO</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <div className="container py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="space-y-1">
          <NavLink to="/admin" end className={navItem}>
            <LayoutDashboard className="h-4 w-4" /> Visão geral
          </NavLink>
          <NavLink to="/admin/clientes" className={navItem}>
            <Users className="h-4 w-4" /> Clientes
          </NavLink>
          <NavLink to="/admin/planos" className={navItem}>
            <Package className="h-4 w-4" /> Planos
          </NavLink>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
