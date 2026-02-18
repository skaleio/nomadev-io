import { Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { NotificationsPanel } from "@/components/NotificationsPanel";

interface DashboardHeaderProps {
  sidebarCollapsed: boolean;
}

export function DashboardHeader({ sidebarCollapsed }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-30 transition-all duration-300 rounded-tl-lg",
      sidebarCollapsed ? "left-16" : "left-64"
    )}>
      <div className="flex items-center h-full px-6">
        {/* Search - Lado Izquierdo */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            title="Buscar"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Logo en el centro - Perfectamente centrado */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-3xl font-black text-emerald-600 hover:text-emerald-700 transition-all duration-300 cursor-pointer tracking-wider uppercase animate-bounce"
            style={{
              fontFamily: "'Orbitron', 'Arial Black', sans-serif",
              fontWeight: 900,
              letterSpacing: '0.15em',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              transform: 'skew(-3deg)',
              display: 'inline-block',
              filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))',
              animation: 'bounce 2s infinite, glow 3s ease-in-out infinite alternate'
            }}
            title="Ir al Dashboard"
          >
            NOMADEV.IO
          </button>
        </div>

        {/* User Actions - Lado Derecho */}
        <div className="flex items-center gap-3 justify-end">
          {/* User Info */}
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">Hola,</span>
            <span className="font-medium">{user?.firstName || 'Usuario'}</span>
          </div>

          {/* Notifications */}
          <NotificationsPanel onNavigate={(url) => navigate(url)} />

          {/* User Profile */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => navigate('/profile')}
            title="Ver Perfil"
          >
            <User className="w-5 h-5" />
          </Button>

          {/* Logout */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            title="Cerrar Sesión"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}