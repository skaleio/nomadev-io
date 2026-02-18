import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  MessageSquare,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Activity,
  Shield,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';

export default function Dashboard() {
  useAuth();
  const navigate = useNavigate();

  const systemMetrics = useMemo(
    () => [
      {
        title: 'Usuarios Activos',
        value: '0',
        change: { value: 0, type: 'increase' as const },
        icon: Users,
        color: 'primary' as const,
      },
      {
        title: 'Validaciones Hoy',
        value: '0',
        change: { value: 0, type: 'increase' as const },
        icon: Shield,
        color: 'success' as const,
      },
      {
        title: 'Chats Activos',
        value: '0',
        change: { value: 0, type: 'increase' as const },
        icon: MessageSquare,
        color: 'warning' as const,
      },
      {
        title: 'Revenue Total',
        value: '$0',
        change: { value: 0, type: 'increase' as const },
        icon: DollarSign,
        color: 'success' as const,
      },
    ],
    []
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                ¡Bienvenido a NOMADEV!
              </h1>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Sistema Activo
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemMetrics.map((metric, index) => (
            <div
              key={metric.title}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <MetricCard {...metric} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Pedidos Validados',
              value: '0',
              change: { value: 0, type: 'increase' as const },
              icon: CheckCircle,
              color: 'success' as const,
            },
            {
              title: 'Conversaciones',
              value: '0',
              change: { value: 0, type: 'increase' as const },
              icon: MessageSquare,
              color: 'primary' as const,
            },
            {
              title: 'Ventas Generadas',
              value: '$0',
              change: { value: 0, type: 'increase' as const },
              icon: DollarSign,
              color: 'success' as const,
            },
            {
              title: 'Tasa de Éxito',
              value: '0%',
              change: { value: 0, type: 'increase' as const },
              icon: TrendingUp,
              color: 'primary' as const,
            },
          ].map((metric, index) => (
            <div
              key={metric.title}
              className="animate-scale-in"
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              <MetricCard {...metric} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>Estado del Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">WhatsApp Business API</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Conectado
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shopify Integration</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Activo
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Base de Datos</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Acciones Rápidas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate('/chat')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat en Vivo
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate('/validation')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validar Clientes
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate('/shopify')}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Shopify Analytics
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate('/leads')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Gestor de Leads
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate('/settings')}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
