import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageCircle,
  Search,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { LoadingScreen } from '../components/ui/loading-logo';

interface OrderValidation {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  validation_stage: 'Producto' | 'Dirección' | 'Monto' | 'Confirmación';
  validation_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  order_status: 'pending' | 'validating' | 'ready_for_shipping' | 'shipped' | 'delivered';
  last_validation_message: string;
  created_at: string;
  updated_at: string;
  total_price: number;
  line_items: any[];
}

interface OrderInteraction {
  id: string;
  client_id: string;
  message_id: string;
  stage: string;
  message: string;
  interaction_type: 'validation' | 'doubt' | 'tracking';
  created_at: string;
}

export default function OrderValidationPage() {
  const [orders, setOrders] = useState<OrderValidation[]>([]);
  const [interactions, setInteractions] = useState<OrderInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchInteractions();
    
    // Timeout de seguridad para evitar carga infinita
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Timeout reached, setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5 segundos timeout

    return () => clearTimeout(timeout);
  }, []);

  const fetchOrders = async () => {
    try {
      // Por ahora, usar lista vacía hasta conectar con Shopify
      console.log('Using empty data - waiting for Shopify connection');
      setOrders([]);
      
      // TODO: Implementar conexión real a Supabase cuando esté listo
      // const { data, error } = await supabase
      //   .from('orders')
      //   .select('*')
      //   .order('created_at', { ascending: false })
      //   .limit(50);
      // 
      // if (error) {
      //   console.warn('Error fetching orders from Supabase, using empty data:', error);
      //   setOrders([]);
      // } else {
      //   setOrders(data || []);
      // }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async () => {
    try {
      // Por ahora, usar lista vacía hasta conectar con Shopify
      console.log('Using empty interactions data - waiting for Shopify connection');
      setInteractions([]);
      
      // TODO: Implementar conexión real a Supabase cuando esté listo
      // const { data, error } = await supabase
      //   .from('order_interactions')
      //   .select('*')
      //   .order('created_at', { ascending: false })
      //   .limit(100);
      // 
      // if (error) {
      //   console.warn('Error fetching interactions from Supabase, using empty data:', error);
      //   setInteractions([]);
      // } else {
      //   setInteractions(data || []);
      // }
    } catch (error) {
      console.error('Error fetching interactions:', error);
      setInteractions([]);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_phone.includes(searchTerm)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Producto': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Dirección': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Monto': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Confirmación': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">Validación de Pedidos</h1>
            <p className="text-gray-400 mt-1">Gestiona la validación automática de pedidos</p>
        </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
          </div>
      </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-400 text-sm">Total Pedidos</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
                <Package className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-400 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-400">0</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-400 text-sm">En Proceso</p>
                  <p className="text-2xl font-bold text-blue-400">0</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-gray-400 text-sm">Completados</p>
                  <p className="text-2xl font-bold text-green-400">0</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
                placeholder="Buscar por cliente, pedido o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

        {/* Lista de Pedidos */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Pedidos para Validar ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No hay pedidos para validar</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm 
                    ? 'No se encontraron pedidos con los filtros aplicados'
                    : 'Conecta tu tienda Shopify para ver los pedidos que requieren validación'
                  }
                </p>
                {!searchTerm && (
                  <Button>
                    <Package className="w-4 h-4 mr-2" />
                    Conectar Shopify
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                {filteredOrders.map((order) => (
                    <Card 
                    key={order.id}
                      className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.validation_status)}
                              <span className="font-semibold text-white">{order.order_number}</span>
                            </div>
                            <span className="text-gray-300">{order.customer_name}</span>
                            <span className="text-white font-semibold">{formatCurrency(order.total_price)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStageColor(order.validation_stage)}>
                              {order.validation_stage}
                            </Badge>
                      <Badge className={getStatusColor(order.validation_status)}>
                              {order.validation_status.replace('_', ' ')}
                      </Badge>
                          </div>
                    </div>
                    
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Teléfono: {order.customer_phone}</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>Creado: {formatDate(order.created_at)}</span>
                    </div>
                    
                          <div className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-gray-300 text-sm">
                              <strong>Último mensaje:</strong> {order.last_validation_message}
                    </p>
                  </div>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
            </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Interacciones Recientes */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Interacciones Recientes ({interactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {interactions.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No hay interacciones recientes</p>
                  </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{interaction.stage}</span>
                        <span className="text-gray-400 text-sm">{formatDate(interaction.created_at)}</span>
                </div>
                      <p className="text-gray-300 text-sm">{interaction.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}