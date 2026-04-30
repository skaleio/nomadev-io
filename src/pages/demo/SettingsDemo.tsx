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
  Key,
  Database,
  Globe,
  Smartphone,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

const SettingsDemo = () => {
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

  const systemStatus = [
    { service: "WhatsApp Business API", status: "Conectado", icon: Smartphone, color: "text-emerald-500" },
    { service: "Shopify Integration", status: "Activo", icon: ShoppingCart, color: "text-blue-500" },
    { service: "Base de Datos", status: "Online", icon: Database, color: "text-emerald-500" },
    { service: "Sistema de Seguridad", status: "Protegido", icon: ShieldCheck, color: "text-emerald-500" }
  ];

  const integrations = [
    { name: "Shopify", status: "Conectado", lastSync: "Hace 2 min", icon: ShoppingCart, color: "text-green-500" },
    { name: "WhatsApp Business", status: "Activo", lastSync: "Hace 1 min", icon: Smartphone, color: "text-green-500" },
    { name: "Google Analytics", status: "Conectado", lastSync: "Hace 5 min", icon: BarChart3, color: "text-blue-500" },
    { name: "Mailchimp", status: "Desconectado", lastSync: "Hace 2 horas", icon: Mail, color: "text-red-500" }
  ];

  const securityAlerts = [
    { type: "Login exitoso", message: "Nuevo acceso desde Madrid, España", time: "Hace 5 min", severity: "info" },
    { type: "Cambio de contraseña", message: "Contraseña actualizada exitosamente", time: "Hace 1 hora", severity: "success" },
    { type: "Intento de acceso", message: "Intento fallido desde IP desconocida", time: "Hace 2 horas", severity: "warning" }
  ];

  const getCurrentSectionInfo = () => {
    return {
      title: "Configuración del Sistema",
      description: "¡Has completado el tour! Esta es la última herramienta. Aquí puedes gestionar todos los servicios, integraciones y configuraciones del sistema."
    };
  };

  const getDemoRoute = (section: string) => {
    const routeMap: { [key: string]: string } = {
      'dashboard': '/interactive-demo',
      'validation': '/validation-demo',
      'analytics': '/shopify-demo',
      'chat': '/chat-demo',
      'orders': '/orders-demo',
      'tracking': '/tracking-demo',
      'leads': '/leads-demo'
    };
    return routeMap[section] || '/interactive-demo';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-500';
      case 'success': return 'text-emerald-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info': return <AlertCircle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
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
            const isActive = item.id === 'settings';
            
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Configuración del Sistema</h1>
              <p className="text-muted-foreground">Gestión y configuración de todos los servicios y integraciones</p>
            </div>

            {/* Estado del Sistema */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Settings className="h-5 w-5 text-blue-500 mr-2" />
                  Estado del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {systemStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                        <div>
                          <p className="font-medium text-foreground">{item.service}</p>
                          <p className="text-sm text-muted-foreground">{item.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Integraciones y Alertas de Seguridad */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Integraciones */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Globe className="h-5 w-5 text-purple-500 mr-2" />
                    Integraciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {integrations.map((integration, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <integration.icon className={`h-5 w-5 ${integration.color}`} />
                          <div>
                            <p className="font-medium text-foreground">{integration.name}</p>
                            <p className="text-sm text-muted-foreground">{integration.lastSync}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={integration.status === 'Conectado' || integration.status === 'Activo' ? 'default' : 'destructive'}>
                            {integration.status}
                          </Badge>
                          <Button size="sm" variant="outline" className="text-xs">
                            Configurar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alertas de Seguridad */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Shield className="h-5 w-5 text-emerald-500 mr-2" />
                    Alertas de Seguridad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {securityAlerts.map((alert, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getSeverityColor(alert.severity)}`}>
                          {getSeverityIcon(alert.severity)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{alert.type}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuraciones Avanzadas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Key className="h-5 w-5 text-orange-500 mr-2" />
                    Seguridad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Autenticación 2FA</span>
                      <Badge variant="default">Activo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Encriptación SSL</span>
                      <Badge variant="default">Activo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Backup Automático</span>
                      <Badge variant="default">Activo</Badge>
                    </div>
                    <Button className="w-full mt-4" size="sm">
                      <Lock className="h-4 w-4 mr-2" />
                      Cambiar Contraseña
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Bell className="h-5 w-5 text-blue-500 mr-2" />
                    Notificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Email</span>
                      <Badge variant="default">Activo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Push</span>
                      <Badge variant="default">Activo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">SMS</span>
                      <Badge variant="secondary">Inactivo</Badge>
                    </div>
                    <Button className="w-full mt-4" size="sm" variant="outline">
                      <Bell className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Database className="h-5 w-5 text-green-500 mr-2" />
                    Base de Datos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Estado</span>
                      <Badge variant="default">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Uso</span>
                      <span className="text-sm text-foreground">2.3 GB / 10 GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Último Backup</span>
                      <span className="text-sm text-foreground">Hace 2 horas</span>
                    </div>
                    <Button className="w-full mt-4" size="sm" variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Backup Manual
                    </Button>
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
                    // Navegar a la página de agendar demo
                    navigate('/schedule-demo');
                  }}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1"
                >
                  Finalizar
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

export default SettingsDemo;
