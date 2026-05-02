import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  CheckCircle,
  Clock,
  X,
  AlertCircle,
  ShoppingBag,
  MessageCircle,
  Truck,
  Pause,
  Play,
  Zap,
  TrendingUp,
} from 'lucide-react';

type OrderStatus = 'pending' | 'validating' | 'validated' | 'rejected' | 'shipped';
type Priority = 'high' | 'medium' | 'low';

interface SimOrder {
  id: string;
  orderNumber: string;
  customer: string;
  customerInitials: string;
  amount: number;
  itemsCount: number;
  topItem: string;
  status: OrderStatus;
  priority: Priority;
  createdAt: number;
  updatedAt: number;
  channel: 'WhatsApp' | 'Shopify' | 'Instagram' | 'Web';
  city: string;
  validationReason?: string;
  rejectReason?: string;
}

const CUSTOMER_POOL: { name: string; city: string }[] = [
  { name: 'María González', city: 'Santiago' },
  { name: 'Carlos Ruiz', city: 'Valparaíso' },
  { name: 'Ana Martínez', city: 'Concepción' },
  { name: 'Luis Pérez', city: 'Antofagasta' },
  { name: 'Sofía López', city: 'Viña del Mar' },
  { name: 'Miguel Torres', city: 'La Serena' },
  { name: 'Elena Vargas', city: 'Temuco' },
  { name: 'Roberto Silva', city: 'Iquique' },
  { name: 'Camila Reyes', city: 'Rancagua' },
  { name: 'Diego Herrera', city: 'Puerto Montt' },
  { name: 'Valentina Castro', city: 'Talca' },
  { name: 'Javier Morales', city: 'Arica' },
];

const PRODUCT_POOL = [
  'Zapatillas Running Pro',
  'Polera Oversize Premium',
  'Mochila Urbana 25L',
  'Chaqueta Impermeable',
  'Smartwatch Active 5',
  'Audífonos Wireless Pro',
  'Termo Acero 750ml',
  'Botellón Hidratante',
  'Cargador Inalámbrico',
  'Lente Solar Polarizado',
];

const CHANNELS: SimOrder['channel'][] = ['WhatsApp', 'Shopify', 'Instagram', 'Web'];

const VALIDATION_REASONS = [
  'Dirección confirmada vía WhatsApp',
  'Talla y color verificados con cliente',
  'Pago COD confirmado',
  'Cliente disponible para recibir',
  'Datos completos validados',
];

const REJECT_REASONS = [
  'Cliente no responde tras 3 intentos',
  'Producto fuera de stock',
  'Dirección incompleta',
  'Cliente canceló por WhatsApp',
];

const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const relativeTime = (timestamp: number) => {
  const diff = Math.max(0, Date.now() - timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const buildOrder = (id: number): SimOrder => {
  const customer = CUSTOMER_POOL[Math.floor(Math.random() * CUSTOMER_POOL.length)];
  const itemsCount = 1 + Math.floor(Math.random() * 5);
  const baseAmount = 12_000 + Math.floor(Math.random() * 90_000);
  const priorities: Priority[] = ['high', 'medium', 'medium', 'low'];
  return {
    id: `o-${Date.now()}-${id}`,
    orderNumber: `#NMD-${(20000 + id).toString().padStart(5, '0')}`,
    customer: customer.name,
    customerInitials: initials(customer.name),
    amount: baseAmount * itemsCount,
    itemsCount,
    topItem: PRODUCT_POOL[Math.floor(Math.random() * PRODUCT_POOL.length)],
    status: 'pending',
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    channel: CHANNELS[Math.floor(Math.random() * CHANNELS.length)],
    city: customer.city,
  };
};

const buildInitialOrders = (): SimOrder[] => {
  const orders: SimOrder[] = [];
  let counter = 0;
  // 3 pendientes
  for (let i = 0; i < 3; i++) {
    const o = buildOrder(counter++);
    o.createdAt = Date.now() - (i + 1) * 35_000;
    o.updatedAt = o.createdAt;
    orders.push(o);
  }
  // 4 validados
  for (let i = 0; i < 4; i++) {
    const o = buildOrder(counter++);
    o.status = 'validated';
    o.validationReason = VALIDATION_REASONS[i % VALIDATION_REASONS.length];
    o.createdAt = Date.now() - (i + 4) * 60_000;
    o.updatedAt = Date.now() - (i + 1) * 25_000;
    orders.push(o);
  }
  // 1 rechazado
  const rejected = buildOrder(counter++);
  rejected.status = 'rejected';
  rejected.rejectReason = REJECT_REASONS[0];
  rejected.createdAt = Date.now() - 5 * 60_000;
  rejected.updatedAt = Date.now() - 90_000;
  orders.push(rejected);

  return orders;
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: 'Pendiente', bg: 'bg-amber-500/15', text: 'text-amber-300', icon: Clock },
  validating: { label: 'Validando…', bg: 'bg-blue-500/15', text: 'text-blue-300', icon: MessageCircle },
  validated: { label: 'Validado', bg: 'bg-emerald-500/15', text: 'text-emerald-300', icon: CheckCircle },
  rejected: { label: 'Rechazado', bg: 'bg-red-500/15', text: 'text-red-300', icon: X },
  shipped: { label: 'Enviado', bg: 'bg-violet-500/15', text: 'text-violet-300', icon: Truck },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string }> = {
  high: { label: 'Alta', bg: 'bg-red-500/15', text: 'text-red-300' },
  medium: { label: 'Media', bg: 'bg-amber-500/15', text: 'text-amber-300' },
  low: { label: 'Baja', bg: 'bg-gray-500/15', text: 'text-gray-300' },
};

const CHANNEL_COLOR: Record<SimOrder['channel'], string> = {
  WhatsApp: 'text-emerald-400',
  Shopify: 'text-emerald-300',
  Instagram: 'text-pink-400',
  Web: 'text-sky-400',
};

interface OrdersValidationSimulationProps {
  intervalMs?: number;
}

export const OrdersValidationSimulation: React.FC<OrdersValidationSimulationProps> = ({
  intervalMs = 4000,
}) => {
  const [orders, setOrders] = useState<SimOrder[]>(() => buildInitialOrders());
  const [isPlaying, setIsPlaying] = useState(true);
  const counterRef = useRef(1000);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((v) => v + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // Motor de auto-progresión: cada tick, intentar avanzar un pedido
  useEffect(() => {
    if (!isPlaying) return;

    const tick = () => {
      setOrders((prev) => {
        const now = Date.now();
        const next = [...prev];

        // 1) Cualquier "validating" que lleve >2.5s pasa a validated/rejected
        let changed = false;
        for (let i = 0; i < next.length; i++) {
          const o = next[i];
          if (o.status === 'validating' && now - o.updatedAt > 2500) {
            const isApproved = Math.random() > 0.15;
            next[i] = {
              ...o,
              status: isApproved ? 'validated' : 'rejected',
              updatedAt: now,
              validationReason: isApproved
                ? VALIDATION_REASONS[Math.floor(Math.random() * VALIDATION_REASONS.length)]
                : undefined,
              rejectReason: isApproved
                ? undefined
                : REJECT_REASONS[Math.floor(Math.random() * REJECT_REASONS.length)],
            };
            changed = true;
            break;
          }
        }

        if (changed) return next;

        // 2) Avanzar el más antiguo de los pendientes a "validating"
        const pendingIdx = next
          .map((o, idx) => ({ o, idx }))
          .filter(({ o }) => o.status === 'pending')
          .sort((a, b) => a.o.createdAt - b.o.createdAt)[0];

        if (pendingIdx) {
          next[pendingIdx.idx] = {
            ...pendingIdx.o,
            status: 'validating',
            updatedAt: now,
          };
          return next;
        }

        // 3) Validados antiguos pasan a "shipped"
        const oldValidated = next
          .map((o, idx) => ({ o, idx }))
          .filter(({ o }) => o.status === 'validated' && now - o.updatedAt > 8000)[0];

        if (oldValidated) {
          next[oldValidated.idx] = {
            ...oldValidated.o,
            status: 'shipped',
            updatedAt: now,
          };
          return next;
        }

        return prev;
      });
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [isPlaying, intervalMs]);

  // Generar nuevos pedidos pendientes
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setOrders((prev) => {
        const pendingCount = prev.filter((o) => o.status === 'pending').length;
        if (pendingCount >= 5) return prev;
        const newOrder = buildOrder(counterRef.current++);
        // Limitar la lista a 12 elementos
        const trimmed = prev.length >= 12 ? prev.slice(0, 11) : prev;
        return [newOrder, ...trimmed];
      });
    }, 7000);
    return () => clearInterval(id);
  }, [isPlaying]);

  const grouped = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending' || o.status === 'validating');
    const recent = orders
      .filter((o) => o.status === 'validated' || o.status === 'rejected' || o.status === 'shipped')
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return { pending, recent };
  }, [orders]);

  const metrics = useMemo(() => {
    const validated = orders.filter((o) => o.status === 'validated' || o.status === 'shipped').length;
    const rejected = orders.filter((o) => o.status === 'rejected').length;
    const pending = orders.filter((o) => o.status === 'pending' || o.status === 'validating').length;
    const totalRevenue = orders
      .filter((o) => o.status === 'validated' || o.status === 'shipped')
      .reduce((sum, o) => sum + o.amount, 0);
    return { validated, rejected, pending, totalRevenue };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Validación de Pedidos</h1>
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Demo en vivo
            </Badge>
          </div>
          <p className="text-gray-400">
            Mira cómo los pedidos se validan automáticamente vía WhatsApp antes del envío.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsPlaying((p) => !p)}
          className="border-gray-700 hover:border-emerald-500/50"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pausar simulación
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Reanudar
            </>
          )}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-400 text-xs font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-white mt-1">{metrics.pending}</p>
              </div>
              <div className="rounded-lg bg-amber-500/15 p-2">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-400 text-xs font-medium">Validados</p>
                <p className="text-2xl font-bold text-white mt-1">{metrics.validated}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/15 p-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-400 text-xs font-medium">Rechazados</p>
                <p className="text-2xl font-bold text-white mt-1">{metrics.rejected}</p>
              </div>
              <div className="rounded-lg bg-red-500/15 p-2">
                <X className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-400 text-xs font-medium">Revenue confirmado</p>
                <p
                  className="text-2xl font-bold text-emerald-400 mt-1 truncate"
                  title={formatCLP(metrics.totalRevenue)}
                >
                  {formatCLP(metrics.totalRevenue)}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-500/15 p-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pendientes / Validando */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              En cola de validación
              <Badge className="bg-amber-500/15 text-amber-300 border-0 ml-2">
                {grouped.pending.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[400px]">
            <AnimatePresence initial={false} mode="popLayout">
              {grouped.pending.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 text-gray-500 text-sm"
                >
                  Todo validado · sin pedidos pendientes
                </motion.div>
              ) : (
                grouped.pending.map((order) => (
                  <OrderCard key={order.id} order={order} mode="pending" />
                ))
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Validados / Rechazados / Enviados */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Actividad reciente
              <Badge className="bg-gray-800 text-gray-300 border border-gray-700 ml-2 text-[10px] font-normal">
                automatizado
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[400px]">
            <AnimatePresence initial={false} mode="popLayout">
              {grouped.recent.length === 0 ? (
                <motion.div
                  key="empty-recent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 text-gray-500 text-sm"
                >
                  Esperando primera validación…
                </motion.div>
              ) : (
                grouped.recent.slice(0, 8).map((order) => (
                  <OrderCard key={order.id} order={order} mode="recent" />
                ))
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: SimOrder;
  mode: 'pending' | 'recent';
}

const OrderCard: React.FC<OrderCardProps> = ({ order, mode }) => {
  const statusConfig = STATUS_CONFIG[order.status];
  const priorityConfig = PRIORITY_CONFIG[order.priority];
  const StatusIcon = statusConfig.icon;
  const channelColor = CHANNEL_COLOR[order.channel];

  return (
    <motion.div
      layout
      layoutId={order.id}
      initial={{ opacity: 0, x: mode === 'pending' ? -10 : 10, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, height: 0, marginTop: 0 }}
      transition={{
        layout: { type: 'spring', stiffness: 320, damping: 32 },
        duration: 0.3,
      }}
      className={`rounded-lg border p-3 ${
        order.status === 'validating'
          ? 'border-blue-500/40 bg-blue-500/5'
          : order.status === 'rejected'
            ? 'border-red-500/30 bg-red-500/5'
            : order.status === 'validated'
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : order.status === 'shipped'
                ? 'border-violet-500/30 bg-violet-500/5'
                : 'border-gray-700/70 bg-gray-800/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {order.customerInitials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white text-sm font-medium truncate" title={order.customer}>
                {order.customer}
              </p>
              <Badge className={`${priorityConfig.bg} ${priorityConfig.text} border-0 text-[10px] px-1.5`}>
                {priorityConfig.label}
              </Badge>
            </div>
            <p className="text-gray-500 text-xs truncate">
              {order.orderNumber} · {order.city}
            </p>
          </div>
        </div>
        <Badge className={`${statusConfig.bg} ${statusConfig.text} border-0 text-xs flex items-center gap-1 flex-shrink-0`}>
          {order.status === 'validating' ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
            </span>
          ) : (
            <StatusIcon className="w-3 h-3" />
          )}
          {statusConfig.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="text-xs text-gray-400 flex items-center gap-2 min-w-0">
          <Package className="w-3 h-3 text-gray-500 flex-shrink-0" />
          <span className="truncate">
            {order.itemsCount} {order.itemsCount === 1 ? 'producto' : 'productos'} · {order.topItem}
          </span>
        </div>
        <span className="text-emerald-400 font-semibold text-sm flex-shrink-0">
          {formatCLP(order.amount)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-800">
        <span className={`text-xs flex items-center gap-1 ${channelColor}`}>
          <ShoppingBag className="w-3 h-3" />
          {order.channel}
        </span>
        <span className="text-gray-500 text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {relativeTime(order.updatedAt)}
        </span>
      </div>

      {order.status === 'validated' && order.validationReason && (
        <p className="text-emerald-300/80 text-xs mt-2 flex items-start gap-1.5">
          <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {order.validationReason}
        </p>
      )}
      {order.status === 'rejected' && order.rejectReason && (
        <p className="text-red-300/80 text-xs mt-2 flex items-start gap-1.5">
          <X className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {order.rejectReason}
        </p>
      )}
      {order.status === 'shipped' && (
        <p className="text-violet-300/80 text-xs mt-2 flex items-start gap-1.5">
          <Truck className="w-3 h-3 mt-0.5 flex-shrink-0" />
          Despachado · tracking enviado por WhatsApp
        </p>
      )}
    </motion.div>
  );
};

export default OrdersValidationSimulation;
