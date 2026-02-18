import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, DollarSign, Package, RotateCcw, RefreshCw, Eye, Star, TrendingUp, Filter, Search, Calendar, BarChart3, Users, AlertTriangle } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useShopifyMetricsSimple } from "@/hooks/useShopifyMetricsSimple";
import { useShopifyConnection } from "@/hooks/useShopifyConnection";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/shopifyMetrics";
import { connectShopifyManually } from "@/lib/connectShopifyManually";
import { testShopifyDirect } from "@/lib/testShopifyDirect";

export default function ShopifyPage() {
  // Estados locales para productos y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Estados para el rango de fechas
  const [selectedDateRange, setSelectedDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Hook para métricas simplificado
  const { metrics, loading, error, fetchMetrics } = useShopifyMetricsSimple(selectedDateRange);
  
  // Hook para verificar conexión real con Shopify
  const { isConnected: isShopifyConnected, isLoading: isConnectionLoading, error: connectionError } = useShopifyConnection();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Función para manejar el cambio de rango de fechas
  const handleDateRangeChange = (newRange: string) => {
    setSelectedDateRange(newRange as '7d' | '30d' | '90d');
  };

  // Función para conectar manualmente (temporal)
  const handleConnectManually = async () => {
    console.log('🔥 BOTÓN CLICKEADO - handleConnectManually');
    try {
      console.log('Iniciando conexión manual...');
      const result = await connectShopifyManually();
      console.log('Conexión exitosa:', result);
      
      toast({
        title: "¡Conexión Exitosa!",
        description: "Tienda SKALETEST conectada correctamente",
      });
      
      // Recargar la página para actualizar las métricas
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error en conexión manual:', error);
      toast({
        title: "Error de Conexión",
        description: error instanceof Error ? error.message : "No se pudo conectar la tienda",
        variant: "destructive"
      });
    }
  };

  // Función para probar conexión directa a Shopify
  const handleTestDirect = async () => {
    console.log('🔥 BOTÓN CLICKEADO - handleTestDirect');
    alert('🔥 BOTÓN FUNCIONANDO - Probando conexión...');
    
    try {
      console.log('Probando conexión directa a Shopify...');
      const result = await testShopifyDirect();
      console.log('Conexión directa exitosa:', result);
      
      toast({
        title: "¡Conexión Exitosa!",
        description: `Tienda: ${result.shop?.name || 'SKALETEST'} - Access Token funcionando`,
      });
    } catch (error) {
      console.error('Error en conexión directa:', error);
      toast({
        title: "Error de Conexión Directa",
        description: error instanceof Error ? error.message : "No se pudo conectar directamente a Shopify",
        variant: "destructive"
      });
    }
  };

  // Manejar conexión exitosa desde OAuth
  useEffect(() => {
    const connected = searchParams.get('connected');
    const shop = searchParams.get('shop');
    
    if (connected === 'true' && shop) {
      toast({
        title: "¡Conexión Exitosa!",
        description: `Tu tienda ${shop} se ha conectado correctamente`,
      });
      
      // Limpiar parámetros de la URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('connected');
      newUrl.searchParams.delete('shop');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Actualizar métricas automáticamente
      setTimeout(() => {
        // Las métricas se actualizan automáticamente con el hook
      }, 1000);
    }
  }, [searchParams, toast, selectedDateRange]);

  // Datos reales - productos vacíos hasta conectar con Shopify
  const mockProducts: any[] = [];

  // Filtrar productos
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.product_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Obtener categorías únicas
  const categories = ["all", ...Array.from(new Set(mockProducts.map(p => p.product_type)))];

  // Métricas para mostrar - solo si hay conexión real con Shopify
  const displayMetrics = isShopifyConnected && metrics ? [
    {
      title: "Revenue Total",
      value: `$${metrics.ventas.total_revenue.toLocaleString()}`,
      change: { value: 0, type: "increase" as const },
      icon: DollarSign,
      color: "success" as const,
      description: `Últimos ${selectedDateRange}`
    },
    {
      title: "Pedidos",
      value: metrics.ventas.total_orders.toString(),
      change: { value: 0, type: "increase" as const },
      icon: ShoppingBag,
      color: "primary" as const,
      description: `Últimos ${selectedDateRange}`
    },
    {
      title: "Ticket Promedio",
      value: `$${metrics.ventas.average_order_value.toLocaleString()}`,
      change: { value: 0, type: "increase" as const },
      icon: TrendingUp,
      color: "primary" as const,
      description: `Últimos ${selectedDateRange}`
    },
    {
      title: "Nuevos Clientes",
      value: metrics.clientes.new_customers.toString(),
      change: { value: 0, type: "increase" as const },
      icon: Users,
      color: "success" as const,
      description: `Últimos ${selectedDateRange}`
    }
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-2">
                Shopify Analytics
              </h1>
              <p className="text-muted-foreground">
                Métricas y análisis de tu tienda Shopify en tiempo real
              </p>
              {metrics && (
                <p className="text-sm text-muted-foreground mt-1">
                  Última actualización: {new Date(metrics.timestamp).toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedDateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 días</SelectItem>
                  <SelectItem value="30d">30 días</SelectItem>
                  <SelectItem value="90d">90 días</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={fetchMetrics}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Actualizando...' : 'Actualizar Métricas'}
              </Button>
            </div>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <span className="font-medium">Error:</span>
                <span className="ml-2">{error}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                ✕
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayMetrics.map((metric, index) => (
            <div key={metric.title} className="animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
              <MetricCard {...metric} loading={loading} />
            </div>
          ))}
        </div>

        {/* Mensaje cuando no hay conexión con Shopify */}
        {!isShopifyConnected && (
          <Card className="glass-card p-6 border-amber-200 dark:border-amber-800">
            <div className="text-center">
              <ShoppingBag className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Conecta tu tienda Shopify</h3>
              <p className="text-muted-foreground mb-4">
                Para ver tus métricas y analíticas, necesitas conectar tu tienda Shopify primero.
              </p>
              <Button 
                onClick={() => navigate('/shopify/connect')}
                className="bg-green-600 hover:bg-green-700"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Conectar Tienda Shopify
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Estado de Conexión</h3>
              <div className="flex gap-2">
                {!isShopifyConnected && (
                  <Button 
                    onClick={() => navigate('/shopify/connect')}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Conectar Tienda
                  </Button>
                )}
                <Button 
                  onClick={fetchMetrics} 
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Actualizando...' : 'Actualizar'}
                </Button>
              </div>
            </div>
            <div className="text-center">
              <ShoppingBag className={`w-12 h-12 mx-auto mb-2 ${isShopifyConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
              <p className="text-muted-foreground mb-2">
                {isConnectionLoading ? "Verificando conexión..." : isShopifyConnected ? "Conectado a Shopify" : "No hay tienda conectada"}
              </p>
              <StatusBadge status={isConnectionLoading ? "pending" : isShopifyConnected ? "success" : "error"}>
                {isConnectionLoading ? "Verificando..." : isShopifyConnected ? "Conectado" : "Desconectado"}
              </StatusBadge>
              {!isShopifyConnected && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Para conectar tu tienda:</strong>
                  </p>
                  <ol className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 list-decimal list-inside space-y-1">
                    <li>Ve a tu tienda Shopify Admin</li>
                    <li>Instala la app NOMADEV.IO</li>
                    <li>Autoriza los permisos necesarios</li>
                    <li>Regresa aquí y actualiza</li>
                  </ol>
                </div>
              )}
            </div>
          </Card>

          {/* Mostrar métricas adicionales si están disponibles y hay conexión real */}
          {isShopifyConnected && metrics && (
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Métricas Adicionales</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Productos con Bajo Stock</span>
                  </div>
                  <Badge variant="destructive">{metrics.productos.low_stock_products}</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Clientes Reincidentes</span>
                  </div>
                  <Badge variant="default">{metrics.clientes.returning_customers}</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Tasa de Retención</span>
                  </div>
                  <Badge variant="default">{formatPercentage(metrics.clientes.retention_rate)}</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Valor del Inventario</span>
                  </div>
                  <Badge variant="outline">{formatCurrency(metrics.productos.inventory_value)}</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Mostrar resumen de ventas si están disponibles en métricas y hay conexión real */}
          {isShopifyConnected && metrics && metrics.ventas && (
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Resumen de Ventas</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/10">
                  <div>
                    <p className="font-medium">Revenue Total</p>
                    <p className="text-sm text-muted-foreground">Últimos {selectedDateRange}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${metrics.ventas.total_revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{metrics.ventas.total_orders} pedidos</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/10">
                  <div>
                    <p className="font-medium">Ticket Promedio</p>
                    <p className="text-sm text-muted-foreground">Por pedido</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${metrics.ventas.average_order_value.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Promedio</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sección de Productos Top si tenemos métricas avanzadas y conexión real */}
        {isShopifyConnected && metrics && metrics.productos.top_products.length > 0 && (
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Productos Más Vendidos</h3>
                <p className="text-sm text-muted-foreground">
                  Top productos por ventas en los últimos {selectedDateRange}
                </p>
              </div>
              <StatusBadge status="success">
                <TrendingUp className="w-3 h-3 mr-1" />
                {metrics.productos.top_products.length} productos
              </StatusBadge>
            </div>
            
            <div className="space-y-3">
              {metrics.productos.top_products.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity_sold} unidades vendidas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Sección de Productos Mejorada */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Catálogo de Productos</h3>
              <p className="text-sm text-muted-foreground">
                Gestiona y visualiza todos los productos de tu tienda
              </p>
            </div>
            <StatusBadge status="success">
              <Package className="w-3 h-3 mr-1" />
              {filteredProducts.length} productos
            </StatusBadge>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos por nombre o marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  <Filter className="w-3 h-3 mr-1" />
                  {category === "all" ? "Todos" : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Lista de Productos */}
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center p-4">
                  {/* Imagen del Producto */}
                  <div className="relative w-20 h-20 flex-shrink-0 mr-4">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute -top-1 -right-1">
                      <Badge variant={product.status === "active" ? "default" : "secondary"} className="text-xs">
                        {product.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    {product.compare_at_price && (
                      <div className="absolute -top-1 -left-1">
                        <Badge variant="destructive" className="text-xs">
                          -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Información del Producto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-base truncate">{product.title}</h4>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">{product.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{product.vendor}</p>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold">${product.price}</span>
                      {product.compare_at_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.compare_at_price}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {product.product_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Stock: {product.inventory}</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {product.sales} ventas
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 ml-4 max-w-32">
                    {product.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {product.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{product.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
              <p className="text-muted-foreground">
                Intenta ajustar los filtros o términos de búsqueda
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}