import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Eye, 
  Activity, 
  Users, 
  Globe, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
// import { getSecurityStats } from '@/lib/security/security-monitor';

export default function SecurityDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    criticalEvents: 0,
    blockedIPs: 0,
    blockedUsers: 0,
    topThreats: [],
    topIPs: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadSecurityStats();
  }, [timeRange]);

  const loadSecurityStats = async () => {
    try {
      setLoading(true);
      // const data = await getSecurityStats(timeRange);
      // setStats(data);
      // Datos de ejemplo temporalmente
      setStats({
        totalEvents: 0,
        criticalEvents: 0,
        highEvents: 0,
        mediumEvents: 0,
        lowEvents: 0,
        blockedIPs: 0,
        failedLogins: 0,
        mfaAttempts: 0
      });
    } catch (error) {
      console.error('Error loading security stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              🛡️ Centro de Seguridad
            </h1>
            <p className="text-muted-foreground">
              Monitoreo y protección anti-hackeo en tiempo real
            </p>
          </div>
          
          <div className="flex gap-2">
            {(['24h', '7d', '30d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Totales</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Últimos {timeRange}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.criticalEvents}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención inmediata
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IPs Bloqueadas</CardTitle>
              <Globe className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.blockedIPs}</div>
              <p className="text-xs text-muted-foreground">
                Actividad maliciosa detectada
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Bloqueados</CardTitle>
              <Users className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.blockedUsers}</div>
              <p className="text-xs text-muted-foreground">
                Cuentas suspendidas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Amenazas y Actividad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Amenazas */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Principales Amenazas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topThreats.length > 0 ? (
                  stats.topThreats.map((threat: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {threat.eventType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {threat.count} ocurrencias
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive">
                        {threat.count}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No se detectaron amenazas</p>
                    <p className="text-sm">Sistema seguro</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top IPs */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                IPs Más Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topIPs.length > 0 ? (
                  stats.topIPs.map((ip: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Globe className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium font-mono">{ip.ip}</p>
                          <p className="text-sm text-muted-foreground">
                            {ip.count} requests
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {ip.count}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4" />
                    <p>No hay datos de IPs</p>
                    <p className="text-sm">Período seleccionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estado de Seguridad */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Estado General de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="font-semibold text-green-500 mb-2">MFA Activo</h3>
                <p className="text-sm text-muted-foreground">
                  Autenticación de dos factores habilitada
                </p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Shield className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="font-semibold text-blue-500 mb-2">Rate Limiting</h3>
                <p className="text-sm text-muted-foreground">
                  Protección DDoS activa
                </p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Activity className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="font-semibold text-purple-500 mb-2">Monitoreo 24/7</h3>
                <p className="text-sm text-muted-foreground">
                  Detección de intrusiones activa
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
