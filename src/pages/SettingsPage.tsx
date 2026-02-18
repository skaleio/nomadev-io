import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Database, Zap, MessageSquare, Users, ShoppingBag, Globe, Shield, Bell, Wifi, WifiOff, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  // Integraciones principales del SaaS
  const integrations = [
    {
      name: "Shopify Integration",
      description: "Conectar tiendas y sincronizar pedidos",
      icon: ShoppingBag,
      status: "pending" as const,
      action: "Conectar Tienda"
    },
    {
      name: "WhatsApp",
      description: "WhatsApp Business para chat en tiempo real",
      icon: MessageSquare,
      status: "connected" as const,
      action: "Configurar"
    }
  ];

  // Configuraciones del sistema
  const systemConfigs = [
    {
      name: "Validación Automática",
      description: "Activar validación automática de pedidos",
      icon: Shield,
      enabled: true,
      type: "toggle"
    },
    {
      name: "Notificaciones Push",
      description: "Recibir notificaciones de nuevos pedidos",
      icon: Bell,
      enabled: false,
      type: "toggle"
    },
    {
      name: "Chat Automático",
      description: "Respuestas automáticas en WhatsApp",
      icon: MessageSquare,
      enabled: true,
      type: "toggle"
    },
    {
      name: "Backup Automático",
      description: "Respaldo diario de datos",
      icon: Database,
      enabled: true,
      type: "toggle"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Configuración del Sistema
          </h1>
          <p className="text-muted-foreground">
            Gestiona integraciones, configuraciones y parámetros de NOMADEV.IO
          </p>
        </div>

        {/* Estado del Sistema */}
        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">Sistema Activo</h4>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Todos los servicios funcionando</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <MessageSquare className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">WhatsApp API</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">WhatsApp activo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Usuario */}
        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Información del Usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userId" className="text-sm text-muted-foreground">ID de Usuario</Label>
                  <Input
                    id="userId"
                    value={user?.id || "8e8ad03b-1d1c-4442-8998-a802c56a536e"}
                    readOnly
                    className="mt-1 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName" className="text-sm text-muted-foreground">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    value={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Antonio Rodriguez"}
                    readOnly
                    className="mt-1 bg-muted/50 font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || "17antoniomro@gmail.com"}
                    readOnly
                    className="mt-1 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="text-sm text-muted-foreground">Estado</Label>
                  <div className="mt-1">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activo
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integraciones Principales */}
        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Integraciones del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-4 bg-muted/5 rounded-lg border border-border/50 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border ${
                      integration.status === 'connected' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' 
                        : 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
                    }`}>
                      <integration.icon className={`w-5 h-5 ${
                        integration.status === 'connected' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{integration.name}</h4>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{integration.details}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <StatusBadge status={integration.status}>
                      {integration.status === "pending" ? "Pendiente" : "Conectado"}
                    </StatusBadge>
                    <Button variant="outline" size="sm">
                      {integration.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuraciones del Sistema */}
        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Configuraciones del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemConfigs.map((config) => (
                <div key={config.name} className="flex items-center justify-between p-4 bg-muted/5 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                      <config.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{config.name}</h4>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={config.enabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"}>
                      {config.enabled ? "Activado" : "Desactivado"}
                    </Badge>
                    <Button variant="outline" size="sm">
                      {config.enabled ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones Importantes */}
        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <AlertTriangle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Acciones Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <ShoppingBag className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Conectar Shopify</h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-3">
                      Conecta tu tienda Shopify para sincronizar pedidos y productos automáticamente.
                    </p>
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Conectar Tienda
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Conectar WhatsApp</h4>
                    <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                      Conecta tu número de WhatsApp Business para comenzar a chatear con tus clientes.
                    </p>
                    <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Conectar WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}