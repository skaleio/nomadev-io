import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Users,
  Eye,
  Clock,
  Package,
  Bell,
  Search,
  User,
  LogOut,
  BarChart3,
  Settings,
  Truck,
  MessageSquare,
  ShoppingCart,
  DollarSign,
  MapPin,
  Navigation,
  Route,
  ChevronRight
} from 'lucide-react';

const TrackingDemo = () => {
  const navigate = useNavigate();
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const navigationItems = [
    { title: "Dashboard", icon: BarChart3, id: "dashboard" },
    { title: "Validador de Clientes", icon: Shield, id: "validation" },
    { title: "Shopify Analytics", icon: ShoppingCart, id: "analytics" },
    { title: "Chat en Vivo", icon: MessageSquare, id: "chat" },
    { title: "Validación Pedidos", icon: CheckCircle, id: "orders" },
    { title: "Seguimiento", icon: Truck, id: "tracking" },
    { title: "Gestor de Leads", icon: Users, id: "leads" },
    { title: "Configuración", icon: Settings, id: "settings" }
  ];

  const liveMetrics = [
    { label: "Visitantes", value: "42", icon: Eye },
    { label: "Ventas", value: "$2968", icon: DollarSign },
    { label: "Sesiones", value: "195", icon: Clock },
    { label: "Pedidos", value: "64", icon: Package }
  ];

  const trackingMetrics = [
    { title: "Envíos Activos", value: "156", change: "+12.5%", icon: Truck, color: "text-blue-500" },
    { title: "Entregados Hoy", value: "89", change: "+8.3%", icon: CheckCircle, color: "text-emerald-500" },
    { title: "En Tránsito", value: "67", change: "+15.2%", icon: Navigation, color: "text-orange-500" },
    { title: "Tiempo Promedio", value: "2.3 días", change: "-5.1%", icon: Clock, color: "text-purple-500" }
  ];

  const activeShipments = [
    { 
      id: "TRK-001", 
      customer: "María González", 
      destination: "Madrid, España", 
      status: "in_transit",
      progress: 65,
      estimated: "2 horas",
      carrier: "DHL"
    },
    { 
      id: "TRK-002", 
      customer: "Carlos Ruiz", 
      destination: "Barcelona, España", 
      status: "out_for_delivery",
      progress: 90,
      estimated: "30 min",
      carrier: "Correos"
    },
    { 
      id: "TRK-003", 
      customer: "Ana Martínez", 
      destination: "Valencia, España", 
      status: "processing",
      progress: 25,
      estimated: "1 día",
      carrier: "SEUR"
    },
    { 
      id: "TRK-004", 
      customer: "Luis Pérez", 
      destination: "Sevilla, España", 
      status: "delivered",
      progress: 100,
      estimated: "Entregado",
      carrier: "UPS"
    }
  ];

  const recentDeliveries = [
    { id: "TRK-005", customer: "Sofia López", destination: "Bilbao", status: "delivered", time: "1 hora" },
    { id: "TRK-006", customer: "Miguel Torres", destination: "Málaga", status: "delivered", time: "2 horas" },
    { id: "TRK-007", customer: "Elena Vargas", destination: "Zaragoza", status: "delivered", time: "3 horas" },
    { id: "TRK-008", customer: "Roberto Silva", destination: "Murcia", status: "delivered", time: "4 horas" }
  ];

  const getCurrentSectionInfo = () => {
    return {
      title: "Seguimiento de Envíos",
      description: "Sistema de rastreo en tiempo real de todos los envíos con integración a múltiples transportistas y notificaciones automáticas."
    };
  };

  const getDemoRoute = (section: string) => {
    const routeMap: { [key: string]: string } = {
      'dashboard': '/interactive-demo',
      'validation': '/validation-demo',
      'analytics': '/shopify-demo',
      'chat': '/chat-demo',
      'orders': '/orders-demo',
      'leads': '/leads-demo',
      'settings': '/settings-demo'
    };
    return routeMap[section] || '/interactive-demo';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-emerald-500';
      case 'out_for_delivery': return 'text-blue-500';
      case 'in_transit': return 'text-orange-500';
      case 'processing': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Entregado';
      case 'out_for_delivery': return 'En reparto';
      case 'in_transit': return 'En tránsito';
      case 'processing': return 'Procesando';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-40">
        {/* Header del Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">test</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 p-4">
          {navigationItems.map((item, index) => {
            const isActive = item.id === 'tracking';
            
            return (
              <div
                key={index}
                className={`nav-item group flex items-center px-3 py-2 rounded-lg transition-colors w-full text-left ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary'
                }`}
              >
                <item.icon className="w-5 h-5 transition-colors mr-3" />
                <span className="transition-colors">{item.title}</span>
              </div>
            );
          })}
        </nav>

        {/* Métricas en Tiempo Real */}
        <div className="p-4">
          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Métricas en Vivo</span>
            </div>
            
            <div className="space-y-3">
              {liveMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-white/60 dark:bg-white/5 rounded-lg backdrop-blur-sm border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <metric.icon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{metric.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="glass-card p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse-glow"></div>
              <span className="text-sm font-medium text-sidebar-foreground">Sistema Activo</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Todos los servicios funcionando correctamente
            </p>
          </div>
        </div>
      </aside>

      {/* Header */}
      <header className="fixed top-0 right-0 left-64 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-30">
        <div className="flex items-center h-full px-6">
          {/* Search - Lado Izquierdo */}
          <div className="flex items-center gap-4 w-80">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar clientes, pedidos, chats..."
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/50 rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                readOnly
              />
            </div>
          </div>

          {/* Logo en el centro */}
          <div className="flex-1 flex items-center justify-center">
            <div
              className="text-2xl font-black text-emerald-600 transition-all duration-300 cursor-pointer tracking-wider uppercase animate-bounce"
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
            >
              NOMADEV.IO
            </div>
          </div>

          {/* User Actions - Lado Derecho */}
          <div className="flex items-center gap-3 w-80 justify-end">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Hola,</span>
              <span className="font-medium">Usuario</span>
            </div>
            <div className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-xs flex items-center justify-center text-white font-semibold shadow-lg border-2 border-background animate-pulse">
                3
              </span>
            </div>
            <User className="w-5 h-5 text-muted-foreground" />
            <LogOut className="w-4 h-4 text-red-600" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 ml-64 min-h-screen">
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Seguimiento de Envíos</h1>
              <p className="text-muted-foreground">Sistema de rastreo en tiempo real de todos los envíos</p>
            </div>

            {/* Métricas de Seguimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trackingMetrics.map((metric, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">{metric.title}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                        <p className="text-emerald-500 text-sm mt-1">{metric.change}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <metric.icon className={`h-6 w-6 ${metric.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Envíos Activos y Entregas Recientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Envíos Activos */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Truck className="h-5 w-5 text-blue-500 mr-2" />
                    Envíos Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeShipments.map((shipment) => (
                      <div key={shipment.id} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{shipment.id}</span>
                            <Badge variant="outline" className={getStatusColor(shipment.status)}>
                              {getStatusText(shipment.status)}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{shipment.estimated}</span>
                        </div>
                        
                        <div className="mb-3">
                          <p className="font-medium text-foreground">{shipment.customer}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {shipment.destination}
                          </p>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="text-foreground">{shipment.progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${shipment.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Transportista: {shipment.carrier}</span>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Route className="h-3 w-3 mr-1" />
                            Rastrear
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Entregas Recientes */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-2" />
                    Entregas Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentDeliveries.map((delivery) => (
                      <div key={delivery.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{delivery.id}</p>
                            <p className="text-sm text-muted-foreground">{delivery.customer}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-foreground">{delivery.destination}</p>
                          <p className="text-sm text-muted-foreground">{delivery.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Cuadrito de información de la guía */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          {/* Indicador de pulso */}
          <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
          <Button
            onClick={() => setShowInfoTooltip(!showInfoTooltip)}
            className="relative bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-14 h-14 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 border-2 border-emerald-500/20 hover:border-emerald-400/40"
            title="Información de la herramienta"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          
          {/* Cuadrito de información */}
          {showInfoTooltip && (
            <div className="absolute bottom-16 right-0 w-80 bg-card border border-border rounded-lg shadow-2xl p-4 z-50">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">{getCurrentSectionInfo().title}</h3>
                <Button
                  onClick={() => setShowInfoTooltip(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {getCurrentSectionInfo().description}
              </p>
              <div className="flex justify-between">
                <Button
                  onClick={() => setShowInfoTooltip(false)}
                  size="sm"
                  variant="outline"
                  className="border-border text-muted-foreground hover:text-foreground text-xs"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setShowInfoTooltip(false);
                    // Navegar a la siguiente herramienta
                    navigate(getDemoRoute('leads'));
                  }}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingDemo;
