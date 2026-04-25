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
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Bienvenido a Nomadev
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Centro de control de pedidos COD y rentabilidad · Últimos 30 días{' '}
              <span className="font-medium text-foreground/80 tabular-nums">
                {range.from} → {range.to}
              </span>
            </p>
          </div>
          <Badge variant="success">
            <CheckCircle className="size-3" />
            Sistema activo
          </Badge>
        </div>

        {!hasData && !loadingDropi && (
          <Card className="border-dashed border-primary/30 bg-primary/[0.03]">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                  <Package className="size-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    Empieza importando tus pedidos Dropi
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Sube el .xlsx de Dropi y registra tu gasto en Meta del periodo. Dashboard, ROAS,
                    CPA y precio sugerido se calculan al instante.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/orders')}>
                Ir a Gestión de Pedidos
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="ROAS real"
            value={formatRoas(metrics.roasReal)}
            icon={TrendingUp}
            color="info"
            description="Ganancia real / ads"
            loading={loadingDropi}
          />
          <MetricCard
            title="CPA"
            value={metrics.cpa != null ? formatMoney(metrics.cpa) : '—'}
            icon={Shield}
            color="info"
            description="Coste por pedido entregado"
            loading={loadingDropi}
          />
          <MetricCard
            title="AOV"
            value={formatMoney(metrics.aov)}
            icon={DollarSign}
            color="info"
            description="Ticket promedio"
            loading={loadingDropi}
          />
          <MetricCard
            title="Top región (entregados)"
            value={metrics.topRegionEntregados?.label ?? '—'}
            icon={MapPin}
            color="info"
            description={
              metrics.topRegionEntregados
                ? `${metrics.topRegionEntregados.count} entregados`
                : 'Sin datos'
            }
            loading={loadingDropi}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4 text-success" strokeWidth={2} />
                Estado del sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Importador Dropi', status: 'Activo' },
                { label: 'Métricas COD (Meta + Dropi)', status: 'Activo' },
                { label: 'Base de datos', status: 'Online' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-3 py-2"
                >
                  <span className="text-sm text-foreground/90">{item.label}</span>
                  <Badge variant="success">
                    <CheckCircle className="size-3" />
                    {item.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4 text-primary" strokeWidth={2} />
                Acciones rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/orders')}
                >
                  <Package className="size-4" />
                  Importar pedidos
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/settings')}
                >
                  <Shield className="size-4" />
                  Configuración
                </Button>
                {[
                  {
                    icon: MessageSquare,
                    label: 'Chat en Vivo',
                    note: 'Chat omnicanal en beta privada.',
                  },
                  {
                    icon: CheckCircle,
                    label: 'Validar Clientes',
                    note: 'Validación con IA en pruebas privadas.',
                  },
                  {
                    icon: ShoppingCart,
                    label: 'Shopify Analytics',
                    note: 'Dashboard nativo Shopify llega muy pronto.',
                  },
                  {
                    icon: Users,
                    label: 'Gestor de Leads',
                    note: 'Pipeline con scoring automático en construcción.',
                  },
                ].map((s) => (
                  <Button
                    key={s.label}
                    className="w-full justify-start text-muted-foreground"
                    variant="outline"
                    size="sm"
                    onClick={() => showLockedToast(s.label, s.note)}
                  >
                    <s.icon className="size-4" />
                    <span className="flex-1 text-left">{s.label}</span>
                    <Lock className="size-3 text-warning" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" strokeWidth={2} />
              Próximamente en Nomadev
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Estamos desplegando estas herramientas para tu cuenta. Tus pedidos Dropi se beneficiarán
              automáticamente cuando se activen.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {lockedShortcuts.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => showLockedToast(s.label, s.note)}
                  className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 text-left transition-all duration-base ease-standard hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-elev-1"
                >
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-warning/25 bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
                    <Lock className="size-2.5" />
                    Soon
                  </div>
                  <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 transition-transform duration-base group-hover:scale-105">
                    <s.icon className="size-[18px]" strokeWidth={1.75} />
                  </div>
                  <div className="text-sm font-semibold tracking-tight text-foreground">{s.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.note}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
