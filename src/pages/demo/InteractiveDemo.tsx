import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout";
import { enableDemoMode } from '@/lib/demoMode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from "@/features/dashboard/components/MetricCard";
import { StatusBadge } from "@/features/dashboard/components/StatusBadge";
import { CRMPipelineSimulation } from './components/CRMPipelineSimulation';
import { OrdersValidationSimulation } from './components/OrdersValidationSimulation';
import { OrdersManagementSimulation } from './components/OrdersManagementSimulation';
import { ChatSimulation } from './components/ChatSimulation';
import { LeadsSimulation } from './components/LeadsSimulation';
import { TrackingSimulation } from './components/TrackingSimulation';
import { AnalyticsSimulation } from './components/AnalyticsSimulation';
import { ValidationSimulation } from './components/ValidationSimulation';
import { StudioIASimulation } from './components/StudioIASimulation';
import { SettingsSimulation } from './components/SettingsSimulation';
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
  Package,
  Zap,
  ChevronRight,
  ArrowLeft,
  ShoppingBag,
  UserCheck,
  Sparkles,
  X,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const InteractiveDemo = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // Activamos el modo demo: el sidebar mapea sus links a rutas /*-demo
  // y ProtectedRoute deja pasar al usuario sin redirigirlo a login.
  useEffect(() => {
    enableDemoMode();
  }, []);

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
    { label: "WhatsApp (Meta API)", status: "Próximamente", icon: MessageSquare, count: "—" }
  ];

  const getCurrentSectionInfo = () => {
    const currentStep = dashboardGuideSteps.find(step => step.section === activeSection);
    return currentStep || dashboardGuideSteps[0];
  };

  const renderValidationContent = () => <ValidationSimulation />;

  const renderStudioIAContent = () => <StudioIASimulation />;

  const renderCRMContent = () => <CRMPipelineSimulation />;

  const renderOrdersContent = () => <OrdersManagementSimulation />;

  const renderOrderValidationContent = () => <OrdersValidationSimulation />;

  const renderChatContent = () => <ChatSimulation />;

  const renderLeadsContent = () => <LeadsSimulation />;

  const renderTrackingContent = () => <TrackingSimulation />;

  const renderAnalyticsContent = () => <AnalyticsSimulation />;

  const renderSettingsContent = () => <SettingsSimulation />;

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
        return renderOrdersContent();
      case 'order-validation':
        return renderOrderValidationContent();
      case 'studio-ia':
        return renderStudioIAContent();
      case 'chat':
        return renderChatContent();
      case 'leads':
        return renderLeadsContent();
      case 'tracking':
        return renderTrackingContent();
      case 'analytics':
        return renderAnalyticsContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderDefaultContent('dashboard');
    }
  };

  // Modal de bienvenida
  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl bg-gray-900/95 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-6">
              <div
                className="text-3xl font-black text-emerald-400 transition-all duration-300 tracking-wider uppercase"
                style={{
                  fontFamily: "'Orbitron', 'Arial Black', sans-serif",
                  fontWeight: 900,
                  letterSpacing: '0.15em',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                  transform: 'skew(-3deg)',
                  display: 'inline-block',
                  filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))',
                }}
              >
                NOMADEV.IO
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-3 text-white">¡Bienvenido a NOMADEV.IO!</CardTitle>
            <p className="text-gray-400 text-lg">
              Descubre la revolución en validación de pedidos y automatización de procesos
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full mb-4">
                <BarChart3 className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-gray-400">
                Experimenta la plataforma más avanzada para validación de clientes, integración con Shopify,
                chat automatizado y gestión de leads. Optimiza tu negocio con tecnología de vanguardia.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 text-base font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Explorar Demo
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setShowGuide(true);
                }}
                variant="outline"
                className="flex-1 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 py-3 text-base font-semibold transition-all"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Guía Interactiva
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
      <DemoToolSelector
        sections={navigationSections}
        activeSection={activeSection}
        onChange={(s) => setActiveSection(s)}
      />
      <div className="mt-4">{renderMainContent()}</div>

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

// ============================================================================
// Selector de herramientas — barra sticky con todas las tools disponibles
// ============================================================================

interface DemoToolSelectorProps {
  sections: { title: string; section: string; icon: React.ComponentType<{ className?: string }> }[];
  activeSection: string;
  onChange: (section: string) => void;
}

const TOOLS_AVAILABLE = new Set([
  'dashboard',
  'crm',
  'orders',
  'order-validation',
  'chat',
  'leads',
  'tracking',
  'analytics',
  'validation',
  'studio-ia',
  'settings',
]);

const DemoToolSelector: React.FC<DemoToolSelectorProps> = ({ sections, activeSection, onChange }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Scroll automático para mantener la herramienta activa visible
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const activeBtn = el.querySelector<HTMLElement>(`[data-section="${activeSection}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSection]);

  return (
    <div className="sticky top-0 z-20 -mx-6 px-6 py-3 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Herramientas demo
        </div>
        <div
          ref={scrollerRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1 flex-1"
          style={{ scrollBehavior: 'smooth' }}
        >
          {sections.map((item) => {
            const Icon = item.icon;
            const isActive = item.section === activeSection;
            const isAvailable = TOOLS_AVAILABLE.has(item.section);
            return (
              <button
                key={item.section}
                data-section={item.section}
                onClick={() => onChange(item.section)}
                className={cn(
                  'group relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-gray-900/40 text-gray-300 border-gray-800 hover:bg-gray-800/60 hover:border-gray-700 hover:text-white',
                )}
                title={item.title}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.title}</span>
                {!isAvailable && (
                  <span className="ml-1 text-[9px] text-amber-400/80 font-semibold uppercase tracking-wide">
                    soon
                  </span>
                )}
                {isActive && (
                  <span className="ml-0.5 relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
