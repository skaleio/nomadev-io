import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useShopifyConnection } from "@/hooks/useShopifyConnection";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DropiOrdersPanel } from "@/components/orders/DropiOrdersPanel";
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
  Bell,
  BellRing,
  AlertTriangle,
  XCircle,
  Filter,
  Download,
  Plus,
  Settings,
  ShoppingBag
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

// Estilos futuristas para badges
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
  
  .futuristic-badge:hover::before {
    left: 100%;
  }
  
  .futuristic-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: 'pending_validation' | 'validating' | 'validated' | 'rejected' | 'shipped' | 'delivered';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  total_amount: number;
  currency?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shipping_address: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  validation_notes?: string;
  requires_validation: boolean;
  validation_reason: string;
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, isLoading: isConnectionLoading } = useShopifyConnection();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [sourceTab, setSourceTab] = useState<'shopify' | 'dropi'>('dropi');

  const metricCounts = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending_validation' || o.status === 'validating').length,
    validated: orders.filter(o => o.status === 'validated' || o.status === 'shipped' || o.status === 'delivered').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  };

  const orderMetrics = [
    {
      title: "Total Pedidos",
      value: String(metricCounts.total),
      change: { value: 0, type: "increase" as const },
      icon: Package,
      color: "primary" as const
    },
    {
      title: "Pendientes",
      value: String(metricCounts.pending),
      change: { value: 0, type: "increase" as const },
      icon: Clock,
      color: "warning" as const
    },
    {
      title: "Validados",
      value: String(metricCounts.validated),
      change: { value: 0, type: "increase" as const },
      icon: CheckCircle,
      color: "success" as const
    },
    {
      title: "Rechazados",
      value: String(metricCounts.rejected),
      change: { value: 0, type: "increase" as const },
      icon: XCircle,
      color: "destructive" as const
    }
  ];

  const loadOrders = useCallback(async () => {
    if (!isConnected) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await supabase.functions.invoke('shopify-orders', {
        body: { limit: 50, status: 'any' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOrders(Array.isArray(data?.orders) ? (data.orders as Order[]) : []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setLoadError(error instanceof Error ? error.message : 'Error cargando pedidos');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnectionLoading) return;
    loadOrders();
  }, [isConnectionLoading, loadOrders]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_validation': return <Clock className="w-4 h-4" />;
      case 'validating': return <AlertCircle className="w-4 h-4" />;
      case 'validated': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Package className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_validation': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'validating': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'validated': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'shipped': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    try {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency || 'USD'
      }).format(amount);
    } catch {
      return `${(currency || 'USD')} ${amount.toFixed(2)}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showingNotConnected = !isConnectionLoading && !isConnected;

  return (
    <DashboardLayout>
      <style>{futuristicBadgeStyles}</style>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Pedidos</h1>
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
          <DropiOrdersPanel userId={user?.id} />
        )}

        {sourceTab === 'shopify' && (
        <>
        <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadOrders}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pedido
            </Button>
        </div>

        {/* Banner: no hay tienda conectada */}
        {showingNotConnected && (
          <Card className="bg-yellow-900/20 border-yellow-700/50">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold">Conecta tu tienda</h3>
                  <p className="text-sm text-gray-300">Sin tienda conectada no podemos cargar tus pedidos en vivo.</p>
                </div>
              </div>
              <Button onClick={() => navigate('/shopify/connect')}>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Conectar tienda
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Banner: error cargando pedidos */}
        {isConnected && loadError && (
          <Card className="bg-red-900/20 border-red-700/50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-white font-semibold">Error al cargar pedidos</h3>
                <p className="text-sm text-gray-300">{loadError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadOrders}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

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

        {/* Filtros y Búsqueda */}
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
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">Cargando pedidos...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No hay pedidos</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? 'No se encontraron pedidos con los filtros aplicados'
                    : 'Conecta tu tienda para ver los pedidos en vivo aquí'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && !isConnected && (
                  <Button onClick={() => navigate('/shopify/connect')}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Conectar tienda
                  </Button>
                )}
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
                              {getStatusIcon(order.status)}
                              <span className="font-semibold text-white">{order.order_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">{formatCurrency(order.total_amount, order.currency)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`futuristic-badge ${getPriorityColor(order.priority)}`}>
                              {order.priority}
                            </Badge>
                            <Badge className={`futuristic-badge ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                            <Button variant="ghost" size="sm">
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

        {/* Modal de Detalles del Pedido */}
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
                {/* Información del Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{selectedOrder.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{selectedOrder.customer_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{selectedOrder.customer_phone}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Información del Pedido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{selectedOrder.order_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{selectedOrder.payment_method}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Productos */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Productos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                          <div>
                            <span className="text-white font-medium">{item.name}</span>
                            <p className="text-gray-400 text-sm">Cantidad: {item.quantity}</p>
                          </div>
                          <span className="text-white font-semibold">{formatCurrency(item.price, selectedOrder.currency)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Dirección de Envío */}
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

                {/* Acciones */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                    Cerrar
                  </Button>
                  <Button>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contactar Cliente
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        </>
        )}
      </div>
    </DashboardLayout>
  );
}