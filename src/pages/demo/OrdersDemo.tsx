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
  X,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

const OrdersDemo = () => {
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

  const orderMetrics = [
    { title: "Pedidos Pendientes", value: "23", change: "+5.2%", icon: Clock, color: "text-orange-500" },
    { title: "Pedidos Validados", value: "1,247", change: "+12%", icon: CheckCircle, color: "text-emerald-500" },
    { title: "Pedidos Rechazados", value: "8", change: "-2.1%", icon: X, color: "text-red-500" },
    { title: "Tiempo Promedio", value: "2m 34s", change: "-15.3%", icon: Activity, color: "text-blue-500" }
  ];

  const pendingOrders = [
    { 
      id: "ORD-001", 
      customer: "María González", 
      amount: "$89.99", 
      items: 3, 
      status: "pending",
      time: "2 min",
      priority: "high"
    },
    { 
      id: "ORD-002", 
      customer: "Carlos Ruiz", 
      amount: "$156.50", 
      items: 5, 
      status: "pending",
      time: "5 min",
      priority: "medium"
    },
    { 
      id: "ORD-003", 
      customer: "Ana Martínez", 
      amount: "$234.75", 
      items: 2, 
      status: "pending",
      time: "8 min",
      priority: "low"
    },
    { 
      id: "ORD-004", 
      customer: "Luis Pérez", 
      amount: "$67.25", 
      items: 1, 
      status: "pending",
      time: "12 min",
      priority: "high"
    }
  ];

  const recentValidations = [
    { id: "ORD-005", customer: "Sofia López", amount: "$123.45", status: "validated", time: "1 min" },
    { id: "ORD-006", customer: "Miguel Torres", amount: "$89.99", status: "rejected", time: "3 min" },
    { id: "ORD-007", customer: "Elena Vargas", amount: "$200.00", status: "validated", time: "5 min" },
    { id: "ORD-008", customer: "Roberto Silva", amount: "$156.50", status: "validated", time: "7 min" }
  ];

  const getCurrentSectionInfo = () => {
    return {
      title: "Validación de Pedidos",
      description: "Sistema automático de verificación y validación de pedidos con análisis de riesgo, detección de fraudes y aprobación inteligente."
    };
  };

  const getDemoRoute = (section: string) => {
    const routeMap: { [key: string]: string } = {
      'dashboard': '/interactive-demo',
      'validation': '/validation-demo',
      'analytics': '/shopify-demo',
      'chat': '/chat-demo',
      'tracking': '/tracking-demo',
      'leads': '/leads-demo',
      'settings': '/settings-demo'
    };
    return routeMap[section] || '/interactive-demo';
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
            const isActive = item.id === 'orders';
            
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Validación de Pedidos</h1>
              <p className="text-muted-foreground">Sistema automático de verificación y validación de pedidos</p>
            </div>

            {/* Métricas de Pedidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {orderMetrics.map((metric, index) => (
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

            {/* Pedidos Pendientes y Recientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pedidos Pendientes */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                    Pedidos Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingOrders.map((order) => (
                      <div key={order.id} className="p-4 bg-muted/50 rounded-lg border-l-4 border-orange-500">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{order.id}</span>
                            <Badge variant={order.priority === 'high' ? 'destructive' : order.priority === 'medium' ? 'default' : 'secondary'}>
                              {order.priority}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{order.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{order.customer}</p>
                            <p className="text-sm text-muted-foreground">{order.items} productos</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{order.amount}</p>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Validar
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs">
                                <X className="h-3 w-3 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Validaciones Recientes */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-2" />
                    Validaciones Recientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentValidations.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            order.status === 'validated' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                          }`}>
                            {order.status === 'validated' ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{order.id}</p>
                            <p className="text-sm text-muted-foreground">{order.customer}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{order.amount}</p>
                          <p className="text-sm text-muted-foreground">{order.time}</p>
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
                    navigate(getDemoRoute('tracking'));
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

export default OrdersDemo;
