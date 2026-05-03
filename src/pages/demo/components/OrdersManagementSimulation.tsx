import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MetricCard } from '@/features/dashboard/components/MetricCard';
import {
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageCircle,
  Search,
  RefreshCw,
  Eye,
  Phone,
  Mail,
  User,
  MapPin,
  CreditCard,
  Truck,
  XCircle,
  Filter,
  Download,
  Plus,
  Settings,
} from 'lucide-react';

const futuristicBadgeStyles = `
  .futuristic-badge {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  .futuristic-badge::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  .futuristic-badge:hover::before { left: 100%; }
  .futuristic-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;

type OrderStatus = 'pending_validation' | 'validating' | 'validated' | 'rejected' | 'shipped' | 'delivered';
type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';

interface DemoOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: OrderStatus;
  priority: OrderPriority;
  total_amount: number;
  currency: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  shipping_address: string;
  payment_method: string;
  created_at: string;
}

const MOCK_ORDERS: DemoOrder[] = [
  {
    id: 'o-1', order_number: '#NMD-21041', customer_name: 'María González',
    customer_phone: '+569 87654321', customer_email: 'maria.gonzalez@gmail.com',
    status: 'pending_validation', priority: 'urgent', total_amount: 89990, currency: 'CLP',
    items: [{ name: 'Polera Oversize Aurora — Talla M', quantity: 1, price: 34990 }, { name: 'Pantalón Wide Leg', quantity: 1, price: 54990 }],
    shipping_address: 'Av. Apoquindo 4250, Las Condes, Santiago',
    payment_method: 'Mercado Pago', created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'o-2', order_number: '#NMD-21040', customer_name: 'Carlos Ruiz',
    customer_phone: '+569 92345678', customer_email: 'carlos.ruiz@hotmail.com',
    status: 'validating', priority: 'high', total_amount: 124500, currency: 'CLP',
    items: [{ name: 'Zapatillas Running Pro — 42', quantity: 1, price: 89990 }, { name: 'Calcetines técnicos x3', quantity: 1, price: 34510 }],
    shipping_address: 'Calle Salvador 1200, Providencia, Santiago',
    payment_method: 'Webpay', created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'o-3', order_number: '#NMD-21038', customer_name: 'Ana Martínez',
    customer_phone: '+569 71234567', customer_email: 'ana.m@gmail.com',
    status: 'validated', priority: 'medium', total_amount: 47990, currency: 'CLP',
    items: [{ name: 'Bolso Crossbody Beauty & Glow', quantity: 1, price: 47990 }],
    shipping_address: 'Av. Pedro de Valdivia 0210, Concepción',
    payment_method: 'Mercado Pago', created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 'o-4', order_number: '#NMD-21037', customer_name: 'Luis Pérez',
    customer_phone: '+569 65432109', customer_email: 'luis.perez@gmail.com',
    status: 'shipped', priority: 'medium', total_amount: 167000, currency: 'CLP',
    items: [{ name: 'Mochila Outdoor 25L', quantity: 1, price: 79990 }, { name: 'Termo Acero 1L', quantity: 1, price: 24990 }, { name: 'Buzo Sherpa', quantity: 1, price: 62020 }],
    shipping_address: 'Pasaje Los Pinos 450, Viña del Mar',
    payment_method: 'Transferencia', created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'o-5', order_number: '#NMD-21035', customer_name: 'Sofía López',
    customer_phone: '+569 54321098', customer_email: 'sofia.l@yahoo.com',
    status: 'delivered', priority: 'low', total_amount: 32990, currency: 'CLP',
    items: [{ name: 'Audífonos Wireless Pro', quantity: 1, price: 32990 }],
    shipping_address: 'Av. Libertad 1024, La Serena',
    payment_method: 'Webpay', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'o-6', order_number: '#NMD-21034', customer_name: 'Miguel Torres',
    customer_phone: '+569 43210987', customer_email: 'mtorres@outlook.com',
    status: 'rejected', priority: 'high', total_amount: 215800, currency: 'CLP',
    items: [{ name: 'Smartwatch Sport Outdoor Gear', quantity: 1, price: 215800 }],
    shipping_address: 'Dirección no validada — IP sospechosa',
    payment_method: 'Mercado Pago', created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'o-7', order_number: '#NMD-21033', customer_name: 'Florencia Díaz',
    customer_phone: '+569 32109876', customer_email: 'flo.diaz@gmail.com',
    status: 'pending_validation', priority: 'low', total_amount: 24990, currency: 'CLP',
    items: [{ name: 'Set de skincare', quantity: 1, price: 24990 }],
    shipping_address: 'Pasaje Lautaro 800, Antofagasta',
    payment_method: 'Webpay', created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: 'o-8', order_number: '#NMD-21030', customer_name: 'Andrés Ramírez',
    customer_phone: '+569 21098765', customer_email: 'andresr@gmail.com',
    status: 'validated', priority: 'urgent', total_amount: 198900, currency: 'CLP',
    items: [{ name: 'Cámara mirrorless 24mp', quantity: 1, price: 198900 }],
    shipping_address: 'Av. Alemania 1820, Temuco',
    payment_method: 'Transferencia', created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_validation: 'Pendiente',
  validating: 'Validando',
  validated: 'Validado',
  rejected: 'Rechazado',
  shipped: 'Enviado',
  delivered: 'Entregado',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_validation: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  validating: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  validated: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const PRIORITY_COLOR: Record<OrderPriority, string> = {
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const StatusIcon: React.FC<{ status: OrderStatus; className?: string }> = ({ status, className }) => {
  const icons: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
    pending_validation: Clock,
    validating: AlertCircle,
    validated: CheckCircle,
    rejected: XCircle,
    shipped: Truck,
    delivered: Package,
  };
  const Icon = icons[status];
  return <Icon className={className ?? 'w-4 h-4'} />;
};

const formatCLP = (amount: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const OrdersManagementSimulation: React.FC = () => {
  const [orders, setOrders] = useState<DemoOrder[]>(MOCK_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<DemoOrder | null>(null);
  const [sourceTab, setSourceTab] = useState<'shopify' | 'dropi'>('shopify');
  const [refreshing, setRefreshing] = useState(false);

  // Auto-progresión: cada 4s un pedido pendiente avanza al siguiente estado
  useEffect(() => {
    const id = setInterval(() => {
      setOrders((prev) => {
        const candidates = prev.filter((o) => o.status === 'pending_validation' || o.status === 'validating' || o.status === 'validated');
        if (candidates.length === 0) return prev;
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
          pending_validation: 'validating',
          validating: 'validated',
          validated: 'shipped',
        };
        const newStatus = NEXT[target.status];
        if (!newStatus) return prev;
        return prev.map((o) => (o.id === target.id ? { ...o, status: newStatus } : o));
      });
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending_validation' || o.status === 'validating').length,
    validated: orders.filter((o) => o.status === 'validated' || o.status === 'shipped' || o.status === 'delivered').length,
    rejected: orders.filter((o) => o.status === 'rejected').length,
  }), [orders]);

  const orderMetrics = [
    { title: 'Total Pedidos', value: String(counts.total), change: { value: 18.4, type: 'increase' as const }, icon: Package, color: 'primary' as const },
    { title: 'Pendientes', value: String(counts.pending), change: { value: 4.2, type: 'decrease' as const }, icon: Clock, color: 'warning' as const },
    { title: 'Validados', value: String(counts.validated), change: { value: 12.7, type: 'increase' as const }, icon: CheckCircle, color: 'success' as const },
    { title: 'Rechazados', value: String(counts.rejected), change: { value: 8.1, type: 'decrease' as const }, icon: XCircle, color: 'destructive' as const },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  return (
    <>
      <style>{futuristicBadgeStyles}</style>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Gestión de Pedidos</h1>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Demo en vivo
              </Badge>
            </div>
            <p className="text-gray-400 mt-1">Importación masiva o pedidos en tiempo real desde tu tienda conectada</p>
          </div>
          <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as 'shopify' | 'dropi')} className="w-full sm:w-auto">
            <TabsList className="bg-gray-800 border border-gray-700">
              <TabsTrigger value="dropi" className="data-[state=active]:bg-gray-700">Importación</TabsTrigger>
              <TabsTrigger value="shopify" className="data-[state=active]:bg-gray-700">Tienda en vivo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {sourceTab === 'dropi' && (
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-8 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/15 rounded-full">
                <Download className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Importación Dropi</h3>
              <p className="text-gray-400 max-w-md mx-auto text-sm">
                Sube un archivo CSV o conecta directo con Dropi para importar pedidos masivamente.
                En la cuenta real, cada fila se valida y se transforma en un pedido con su flujo completo.
              </p>
              <Button disabled className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Subir archivo CSV
              </Button>
            </CardContent>
          </Card>
        )}

        {sourceTab === 'shopify' && (
          <>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Pedido
              </Button>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {orderMetrics.map((metric, index) => (
                <MetricCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  icon={metric.icon}
                  color={metric.color}
                />
              ))}
            </div>

            {/* Filtros */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros y Búsqueda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar por cliente, pedido o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending_validation">Pendiente</option>
                      <option value="validating">Validando</option>
                      <option value="validated">Validado</option>
                      <option value="rejected">Rechazado</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregado</option>
                    </select>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm"
                    >
                      <option value="all">Todas las prioridades</option>
                      <option value="urgent">Urgente</option>
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Pedidos */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Pedidos ({filteredOrders.length})</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No hay pedidos</h3>
                    <p className="text-gray-400">No se encontraron pedidos con los filtros aplicados.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <Card
                          key={order.id}
                          className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <StatusIcon status={order.status} />
                                  <span className="font-semibold text-white">{order.order_number}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-300">{order.customer_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-semibold">{formatCLP(order.total_amount)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`futuristic-badge ${PRIORITY_COLOR[order.priority]}`}>
                                  {order.priority}
                                </Badge>
                                <Badge className={`futuristic-badge ${STATUS_COLOR[order.status]}`}>
                                  {STATUS_LABEL[order.status]}
                                </Badge>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{order.customer_email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{order.customer_phone}</span>
                                </div>
                              </div>
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Modal de detalles */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-4xl bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Pedido {selectedOrder.order_number}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Detalles completos del pedido
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="text-white">{selectedOrder.customer_name}</span></div>
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-300">{selectedOrder.customer_email}</span></div>
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-300">{selectedOrder.customer_phone}</span></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Información del Pedido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2"><Package className="w-4 h-4 text-gray-400" /><span className="text-white">{selectedOrder.order_number}</span></div>
                      <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-400" /><span className="text-gray-300">{selectedOrder.payment_method}</span></div>
                      <div className="flex items-center gap-2"><span className="text-white font-semibold">{formatCLP(selectedOrder.total_amount)}</span></div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Productos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                          <div>
                            <span className="text-white font-medium">{item.name}</span>
                            <p className="text-gray-400 text-sm">Cantidad: {item.quantity}</p>
                          </div>
                          <span className="text-white font-semibold">{formatCLP(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Dirección de Envío</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                      <span className="text-gray-300">{selectedOrder.shipping_address}</span>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
                  <Button>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contactar Cliente
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
};

export default OrdersManagementSimulation;
