import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Shield,
  ShoppingBag,
  MessageSquare,
  Users,
  Settings,
  Activity,
  Eye,
  DollarSign,
  Package,
  CheckCircle,
  Truck,
  Box,
  UserCheck,
  Sparkles,
  LogOut,
  User,
  Bell,
  Search,
  MoreHorizontal,
  CreditCard,
  Keyboard,
  UserPlus,
  Plus,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../integrations/supabase/client";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationBanner } from "../ui/notification-banner";
import { ConsolidatedNotification } from "../ui/consolidated-notification";
import { SimpleNotification } from "../ui/simple-notification";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "../ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { isGloballyLockedPath } from "@/lib/lockedNavPaths";
import { CommandPalette, useCommandPalette } from "../CommandPalette";

type NavItem = {
  title: string;
  url: string;
  icon: typeof BarChart3;
  locked?: boolean;
  comingSoonNote?: string;
};

const navigationItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Gestión de Pedidos", url: "/orders", icon: Package },
  { title: "CRM", url: "/crm", icon: UserCheck },
  { title: "Validador de Clientes", url: "/validation", icon: Shield, locked: true, comingSoonNote: "Validación con IA en pruebas." },
  { title: "Shopify Analytics", url: "/shopify", icon: ShoppingBag, locked: true, comingSoonNote: "Analytics nativo Shopify en beta privada." },
  { title: "Dropi", url: "/dropi", icon: Box, locked: true, comingSoonNote: "Conexión directa con Dropi en beta privada." },
  { title: "Studio IA", url: "/studio-ia", icon: Sparkles, locked: true, comingSoonNote: "Studio IA: imagen, copy y logo en beta." },
  { title: "Chat en Vivo", url: "/chat", icon: MessageSquare, locked: true, comingSoonNote: "Chat omnicanal en beta privada." },
  { title: "Validación Pedidos", url: "/order-validation", icon: CheckCircle, locked: true, comingSoonNote: "Validación automática de pedidos en pruebas." },
  { title: "Seguimiento", url: "/tracking", icon: Truck, locked: true, comingSoonNote: "Tracking unificado de transportadoras en construcción." },
  { title: "Gestor de Leads", url: "/leads", icon: Users, locked: true, comingSoonNote: "Pipeline de leads con scoring en construcción." },
  { title: "Configuración", url: "/settings", icon: Settings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function sidebarDisplayName(user: { firstName: string; lastName: string; email: string } | null): string {
  if (!user) return '';
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return full || user.email;
}

// Componente interno para el footer del sidebar
function SidebarFooterContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const displayName = sidebarDisplayName(user);
  const fallbackInitial =
    (user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  const handleNavigateToProfile = () => navigate('/profile');
  const handleNavigateToBilling = () => navigate('/billing');
  const handleNavigateToSettings = () => navigate('/settings');
  const handleNavigateToKeyboardShortcuts = () => navigate('/keyboard-shortcuts');
  const handleNavigateToTeam = () => navigate('/team');
  const handleNavigateToNewTeam = () => navigate('/team/new');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 w-full cursor-pointer hover:bg-sidebar-accent rounded-md p-1 transition-colors">
              <Avatar className="size-6">
                <AvatarImage src={user?.avatarUrl} alt="" />
                <AvatarFallback>{fallbackInitial}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {displayName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="size-3" />
                    <span className="sr-only">Abrir menú de usuario</span>
                  </Button>
                </>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleNavigateToProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNavigateToBilling}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Facturación</span>
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNavigateToSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNavigateToKeyboardShortcuts}>
                <Keyboard className="mr-2 h-4 w-4" />
                <span>Atajos de teclado</span>
                <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleNavigateToTeam}>
                <Users className="mr-2 h-4 w-4" />
                <span>Equipo</span>
              </DropdownMenuItem>
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Invitar usuarios</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => navigate('/team/invite/email')}>
                    <span>Email</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/team/invite/message')}>
                    <span>Mensaje</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/team/invite/more')}>
                    <span>Más...</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuItem onClick={handleNavigateToNewTeam}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Nuevo Equipo</span>
                <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { user, logout } = useAuth();
  const { 
    notifications, 
    isVisible, 
    consolidatedMode, 
    consolidatedStats, 
    dismissNotification, 
    viewNotification, 
    viewOrder,
    dismissAll 
  } = useNotifications();

  // Función para manejar la navegación desde notificaciones
  const handleViewOrder = (orderNumber: string) => {
    const url = viewOrder(orderNumber);
    if (url) {
      navigate(url);
    }
  };

  const [metrics, setMetrics] = useState({
    visitors: 0,
    sales: 0,
    sessions: 0,
    orders: 0
  });

  const { open: isCommandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette();
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
          .from('shopify_connections')
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

  // Inicializar métricas en cero hasta conectar con Shopify
  useEffect(() => {
    if (!hasShopifyConnection) {
      setMetrics({
        visitors: 0,
        sales: 0,
        sessions: 0,
        orders: 0
      });
      return;
    }

    // TODO: Implementar carga real de métricas cuando esté conectado
    // const interval = setInterval(() => {
    //   // Cargar métricas reales desde Shopify
    // }, 5000);

    // return () => clearInterval(interval);
  }, [hasShopifyConnection]);


  return (
    <TooltipProvider>
      <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="justify-center">
                <NavLink to="/dashboard" className="flex w-full items-center justify-center">
                  <div className="grid leading-tight text-center">
                    <span className="font-orbitron wordmark-glow text-sm uppercase tracking-[0.14em]">
                      NOMADEV.IO
                    </span>
                  </div>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">
              Plataforma
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.locked ? (
                      <SidebarMenuButton
                        tooltip={`${item.title} — Próximamente`}
                        className="text-sm opacity-60 cursor-not-allowed hover:bg-sidebar-accent/40"
                        onClick={() =>
                          toast(`${item.title} — Próximamente`, {
                            description:
                              item.comingSoonNote ?? "Esta herramienta llega en la próxima release.",
                          })
                        }
                      >
                        <item.icon className="size-4" strokeWidth={1.75} />
                        <span className="flex-1 truncate">{item.title}</span>
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-warning/25 bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
                          <Lock className="size-2.5" /> Soon
                        </span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                        className="text-sm"
                      >
                        <NavLink to={item.url}>
                          <item.icon className="size-4" strokeWidth={1.75} />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {hasShopifyConnection && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm font-semibold">Métricas en Tiempo Real</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                      <Activity className="size-3" />
                      <span>Visitantes: {metrics.visitors}</span>
                    </div>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                      <DollarSign className="size-3" />
                      <span>Ventas: ${metrics.sales.toLocaleString()}</span>
                    </div>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                      <Eye className="size-3" />
                      <span>Sesiones: {metrics.sessions}</span>
                    </div>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                      <Package className="size-3" />
                      <span>Pedidos: {metrics.orders}</span>
                    </div>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

        </SidebarContent>

        <SidebarFooter>
          <SidebarFooterContent />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 grid h-[3.25rem] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border/40 bg-background/65 px-4 shadow-[inset_0_-1px_0_0_hsl(var(--border)/0.25)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50">
          {/* Left section */}
          <div className="flex min-w-0 items-center justify-self-start gap-1.5">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-1 h-4" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCommandPaletteOpen(true)}
              className="h-8 gap-2 rounded-full border border-transparent px-3 text-muted-foreground font-normal hover:border-border/50 hover:bg-muted/50"
            >
              <Search className="size-3.5 opacity-80" />
              <span className="hidden sm:inline text-xs">Buscar...</span>
              <kbd className="hidden md:inline-flex pointer-events-none ml-1 h-5 select-none items-center gap-1 rounded-full border border-border/50 bg-muted/35 px-2 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
            {hasShopifyConnection && (
              <Badge variant="success" className="ml-1">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                </span>
                Live
              </Badge>
            )}
          </div>

          {/* Wordmark NOMADEV.IO (Orbitron + glow, mismo criterio que DashboardHeader / LoadingLogo) */}
          <NavLink
            to="/dashboard"
            className="shrink-0 rounded-md px-1 py-0.5 outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="NOMADEV.IO — ir al inicio"
          >
            <span
              className="font-orbitron wordmark-glow block whitespace-nowrap text-base uppercase tracking-[0.14em] sm:text-lg"
            >
              NOMADEV.IO
            </span>
          </NavLink>

          {/* Right section */}
          <div className="flex min-w-0 items-center justify-self-end gap-1">
            {/* Botón de notificaciones con funcionalidad */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="relative">
                  <Bell className="size-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground tabular-nums ring-2 ring-background">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  <>
                    <div className="p-3">
                      <p className="text-sm text-muted-foreground mb-3">
                        {notifications.length} notificaciones nuevas
                      </p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {notifications.slice(0, 5).map((notification) => (
                          <div key={notification.id} className="flex items-start justify-between p-2 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{notification.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 ml-2">
                              <Badge
                                variant={
                                  notification.priority === 'urgent' ? 'destructive' :
                                  notification.priority === 'high' ? 'warning' :
                                  notification.priority === 'medium' ? 'info' : 'soft'
                                }
                              >
                                {notification.priority}
                              </Badge>
                              {notification.actionText && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => viewNotification(notification)}
                                >
                                  {notification.actionText}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        {notifications.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{notifications.length - 5} más...
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={dismissAll}>
                      <Eye className="mr-2 h-4 w-4" />
                      Marcar Todas como Leídas
                    </DropdownMenuItem>
                  </>
                ) : (
                  <div className="p-3 text-center">
                    <Bell className="size-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay notificaciones</p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <div className="custom-scrollbar flex w-full min-w-0 flex-1 flex-col gap-6 overflow-y-auto p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>

      {/* Notificaciones optimizadas y escalables */}
      {isVisible && notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <SimpleNotification
            notifications={notifications.map(n => ({
              id: n.id,
              title: n.title,
              message: n.message,
              priority: n.priority,
              count: n.count || 1,
              actionUrl: n.actionUrl,
              actionText: n.actionText
            }))}
            onDismiss={dismissNotification}
            onViewAll={handleViewOrder}
            onDismissAll={dismissAll}
          />
        </div>
      )}
    </SidebarProvider>

    <CommandPalette open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </TooltipProvider>
  );
}
