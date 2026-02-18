import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { 
  TrendingUp, 
  Shield, 
  MessageSquare, 
  Users, 
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings,
  Truck,
  Eye,
  Clock,
  Package,
  Zap,
  Activity,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  UserCheck,
  Sparkles,
  X,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const InteractiveDemo = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // Mapping de navegación con sus secciones
  const navigationSections = [
    { title: "Dashboard", section: "dashboard", icon: BarChart3 },
    { title: "Validador de Clientes", section: "validation", icon: Shield },
    { title: "CRM", section: "crm", icon: UserCheck },
    { title: "Gestión de Pedidos", section: "orders", icon: Package },
    { title: "Shopify Analytics", section: "analytics", icon: ShoppingBag },
    { title: "Studio IA", section: "studio-ia", icon: Sparkles },
    { title: "Chat en Vivo", section: "chat", icon: MessageSquare },
    { title: "Validación Pedidos", section: "order-validation", icon: CheckCircle },
    { title: "Seguimiento", section: "tracking", icon: Truck },
    { title: "Gestor de Leads", section: "leads", icon: Users },
    { title: "Configuración", section: "settings", icon: Settings },
  ];

  const dashboardGuideSteps = [
    {
      title: "Dashboard Principal",
      description: "Centro de control completo con métricas en tiempo real, análisis de rendimiento y monitoreo integral de tu negocio. Visualiza el crecimiento y optimiza tus estrategias.",
      section: "dashboard"
    },
    {
      title: "Validador de Clientes",
      description: "Tecnología avanzada de verificación que protege tu negocio contra fraudes. Valida automáticamente la autenticidad de tus clientes con precisión del 99.9%.",
      section: "validation"
    },
    {
      title: "CRM",
      description: "Sistema de gestión de relaciones con clientes que centraliza toda la información de tus clientes. Gestiona contactos, historial de interacciones y automatiza el seguimiento comercial.",
      section: "crm"
    },
    {
      title: "Gestión de Pedidos",
      description: "Plataforma integral para administrar todos tus pedidos desde la recepción hasta la entrega. Organiza inventario, procesa órdenes y optimiza la logística.",
      section: "orders"
    },
    {
      title: "Shopify Analytics",
      description: "Inteligencia de negocio profunda para tu tienda Shopify. Analiza tendencias, optimiza inventario y maximiza conversiones con datos en tiempo real.",
      section: "analytics"
    },
    {
      title: "Studio IA",
      description: "Hub de herramientas de Inteligencia Artificial para potenciar tu ecommerce. Genera imágenes de productos, optimiza precios, crea copywriting y construye sitios web con IA.",
      section: "studio-ia"
    },
    {
      title: "Chat en Vivo",
      description: "Solución de comunicación omnichannel con WhatsApp Business API. Automatiza respuestas, gestiona múltiples conversaciones y mejora la experiencia del cliente.",
      section: "chat"
    },
    {
      title: "Validación de Pedidos",
      description: "Sistema inteligente de procesamiento que reduce errores en un 95%. Valida automáticamente pedidos, verifica stock y optimiza el flujo de trabajo.",
      section: "order-validation"
    },
    {
      title: "Seguimiento",
      description: "Plataforma de tracking avanzada que mantiene a tus clientes informados. Monitorea envíos, predice entregas y mejora la satisfacción del cliente.",
      section: "tracking"
    },
    {
      title: "Gestor de Leads",
      description: "CRM inteligente que convierte visitantes en clientes. Segmenta audiencias, automatiza campañas y aumenta tu tasa de conversión hasta un 300%.",
      section: "leads"
    },
    {
      title: "Configuración",
      description: "Panel de control completo para personalizar tu experiencia. Configura integraciones, ajusta parámetros y optimiza el rendimiento del sistema.",
      section: "settings"
    }
  ];

  const metrics = [
    {
      title: "Ventas Hoy",
      value: "$0",
      change: { value: 0, type: "increase" as const },
      icon: DollarSign,
      color: "success" as const,
      description: "vs. ayer"
    },
    {
      title: "Clientes Validados",
      value: "0",
      change: { value: 0, type: "increase" as const },
      icon: Shield,
      color: "primary" as const,
      description: "últimas 24h"
    },
    {
      title: "Chats Activos",
      value: "0",
      change: { value: 0, type: "increase" as const },
      icon: MessageSquare,
      color: "warning" as const,
      description: "conversaciones"
    },
    {
      title: "Leads Calientes",
      value: "0",
      change: { value: 0, type: "decrease" as const },
      icon: Users,
      color: "primary" as const,
      description: "prontos a convertir"
    }
  ];

  const recentActivity: any[] = [];

  const quickActions = [
    {
      id: 'chat',
      title: 'Chat en Vivo',
      description: 'Gestionar conversaciones',
      icon: MessageSquare,
      color: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-cyan-400',
      action: () => setActiveSection('chat'),
    },
    {
      id: 'validate',
      title: 'Validar Clientes',
      description: 'Verificar nuevos clientes',
      icon: Shield,
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
      action: () => setActiveSection('validation'),
    },
    {
      id: 'shopify',
      title: 'Shopify Analytics',
      description: 'Ver métricas de tienda',
      icon: ShoppingCart,
      color: 'from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-400',
      action: () => setActiveSection('analytics'),
    },
    {
      id: 'leads',
      title: 'Gestor de Leads',
      description: 'Administrar prospectos',
      icon: Users,
      color: 'from-orange-500/20 to-yellow-500/20',
      iconColor: 'text-orange-400',
      action: () => setActiveSection('leads'),
    },
    {
      id: 'tracking',
      title: 'Seguimiento',
      description: 'Rastrear envíos',
      icon: Truck,
      color: 'from-indigo-500/20 to-blue-500/20',
      iconColor: 'text-indigo-400',
      action: () => setActiveSection('tracking'),
    },
    {
      id: 'settings',
      title: 'Configuración',
      description: 'Ajustes del sistema',
      icon: Settings,
      color: 'from-gray-500/20 to-slate-500/20',
      iconColor: 'text-gray-400',
      action: () => setActiveSection('settings'),
    },
  ];

  const systemStatus = [
    { label: "Validador N8N", status: "Operativo", icon: Shield, count: "127 validaciones hoy" },
    { label: "Shopify Sync", status: "Sincronizado", icon: ShoppingCart, count: "Actualizado hace 2 min" },
    { label: "Evolution API", status: "Conectado", icon: MessageSquare, count: "23 chats activos" }
  ];

  const getCurrentSectionInfo = () => {
    const currentStep = dashboardGuideSteps.find(step => step.section === activeSection);
    return currentStep || dashboardGuideSteps[0];
  };

  const renderValidationContent = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Validador de Clientes</h1>
        <p className="text-muted-foreground">Sistema de verificación automática de datos de clientes</p>
      </div>

      {/* Métricas del Validador */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Clientes Validados"
          value="2,847"
          change={{ value: 15.3, type: "increase" }}
          icon={Shield}
          color="success"
          description="este mes"
        />
        <MetricCard
          title="Fraudes Detectados"
          value="23"
          change={{ value: 8.2, type: "decrease" }}
          icon={AlertTriangle}
          color="warning"
          description="bloqueados"
        />
        <MetricCard
          title="Tasa de Precisión"
          value="99.9%"
          change={{ value: 0.1, type: "increase" }}
          icon={CheckCircle}
          color="success"
          description="exactitud"
        />
        <MetricCard
          title="Validaciones Hoy"
          value="156"
          change={{ value: 12.7, type: "increase" }}
          icon={Activity}
          color="primary"
          description="en proceso"
        />
      </div>

      {/* Panel de Validación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Validación en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Email Verificado', 'Teléfono Validado', 'Documento Verificado'].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="text-foreground">{item}</span>
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">IP Sospechosa Detectada</p>
                <p className="text-xs text-muted-foreground">192.168.1.100 - 2 intentos fallidos</p>
              </div>
              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning font-medium">Email Duplicado</p>
                <p className="text-xs text-muted-foreground">usuario@ejemplo.com ya registrado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStudioIAContent = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Studio IA</h1>
        <p className="text-muted-foreground">Hub de herramientas de Inteligencia Artificial para potenciar tu ecommerce</p>
      </div>

      {/* Herramientas de IA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Generador de Imágenes', icon: Sparkles, color: 'from-purple-500 to-pink-500', available: true },
          { title: 'Copywriting IA', icon: MessageSquare, color: 'from-blue-500 to-cyan-500', available: true },
          { title: 'Optimizador de Precios', icon: DollarSign, color: 'from-green-500 to-emerald-500', available: true },
          { title: 'Identidad de Marca', icon: Users, color: 'from-orange-500 to-red-500', available: true },
          { title: 'Website Builder', icon: BarChart3, color: 'from-indigo-500 to-purple-500', available: true },
          { title: 'Constructor de Chatbots', icon: Zap, color: 'from-gray-500 to-gray-600', available: false },
        ].map((tool, index) => (
          <Card key={index} className="glass-card hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.color} bg-opacity-20`}>
                  <tool.icon className="h-6 w-6 text-white" />
                </div>
                <Badge className={tool.available ? "bg-success" : "bg-warning"}>
                  {tool.available ? "Disponible" : "Próximamente"}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
              <p className="text-muted-foreground text-sm">
                {tool.available ? "Herramienta activa y lista para usar" : "Pronto disponible"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estadísticas de IA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { value: '95%', label: 'Reducción en tiempo', color: 'text-success' },
          { value: '300%', label: 'Aumento en conversiones', color: 'text-primary' },
          { value: '24/7', label: 'Disponibilidad', color: 'text-warning' },
        ].map((stat, index) => (
          <Card key={index} className="glass-card text-center">
            <CardContent className="p-6">
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <p className="text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCRMContent = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">CRM</h1>
        <p className="text-muted-foreground">Sistema de gestión de relaciones con clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Clientes Totales" value="2,847" change={{ value: 15.3, type: "increase" }} icon={Users} color="success" description="activos" />
        <MetricCard title="Oportunidades" value="156" change={{ value: 8.2, type: "increase" }} icon={TrendingUp} color="primary" description="en pipeline" />
        <MetricCard title="Tasa de Conversión" value="23.4%" change={{ value: 2.1, type: "increase" }} icon={CheckCircle} color="success" description="mes actual" />
        <MetricCard title="Valor Promedio" value="$1,247" change={{ value: 12.7, type: "increase" }} icon={DollarSign} color="success" description="por cliente" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Pipeline de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Prospectos', count: 45, color: 'bg-blue-500' },
                { label: 'Calificados', count: 23, color: 'bg-yellow-500' },
                { label: 'Propuesta', count: 12, color: 'bg-orange-500' },
                { label: 'Cerrados', count: 8, color: 'bg-success' },
              ].map((stage, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <span className="text-foreground">{stage.label}</span>
                  <Badge className={stage.color}>{stage.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 3).map((activity) => (
                <div key={activity.id} className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOrdersContent = () => (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Gestión de Pedidos</h1>
        <p className="text-muted-foreground">Plataforma integral para administrar todos tus pedidos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Pedidos Totales" value="1,247" change={{ value: 12.5, type: "increase" }} icon={Package} color="success" description="este mes" />
        <MetricCard title="Pendientes" value="89" change={{ value: 8.3, type: "decrease" }} icon={Clock} color="warning" description="por procesar" />
        <MetricCard title="Procesados" value="1,158" change={{ value: 15.2, type: "increase" }} icon={CheckCircle} color="success" description="completados" />
        <MetricCard title="Valor Total" value="$45,678" change={{ value: 22.1, type: "increase" }} icon={DollarSign} color="success" description="en ventas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Estado de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Nuevos', count: 23, color: 'bg-blue-500' },
                { label: 'En Proceso', count: 45, color: 'bg-yellow-500' },
                { label: 'Enviados', count: 67, color: 'bg-orange-500' },
                { label: 'Entregados', count: 1112, color: 'bg-success' },
              ].map((status, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <span className="text-foreground">{status.label}</span>
                  <Badge className={status.color}>{status.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Pedidos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: '#ORD-2024-001', customer: 'María González', amount: '$1,250', time: 'Hace 2 horas' },
                { id: '#ORD-2024-002', customer: 'Carlos López', amount: '$890', time: 'Hace 4 horas' },
                { id: '#ORD-2024-003', customer: 'Ana Martínez', amount: '$2,100', time: 'Hace 6 horas' },
              ].map((order, index) => (
                <div key={index} className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium">{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.customer} - {order.amount} - {order.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDefaultContent = (section: string) => {
    const sectionInfo = dashboardGuideSteps.find(step => step.section === section);
    const icons: { [key: string]: any } = {
      analytics: ShoppingBag,
      chat: MessageCircle,
      'order-validation': CheckCircle,
      tracking: Truck,
      leads: Users,
      settings: Settings,
    };
    const Icon = icons[section] || Sparkles;

    return (
      <div className="text-center py-12 space-y-6 animate-fade-in">
        <div className="flex items-center justify-center">
          <div className="p-6 rounded-full bg-primary/10">
            <Icon className="w-16 h-16 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold">{sectionInfo?.title}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{sectionInfo?.description}</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-6">
          Volver al Dashboard
        </Button>
      </div>
    );
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2">
                    Dashboard Principal
                  </h1>
                  <p className="text-muted-foreground">
                    Resumen completo de tu operación de dropshipping
                  </p>
                </div>
                <Badge className="bg-success">Demo Interactivo</Badge>
              </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <div key={metric.title} className="animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <MetricCard {...metric} />
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-2">
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Revenue vs Devoluciones</CardTitle>
                      <StatusBadge status="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Validador Activo
                      </StatusBadge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-muted/10 rounded-lg border border-dashed border-border">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Gráfico de Revenue vs Devoluciones</p>
                        <p className="text-sm text-muted-foreground">Se conectará con datos reales de Shopify</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-1">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors">
                          <div className="flex-shrink-0 mt-1">
                            {activity.type === "validation" && <Shield className="w-4 h-4 text-primary" />}
                            {activity.type === "sale" && <ShoppingCart className="w-4 h-4 text-success" />}
                            {activity.type === "chat" && <MessageSquare className="w-4 h-4 text-warning" />}
                            {activity.type === "alert" && <AlertTriangle className="w-4 h-4 text-destructive" />}
                            {activity.type === "lead" && <Users className="w-4 h-4 text-primary" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-5">
                              {activity.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.time}
                            </p>
                          </div>
                          
                          <StatusBadge status={activity.status} className="text-xs px-2 py-0.5">
                            {activity.status === "success" && "✓"}
                            {activity.status === "pending" && "●"}
                            {activity.status === "warning" && "!"}
                            {activity.status === "active" && "◆"}
                          </StatusBadge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {systemStatus.map((system, index) => (
                <Card key={index} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <system.icon className="w-5 h-5 text-primary" />
                      <h4 className="font-medium">{system.label}</h4>
                    </div>
                    <StatusBadge status="success">{system.status}</StatusBadge>
                    <p className="text-sm text-muted-foreground mt-2">
                      {system.count}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Acciones Rápidas
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Accede rápidamente a las funciones principales
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={action.action}
                        className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-background to-muted/20 p-6 text-left transition-all hover:scale-105 hover:shadow-lg hover:border-primary/50 animate-scale-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        
                        <div className="relative">
                          <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.color} mb-4 group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-6 h-6 ${action.iconColor}`} />
                          </div>
                          
                          <h4 className="font-semibold mb-1 flex items-center justify-between">
                            {action.title}
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                          </h4>
                          
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>

                        <div className="absolute inset-0 rounded-xl ring-2 ring-primary/0 group-hover:ring-primary/30 transition-all" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'validation':
        return renderValidationContent();
      case 'crm':
        return renderCRMContent();
      case 'orders':
      case 'order-validation':
        return renderOrdersContent();
      case 'studio-ia':
        return renderStudioIAContent();
      case 'analytics':
      case 'chat':
      case 'tracking':
      case 'leads':
      case 'settings':
        return renderDefaultContent(activeSection);
      default:
        return renderDefaultContent('dashboard');
    }
  };

  // Modal de bienvenida
  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl glass-card shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-6">
              <div
                className="text-3xl font-black text-primary transition-all duration-300 tracking-wider uppercase"
                style={{
                  fontFamily: "'Orbitron', 'Arial Black', sans-serif",
                  fontWeight: 900,
                  letterSpacing: '0.15em',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                  transform: 'skew(-3deg)',
                  display: 'inline-block',
                  filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))'
                }}
              >
                NOMADEV.IO
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-3">¡Bienvenido a NOMADEV.IO!</CardTitle>
            <p className="text-muted-foreground text-lg">Descubre la revolución en validación de pedidos y automatización de procesos</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Experimenta la plataforma más avanzada para validación de clientes, integración con Shopify, chat automatizado y gestión de leads. Optimiza tu negocio con tecnología de vanguardia.
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={() => setShowModal(false)}
                className="flex-1 bg-primary hover:bg-primary/90 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                🚀 Explorar Demo
              </Button>
              <Button 
                onClick={() => {
                  setShowModal(false);
                  setShowGuide(true);
                }}
                variant="outline"
                className="flex-1 py-3 text-lg font-semibold transition-all duration-300"
              >
                📖 Guía Interactiva
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Modal de guía
  if (showGuide) {
    const currentStep = dashboardGuideSteps[guideStep];
    return (
      <>
        <DashboardLayout>
          {renderMainContent()}
        </DashboardLayout>
        
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>🎯 Guía Interactiva de NOMADEV.IO</CardTitle>
                <Button
                  onClick={() => setShowGuide(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-2">{currentStep.title}</h3>
                <p className="text-muted-foreground">{currentStep.description}</p>
              </div>
              <div className="flex justify-between">
                <Button
                  onClick={() => {
                    if (guideStep > 0) {
                      const prevStep = guideStep - 1;
                      setGuideStep(prevStep);
                      setActiveSection(dashboardGuideSteps[prevStep].section);
                    }
                  }}
                  disabled={guideStep === 0}
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                <div className="flex space-x-2">
                  {dashboardGuideSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        index === guideStep ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <Button
                  onClick={() => {
                    if (guideStep < dashboardGuideSteps.length - 1) {
                      const nextStep = guideStep + 1;
                      setGuideStep(nextStep);
                      setActiveSection(dashboardGuideSteps[nextStep].section);
                    } else {
                      setShowGuide(false);
                      setActiveSection('dashboard');
                    }
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  {guideStep < dashboardGuideSteps.length - 1 ? (
                    <>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    'Finalizar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Vista principal del demo
  return (
    <DashboardLayout>
      {renderMainContent()}

      {/* Botón flotante de navegación */}
      {!showModal && !showGuide && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20"></div>
            <Button
              onClick={() => {
                try {
                  const currentIndex = navigationSections.findIndex(item => item.section === activeSection);
                  const nextIndex = (currentIndex + 1) % navigationSections.length;
                  const nextItem = navigationSections[nextIndex];
                  setActiveSection(nextItem.section);
                  setTimeout(() => setShowInfoTooltip(true), 300);
                } catch (error) {
                  console.error('Error al navegar:', error);
                  setActiveSection('dashboard');
                }
              }}
              className="relative bg-primary hover:bg-primary/90 text-white rounded-full w-14 h-14 shadow-2xl hover:shadow-primary/25 transition-all duration-300"
              title="Ir a la siguiente herramienta"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            
            {showInfoTooltip && (
              <div className="absolute bottom-16 right-0 w-80 glass-card border border-border rounded-lg shadow-2xl p-4 z-50">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold">{getCurrentSectionInfo().title}</h3>
                  <Button
                    onClick={() => setShowInfoTooltip(false)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
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
                    className="text-xs"
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      try {
                        setShowInfoTooltip(false);
                        const currentIndex = navigationSections.findIndex(item => item.section === activeSection);
                        const nextIndex = (currentIndex + 1) % navigationSections.length;
                        const nextItem = navigationSections[nextIndex];
                        setActiveSection(nextItem.section);
                        setTimeout(() => setShowInfoTooltip(true), 300);
                      } catch (error) {
                        console.error('Error al navegar:', error);
                        setActiveSection('dashboard');
                        setShowInfoTooltip(false);
                      }
                    }}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-xs flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InteractiveDemo;
