import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  BarChart3,
  Shield,
  ShoppingBag,
  MessageSquare,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Eye,
  DollarSign,
  Clock,
  Package,
  MessageCircle,
  CheckCircle,
  Truck,
  UserCheck,
  Sparkles,
  Command
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../contexts/AuthContext";
// import { useSimpleCommandPalette } from "../../hooks/useSimpleCommandPalette";
import { supabase } from "../../integrations/supabase/client";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Validador de Clientes", url: "/validation", icon: Shield },
  { title: "CRM", url: "/crm", icon: UserCheck },
  { title: "Gestión de Pedidos", url: "/orders", icon: Package },
  { title: "Shopify Analytics", url: "/shopify", icon: ShoppingBag },
  { title: "Studio IA", url: "/studio-ia", icon: Sparkles },
  { title: "Chat en Vivo", url: "/chat", icon: MessageSquare },
  { title: "Validación Pedidos", url: "/order-validation", icon: CheckCircle },
  { title: "Seguimiento", url: "/tracking", icon: Truck },
  { title: "Gestor de Leads", url: "/leads", icon: Users },
  { title: "Configuración", url: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  // const { openCommandPalette } = useSimpleCommandPalette();
  const [metrics, setMetrics] = useState({
    visitors: 0,
    sales: 0,
    sessions: 0,
    orders: 0
  });
  const [hasShopifyConnection, setHasShopifyConnection] = useState(false);

  const isActive = (path: string) => {
    return currentPath === path;
  };

  // Verificar si hay conexión de Shopify
  useEffect(() => {
    async function checkShopifyConnection() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        setHasShopifyConnection(!!data && !error);
      } catch (error) {
        setHasShopifyConnection(false);
      }
    }

    checkShopifyConnection();
  }, [user]);

  // Solo simular métricas si hay conexión de Shopify
  useEffect(() => {
    if (!hasShopifyConnection) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        visitors: Math.floor(Math.random() * 50) + 1,
        sales: Math.floor(Math.random() * 10000) + 1000,
        sessions: Math.floor(Math.random() * 200) + 10,
        orders: Math.floor(Math.random() * 100) + 5
      }));
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }, [hasShopifyConnection]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center border-b border-sidebar-border", collapsed ? "justify-center p-2" : "justify-between p-4")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                {(() => {
                  const firstName = user?.firstName?.split(' ')[0] || '';
                  const lastName = user?.lastName?.split(' ')[0] || '';
                  if (firstName && lastName) {
                    return `${firstName} ${lastName}`;
                  } else if (firstName) {
                    return firstName;
                  } else if (user?.email) {
                    return user.email.split('@')[0];
                  }
                  return 'Usuario';
                })()}
              </h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>
        )}
        
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn("space-y-1", collapsed ? "p-2" : "p-4")}>
        {navigationItems.map((item) => {
          const active = isActive(item.url);
          
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                "hover:bg-sidebar-accent",
                active 
                  ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm" 
                  : "text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors flex-shrink-0",
                active ? "text-primary" : "text-sidebar-foreground group-hover:text-primary"
              )} />
              
              {!collapsed && (
                <span className={cn(
                  "font-medium transition-colors",
                  active ? "text-primary" : "text-sidebar-foreground group-hover:text-primary"
                )}>
                  {item.title}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Métricas en Tiempo Real - Solo mostrar si hay conexión de Shopify */}
      {!collapsed && hasShopifyConnection && (
        <div className="p-4">
          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Métricas en Vivo</span>
            </div>
            
            <div className="space-y-3">
              {/* Visitantes */}
              <div className="flex items-center justify-between py-2 px-3 bg-white/60 dark:bg-white/5 rounded-lg backdrop-blur-sm border border-white/20 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Visitantes</span>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{metrics.visitors}</span>
              </div>

              {/* Ventas */}
              <div className="flex items-center justify-between py-2 px-3 bg-white/60 dark:bg-white/5 rounded-lg backdrop-blur-sm border border-white/20 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Ventas</span>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">${metrics.sales.toLocaleString()}</span>
              </div>

              {/* Sesiones */}
              <div className="flex items-center justify-between py-2 px-3 bg-white/60 dark:bg-white/5 rounded-lg backdrop-blur-sm border border-white/20 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Sesiones</span>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{metrics.sessions}</span>
              </div>

              {/* Pedidos */}
              <div className="flex items-center justify-between py-2 px-3 bg-white/60 dark:bg-white/5 rounded-lg backdrop-blur-sm border border-white/20 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <Package className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Pedidos</span>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{metrics.orders}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </aside>
  );
}