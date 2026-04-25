import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  TrendingUp,
  Users,
  MessageSquare,
  ShoppingCart,
  CheckCircle,
  DollarSign,
  Activity,
  Shield,
  Package,
  Megaphone,
  MapPin,
  Truck,
  Sparkles,
  Bot,
  Image as ImageIcon,
  Globe,
  Lock,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import {
  computeDropiMetrics,
  formatRoas,
  type DropiOrderForMetrics,
} from '@/lib/computeDropiMetrics';

type DropiOrderRow = Tables<'dropi_orders'>;

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dropiOrders, setDropiOrders] = useState<DropiOrderRow[]>([]);
  const [metaSpend, setMetaSpend] = useState(0);
  const [loadingDropi, setLoadingDropi] = useState(false);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return { from: isoLocal(from), to: isoLocal(to) };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    setLoadingDropi(true);
    (async () => {
      const [{ data: orders }, { data: meta }] = await Promise.all([
        supabase
          .from('dropi_orders')
          .select('*')
          .eq('user_id', user.id)
          .gte('order_date', range.from)
          .lte('order_date', range.to)
          .order('order_date', { ascending: false }),
        supabase
          .from('dropi_meta_spend_snapshots')
          .select('meta_ad_spend')
          .eq('user_id', user.id)
          .eq('period_start', range.from)
          .eq('period_end', range.to)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setDropiOrders((orders ?? []) as DropiOrderRow[]);
      const metaRow = (meta ?? null) as { meta_ad_spend: number | null } | null;
      setMetaSpend(metaRow?.meta_ad_spend ?? 0);
      setLoadingDropi(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, range.from, range.to]);

  const metrics = useMemo(() => {
    return computeDropiMetrics(dropiOrders as DropiOrderForMetrics[], metaSpend);
  }, [dropiOrders, metaSpend]);

  const total = metrics.totalPedidos;
  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : '0%');

  const hasData = total > 0;

  const lockedShortcuts: Array<{ label: string; icon: typeof Sparkles; note: string }> = [
    { label: 'Studio IA', icon: Sparkles, note: 'Imagen + copy + logo en beta privada.' },
    { label: 'Constructor de Agentes', icon: Bot, note: 'Agentes IA con WhatsApp en beta.' },
    { label: 'Generador de Imágenes', icon: ImageIcon, note: 'Producto + lifestyle a un clic.' },
    { label: 'Website Builder', icon: Globe, note: 'Landings de producto auto-generadas.' },
  ];

  const showLockedToast = (label: string, note: string) =>
    toast(`${label} — Próximamente`, { description: note });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">¡Bienvenido a NOMADEV!</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Centro de control de tus pedidos COD y rentabilidad. Últimos 30 días: {range.from} → {range.to}
              </p>
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

        {!hasData && !loadingDropi && (
          <Card className="border-dashed">
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Empieza importando tus pedidos Dropi
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  Sube el .xlsx de Dropi y registra tu gasto en Meta del periodo. Dashboard, ROAS, CPA y precio
                  sugerido se calculan al instante.
                </p>
              </div>
              <Button onClick={() => navigate('/orders')}>
                <Package className="w-4 h-4 mr-2" /> Ir a Gestión de Pedidos
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total pedidos (30d)"
            value={String(metrics.totalPedidos)}
            icon={Package}
            color="primary"
            loading={loadingDropi}
          />
          <MetricCard
            title="Entregados"
            value={`${metrics.counts.entregados} (${pct(metrics.counts.entregados)})`}
            icon={CheckCircle}
            color="success"
            loading={loadingDropi}
          />
          <MetricCard
            title="Ganancia real"
            value={formatMoney(metrics.gananciaReal)}
            icon={TrendingUp}
            color="success"
            description="Solo pedidos entregados"
            loading={loadingDropi}
          />
          <MetricCard
            title="Inversión Meta"
            value={formatMoney(metrics.inversionMeta)}
            icon={Megaphone}
            color="warning"
            description="Gasto en ads del periodo"
            loading={loadingDropi}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="ROAS real"
            value={formatRoas(metrics.roasReal)}
            icon={TrendingUp}
            color="primary"
            description="Ganancia real / ads"
            loading={loadingDropi}
          />
          <MetricCard
            title="CPA"
            value={metrics.cpa != null ? formatMoney(metrics.cpa) : '—'}
            icon={Shield}
            color="primary"
            description="Coste por pedido entregado"
            loading={loadingDropi}
          />
          <MetricCard
            title="AOV"
            value={formatMoney(metrics.aov)}
            icon={DollarSign}
            color="primary"
            description="Ticket promedio"
            loading={loadingDropi}
          />
          <MetricCard
            title="Top región (entregados)"
            value={metrics.topRegionEntregados?.label ?? '—'}
            icon={MapPin}
            color="primary"
            description={
              metrics.topRegionEntregados
                ? `${metrics.topRegionEntregados.count} entregados`
                : 'Sin datos'
            }
            loading={loadingDropi}
          />
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
                  <span className="text-sm">Importador Dropi</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Activo
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Métricas COD (Meta + Dropi)</span>
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
                  onClick={() => navigate('/orders')}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Importar pedidos Dropi
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate('/settings')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
                <Button
                  className="w-full justify-start opacity-70"
                  variant="outline"
                  onClick={() =>
                    showLockedToast('Chat en Vivo', 'Chat omnicanal en beta privada.')
                  }
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat en Vivo
                  <Lock className="w-3 h-3 ml-auto text-amber-500" />
                </Button>
                <Button
                  className="w-full justify-start opacity-70"
                  variant="outline"
                  onClick={() =>
                    showLockedToast(
                      'Validador de Clientes',
                      'Validación con IA en pruebas privadas.',
                    )
                  }
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validar Clientes
                  <Lock className="w-3 h-3 ml-auto text-amber-500" />
                </Button>
                <Button
                  className="w-full justify-start opacity-70"
                  variant="outline"
                  onClick={() =>
                    showLockedToast(
                      'Shopify Analytics',
                      'Dashboard nativo Shopify llega muy pronto.',
                    )
                  }
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Shopify Analytics
                  <Lock className="w-3 h-3 ml-auto text-amber-500" />
                </Button>
                <Button
                  className="w-full justify-start opacity-70"
                  variant="outline"
                  onClick={() =>
                    showLockedToast('Gestor de Leads', 'Pipeline con scoring automático en construcción.')
                  }
                >
                  <Users className="w-4 h-4 mr-2" />
                  Gestor de Leads
                  <Lock className="w-3 h-3 ml-auto text-amber-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Próximamente en NOMADEV
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Estamos desplegando estas herramientas para tu cuenta. Tus pedidos Dropi se beneficiarán
              automáticamente cuando se activen.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {lockedShortcuts.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => showLockedToast(s.label, s.note)}
                  className="text-left rounded-xl border border-dashed border-emerald-500/30 bg-background/40 p-4 hover:bg-background/70 transition-colors relative"
                >
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-amber-500/90 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
                    <Lock className="w-3 h-3" /> Pronto
                  </div>
                  <s.icon className="w-6 h-6 text-emerald-500 mb-2" />
                  <div className="font-semibold text-foreground">{s.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.note}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
