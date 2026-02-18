import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Search,
  RefreshCw,
  ExternalLink,
  Users,
  ShoppingBag,
  MessageSquare,
  FileText,
  Download,
  Calendar,
  Settings
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';

interface TrackingEvent {
  id: string;
  tracking_id: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
  carrier_status: string;
}

interface TrackingInfo {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  tracking_number: string;
  carrier: string;
  status: string;
  current_location: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  created_at: string;
  updated_at: string;
  tracking_events: TrackingEvent[];
}

export default function TrackingPage() {
  const [trackingData, setTrackingData] = useState<TrackingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTracking, setSelectedTracking] = useState<TrackingInfo | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Estados para el modal de reportes
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<string>('status');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('text');

  useEffect(() => {
    fetchTrackingData();
    // Inicializar fechas por defecto (últimos 30 días)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  // Auto-seleccionar el primer envío cuando se cargan los datos
  useEffect(() => {
    if (trackingData.length > 0 && !selectedTracking) {
      setSelectedTracking(trackingData[0]);
    }
  }, [trackingData]);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const fetchTrackingData = async () => {
    setLoading(true);
    try {
      // TODO: Implementar conexión real a Supabase cuando esté listo
      // const { data: shipments, error } = await supabase
      //   .from('shipments')
      //   .select(`
      //     *,
      //     orders (
      //       order_number,
      //       customer_name,
      //       customer_phone,
      //       total_amount
      //     )
      //   `)
      //   .order('created_at', { ascending: false });
      // 
      // if (!error && shipments) {
      //   const realTrackingData: TrackingInfo[] = shipments.map((shipment: any) => ({
      //     id: shipment.id,
      //     order_number: shipment.orders?.order_number || 'N/A',
      //     customer_name: shipment.orders?.customer_name || 'Cliente',
      //     customer_phone: shipment.orders?.customer_phone || '',
      //     tracking_number: shipment.tracking_number || 'N/A',
      //     carrier: shipment.carrier || 'EasyDrop',
      //     status: shipment.status || 'pending',
      //     current_location: shipment.current_location || 'Origen',
      //     estimated_delivery: shipment.estimated_delivery,
      //     actual_delivery: shipment.actual_delivery,
      //     created_at: shipment.created_at,
      //     updated_at: shipment.updated_at,
      //     tracking_events: shipment.tracking_events || []
      //   }));
      //   
      //   setTrackingData(realTrackingData);
      //   return;
      // }
      
      // Por ahora, usar lista vacía hasta conectar con Shopify
      console.log('Tracking data loaded - empty until Shopify connection');
      setTrackingData([]);
    } catch (error) {
      console.error('Error loading tracking data:', error);
      setTrackingData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar datos de seguimiento
  const filteredData = trackingData.filter(item => {
    const matchesSearch = !searchTerm || 
      item.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tracking_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_transit': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'out_for_delivery': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'picked_up': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'pending': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Entregado';
      case 'in_transit': return 'En Tránsito';
      case 'out_for_delivery': return 'En Reparto';
      case 'picked_up': return 'Recogido';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
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

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Cargando información de seguimiento...</p>
            <p className="text-gray-400 text-sm mt-2">Por favor espera...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Seguimiento de Pedidos</h1>
            <p className="text-gray-400">
              Monitorea el estado de envío de todos los pedidos
            </p>
          </div>
          <Button onClick={fetchTrackingData} variant="outline" className="text-white border-gray-400 hover:bg-gray-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Envíos</p>
                  <p className="text-2xl font-bold text-white">{trackingData.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">En Tránsito</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {trackingData.filter(item => item.status === 'in_transit').length}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Entregados</p>
                  <p className="text-2xl font-bold text-green-400">
                    {trackingData.filter(item => item.status === 'delivered').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">En Reparto</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {trackingData.filter(item => item.status === 'out_for_delivery').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda y filtros */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por número de pedido, cliente o tracking..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="picked_up">Recogido</SelectItem>
                    <SelectItem value="in_transit">En Tránsito</SelectItem>
                    <SelectItem value="out_for_delivery">En Reparto</SelectItem>
                    <SelectItem value="delivered">Entregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de envíos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Envíos ({filteredData.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No hay envíos</h3>
                    <p className="text-gray-400 mb-4">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No se encontraron envíos con los filtros aplicados'
                        : 'Conecta tu tienda Shopify para ver los envíos aquí'
                      }
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                      <Button>
                        <Package className="w-4 h-4 mr-2" />
                        Conectar Shopify
                      </Button>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {paginatedData.map((item) => (
                        <Card 
                          key={item.id} 
                          className={`bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-800/70 transition-colors ${
                            selectedTracking?.id === item.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => setSelectedTracking(item)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-white font-semibold">Pedido #{item.order_number}</p>
                                  <p className="text-gray-400 text-sm">{item.customer_name}</p>
                                </div>
                              </div>
                              <Badge className={getStatusColor(item.status)}>
                                {getStatusText(item.status)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Tracking</p>
                                <p className="text-white font-mono">{item.tracking_number}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Transportista</p>
                                <p className="text-white">{item.carrier}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Ubicación</p>
                                <p className="text-white">{item.current_location}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Actualizado</p>
                                <p className="text-white">{formatDateShort(item.updated_at)}</p>
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
          </div>

          {/* Panel de detalles */}
          <div>
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Detalles del Envío</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTracking ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400">Número de Pedido</Label>
                      <p className="text-white font-semibold">#{selectedTracking.order_number}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Cliente</Label>
                      <p className="text-white">{selectedTracking.customer_name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Teléfono</Label>
                      <p className="text-white">{selectedTracking.customer_phone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Número de Tracking</Label>
                      <p className="text-white font-mono">{selectedTracking.tracking_number}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Transportista</Label>
                      <p className="text-white">{selectedTracking.carrier}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Estado</Label>
                      <Badge className={getStatusColor(selectedTracking.status)}>
                        {getStatusText(selectedTracking.status)}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-400">Ubicación Actual</Label>
                      <p className="text-white">{selectedTracking.current_location}</p>
                    </div>
                    {selectedTracking.estimated_delivery && (
                      <div>
                        <Label className="text-gray-400">Entrega Estimada</Label>
                        <p className="text-white">{formatDate(selectedTracking.estimated_delivery)}</p>
                      </div>
                    )}
                    {selectedTracking.actual_delivery && (
                      <div>
                        <Label className="text-gray-400">Entrega Real</Label>
                        <p className="text-white">{formatDate(selectedTracking.actual_delivery)}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Selecciona un envío para ver los detalles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}