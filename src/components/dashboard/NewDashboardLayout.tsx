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
  Clock,
  Package,
  MessageCircle,
  CheckCircle,
  Truck,
  Box,
  UserCheck,
  Sparkles,
  Command,
  LogOut,
  User,
  Bell,
  Search,
  MoreHorizontal,
  ChevronRight,
  CreditCard,
  Keyboard,
  UserPlus,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Validador de Clientes", url: "/validation", icon: Shield },
  { title: "CRM", url: "/crm", icon: UserCheck },
  { title: "Gestión de Pedidos", url: "/orders", icon: Package },
  { title: "Shopify Analytics", url: "/shopify", icon: ShoppingBag },
  { title: "Dropi", url: "/dropi", icon: Box },
  { title: "Studio IA", url: "/studio-ia", icon: Sparkles },
  { title: "Chat en Vivo", url: "/chat", icon: MessageSquare },
  { title: "Validación Pedidos", url: "/order-validation", icon: CheckCircle },
  { title: "Seguimiento", url: "/tracking", icon: Truck },
  { title: "Gestor de Leads", url: "/leads", icon: Users },
  { title: "Configuración", url: "/settings", icon: Settings },
];

interface NewDashboardLayoutProps {
  children: React.ReactNode;
}

// Componente interno para el footer del sidebar
function SidebarFooterContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

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
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.user_metadata?.full_name || user?.email}
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

export function NewDashboardLayout({ children }: NewDashboardLayoutProps) {
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

  // Estado para el modal de búsqueda
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
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


  // Funcionalidad de búsqueda
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Base de datos de búsqueda expandida con lógica específica
    const searchDatabase = [
      // Páginas principales
      { id: 1, title: "Dashboard", description: "Panel principal de métricas", url: "/dashboard", type: "page", keywords: ["dashboard", "panel", "métricas", "estadísticas", "inicio", "principal", "home", "resumen"] },
      { id: 2, title: "Validador de Clientes", description: "Herramienta de validación de clientes", url: "/validation", type: "page", keywords: ["validar", "clientes", "validación", "verificar", "aprobar", "rechazar", "revisar", "confirmar"] },
      { id: 3, title: "CRM", description: "Gestión de relaciones con clientes", url: "/crm", type: "page", keywords: ["crm", "clientes", "relaciones", "gestión", "contactos", "prospectos", "ventas", "seguimiento"] },
      { id: 4, title: "Gestión de Pedidos", description: "Administración de pedidos", url: "/orders", type: "page", keywords: ["pedidos", "ordenes", "gestión", "administración", "compras", "ventas", "transacciones", "facturas"] },
      { id: 5, title: "Studio IA", description: "Herramientas de inteligencia artificial", url: "/studio-ia", type: "page", keywords: ["studio", "ia", "inteligencia", "artificial", "ai", "herramientas", "generar", "crear", "automatizar"] },
      { id: 6, title: "Configuración", description: "Ajustes del sistema", url: "/settings", type: "page", keywords: ["configuración", "ajustes", "settings", "config", "preferencias", "opciones", "personalizar", "modificar"] },
      
      // Herramientas de IA específicas con lógica expandida
      { id: 7, title: "Generador de Imágenes de Productos", description: "Crea imágenes profesionales con IA", url: "/product-image-generator", type: "tool", keywords: ["imagen", "producto", "generar", "foto", "subir", "crear", "dall-e", "ia", "ai", "fotografía", "visual", "diseño", "imágenes", "productos", "catálogo", "galería", "portfolio", "fotos", "pictures", "photos", "upload", "image", "product", "generate", "create"] },
      { id: 8, title: "Generador de Logos", description: "Crea logos únicos para tu tienda", url: "/logo-generator", type: "tool", keywords: ["logo", "marca", "crear", "diseño", "generar", "tienda", "branding", "identidad", "visual", "símbolo", "emblema", "icono", "marca", "brand", "logotipo", "diseño", "design", "crear", "create", "generar", "generate"] },
      { id: 9, title: "Copywriting con IA", description: "Genera contenido persuasivo", url: "/copywriting", type: "tool", keywords: ["copywriting", "texto", "contenido", "escribir", "marketing", "descripción", "promocional", "copy", "writing", "redacción", "contenido", "textos", "descripciones", "marketing", "publicidad", "promoción", "escribir", "write", "content", "text"] },
      
      // Herramientas web y desarrollo
      { id: 10, title: "Constructor de Páginas Web", description: "Crea páginas web profesionales", url: "/website-builder", type: "tool", keywords: ["página", "web", "sitio", "website", "construir", "crear", "diseñar", "desarrollar", "builder", "page", "site", "web", "html", "css", "javascript", "responsive", "mobile", "landing", "homepage", "página", "web", "sitio", "web", "construir", "crear", "diseñar", "desarrollar", "builder", "page", "site", "web", "html", "css", "javascript", "responsive", "mobile", "landing", "homepage"] },
      { id: 11, title: "Generador de Landing Pages", description: "Crea páginas de aterrizaje efectivas", url: "/landing-pages", type: "tool", keywords: ["landing", "page", "página", "aterrizaje", "conversión", "ventas", "marketing", "lead", "captura", "formulario", "cta", "call", "action", "conversión", "ventas", "marketing", "lead", "captura", "formulario", "cta", "call", "action"] },
      { id: 12, title: "Optimizador SEO", description: "Optimiza tu sitio web para motores de búsqueda", url: "/seo-optimizer", type: "tool", keywords: ["seo", "optimización", "google", "búsqueda", "ranking", "keywords", "meta", "tags", "optimizar", "posicionamiento", "search", "engine", "optimization", "google", "ranking", "keywords", "meta", "tags", "optimize", "positioning"] },
      
      // Leads y clientes
      { id: 13, title: "Lead: Carlos Rodríguez", description: "Lead calificado - Interés en ecommerce", url: "/crm", type: "lead", keywords: ["carlos", "rodriguez", "lead", "prospecto", "cliente", "potencial", "ecommerce", "tienda", "online"] },
      { id: 14, title: "Lead: Ana Martínez", description: "Lead calificado - Tienda de ropa", url: "/crm", type: "lead", keywords: ["ana", "martinez", "lead", "prospecto", "cliente", "ropa", "fashion", "moda", "vestimenta"] },
      { id: 15, title: "Lead: Miguel Torres", description: "Lead calificado - Productos digitales", url: "/crm", type: "lead", keywords: ["miguel", "torres", "lead", "prospecto", "cliente", "digital", "productos", "software", "apps"] },
      { id: 16, title: "Cliente: María González", description: "Cliente activo - 5 pedidos completados", url: "/crm", type: "customer", keywords: ["maria", "gonzalez", "cliente", "activo", "pedidos", "completados", "fiel"] },
      { id: 17, title: "Cliente: Juan Pérez", description: "Cliente VIP - Tienda premium", url: "/crm", type: "customer", keywords: ["juan", "perez", "cliente", "vip", "premium", "tienda", "importante"] },
      
      // Pedidos
      { id: 18, title: "Pedido #12345", description: "Pedido en proceso de validación - $450", url: "/orders", type: "order", keywords: ["pedido", "12345", "validación", "proceso", "450", "dólares", "pendiente"] },
      { id: 19, title: "Pedido #12346", description: "Pedido completado - $320", url: "/orders", type: "order", keywords: ["pedido", "12346", "completado", "320", "dólares", "finalizado"] },
      { id: 20, title: "Pedido #12347", description: "Pedido pendiente de pago - $180", url: "/orders", type: "order", keywords: ["pedido", "12347", "pendiente", "pago", "180", "dólares", "cobrar"] },
      
      // Herramientas por funcionalidad
      { id: 21, title: "Chat en Vivo", description: "Sistema de chat con clientes", url: "/chat", type: "tool", keywords: ["chat", "vivo", "mensaje", "conversación", "cliente", "soporte", "ayuda", "comunicación", "whatsapp", "telegram", "messenger", "live", "chat", "support", "help", "communication"] },
      { id: 22, title: "Analytics de Shopify", description: "Análisis de rendimiento de tienda", url: "/shopify-analytics", type: "tool", keywords: ["analytics", "shopify", "análisis", "rendimiento", "estadísticas", "ventas", "métricas", "reportes", "datos", "performance", "stats", "reports", "data", "metrics"] },
      { id: 23, title: "Gestor de Leads", description: "Administración de prospectos", url: "/leads", type: "tool", keywords: ["leads", "prospectos", "gestión", "administración", "seguimiento", "pipeline", "ventas", "oportunidades", "management", "tracking", "sales", "opportunities"] },
      { id: 24, title: "Integración WhatsApp", description: "Conecta WhatsApp Business con tu tienda", url: "/whatsapp-integration", type: "tool", keywords: ["whatsapp", "business", "integración", "conectar", "mensajes", "notificaciones", "chat", "comunicación", "integration", "connect", "messages", "notifications", "communication"] },
      { id: 25, title: "Generador de Códigos QR", description: "Crea códigos QR para productos y promociones", url: "/qr-generator", type: "tool", keywords: ["qr", "código", "generar", "crear", "producto", "promoción", "marketing", "digital", "escaneo", "code", "generate", "create", "product", "promotion", "marketing", "digital", "scan"] },
    ];

    // Búsqueda inteligente con keywords
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 0);
    
    const filteredResults = searchDatabase.filter(result => {
      // Búsqueda en título y descripción
      const titleMatch = result.title.toLowerCase().includes(queryLower);
      const descriptionMatch = result.description.toLowerCase().includes(queryLower);
      
      // Búsqueda en keywords
      const keywordMatch = result.keywords.some(keyword => 
        keyword.toLowerCase().includes(queryLower) ||
        queryWords.some(word => keyword.toLowerCase().includes(word))
      );
      
      // Búsqueda por palabras individuales
      const wordMatch = queryWords.some(word => 
        result.title.toLowerCase().includes(word) ||
        result.description.toLowerCase().includes(word) ||
        result.keywords.some(keyword => keyword.toLowerCase().includes(word))
      );
      
      return titleMatch || descriptionMatch || keywordMatch || wordMatch;
    });

    // Ordenar resultados por relevancia
    const sortedResults = filteredResults.sort((a, b) => {
      // Priorizar coincidencias exactas en título
      const aTitleExact = a.title.toLowerCase().includes(queryLower);
      const bTitleExact = b.title.toLowerCase().includes(queryLower);
      if (aTitleExact && !bTitleExact) return -1;
      if (!aTitleExact && bTitleExact) return 1;
      
      // Priorizar coincidencias en keywords
      const aKeywordMatch = a.keywords.some(k => k.toLowerCase().includes(queryLower));
      const bKeywordMatch = b.keywords.some(k => k.toLowerCase().includes(queryLower));
      if (aKeywordMatch && !bKeywordMatch) return -1;
      if (!aKeywordMatch && bKeywordMatch) return 1;
      
      return 0;
    });

    setSearchResults(sortedResults);
  };

  const handleSearchResultClick = (result: any) => {
    navigate(result.url);
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
      <Sidebar 
        variant="inset" 
        collapsible="icon" 
        className="border-0"
        style={{ 
          border: 'none',
          boxShadow: 'none',
          outline: 'none'
        }}
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <NavLink to="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">NOMADEV.IO</span>
                    <span className="truncate text-xs">Dashboard</span>
                  </div>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-semibold">Navegación Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="text-base"
                    >
                      <NavLink to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
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

      <SidebarInset 
        className="border-0"
        style={{ 
          border: 'none',
          boxShadow: 'none',
          outline: 'none'
        }}
      >
        <header className="relative flex h-16 shrink-0 items-center border-b px-4 bg-background rounded-t-lg">
          {/* Left section */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 border-0 bg-transparent hover:bg-transparent" />
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Search className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Buscar en NOMADEV.IO</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                    <Input
                      placeholder="Buscar páginas, clientes, pedidos..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  
                  {searchQuery && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        searchResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleSearchResultClick(result)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="flex-shrink-0">
                              {result.type === 'page' && <BarChart3 className="size-4 text-muted-foreground" />}
                              {result.type === 'customer' && <User className="size-4 text-muted-foreground" />}
                              {result.type === 'lead' && <UserCheck className="size-4 text-muted-foreground" />}
                              {result.type === 'order' && <Package className="size-4 text-muted-foreground" />}
                              {result.type === 'tool' && <Sparkles className="size-4 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{result.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                            </div>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="size-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No se encontraron resultados</p>
                          <p className="text-xs">Intenta con otros términos de búsqueda</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!searchQuery && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="size-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Busca páginas, clientes, pedidos y más</p>
                      <p className="text-xs">Escribe para comenzar la búsqueda</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Separator orientation="vertical" className="mr-2 h-4" />
            {hasShopifyConnection && (
              <Badge variant="outline" className="text-xs">
                <Activity className="size-3 mr-1" />
                Conectado
              </Badge>
            )}
          </div>

          {/* Center section - Logo NOMADEV.IO */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <span 
              className="text-3xl font-black tracking-wider animate-pulse"
              style={{
                color: '#14b8a6',
                textShadow: '0 0 5px #14b8a6, 0 0 10px #14b8a6, 0 0 15px #14b8a6',
                fontFamily: '"Orbitron", "Exo 2", "Rajdhani", "Roboto Condensed", "Arial Black", sans-serif',
                fontWeight: '900',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontStretch: 'condensed',
                animation: 'pulse 3s ease-in-out infinite'
              }}
            >
              NOMADEV.IO
            </span>
          </div>

          {/* Right section */}
          <div className="ml-auto flex items-center gap-2">
            {/* Botón de notificaciones con funcionalidad */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="size-4" />
                  {notifications.length > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 size-5 text-xs"
                    >
                      {notifications.length}
                    </Badge>
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
                                  notification.priority === 'high' ? 'default' : 
                                  notification.priority === 'medium' ? 'secondary' : 'outline'
                                }
                                className="text-xs"
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
        
        <div className="flex flex-1 flex-col gap-4 p-4">
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
    </TooltipProvider>
  );
}
