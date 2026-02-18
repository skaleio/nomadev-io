import { useState, useEffect, useCallback } from 'react';
import { backendAPI, ShopifyAnalytics, ShopifyMetrics } from '@/lib/backend-api';
import { n8nWebhook } from '@/lib/n8n-webhook';
import { getErrorInfo, formatErrorMessage, ERROR_CODES } from '@/lib/error-handler';
import { DollarSign, ShoppingBag, Package, AlertTriangle, TrendingUp } from 'lucide-react';

export const useShopifyData = () => {
  const [analytics, setAnalytics] = useState<ShopifyAnalytics | null>(null);
  const [metrics, setMetrics] = useState<ShopifyMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true); // Iniciar en true para mostrar estado de carga
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [initialized, setInitialized] = useState(false); // Flag para evitar múltiples inicializaciones

  // Verificar conexión con Shopify
  const checkConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Primero verificar si el backend está disponible
      const backendHealthy = await backendAPI.checkBackendHealth();
      if (!backendHealthy) {
        const errorInfo = getErrorInfo(ERROR_CODES.BACKEND_UNAVAILABLE);
        setError(errorInfo.message);
        setIsConnected(false);
        return false;
      }
      
      // Verificar conexión con Shopify a través del backend
      const connectionResponse = await backendAPI.checkConnection();
      setIsConnected(connectionResponse.connected);
      
      if (!connectionResponse.connected) {
        const errorCode = connectionResponse.code || ERROR_CODES.CONNECTION_ERROR;
        const errorInfo = getErrorInfo(errorCode);
        setError(errorInfo.message);
      }
      
      return connectionResponse.connected;
    } catch (error) {
      console.error('Error checking Shopify connection:', error);
      setIsConnected(false);
      const errorInfo = getErrorInfo(ERROR_CODES.NETWORK_ERROR);
      setError(errorInfo.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar analytics completos
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const metricsResponse = await backendAPI.getMetrics();
      if (metricsResponse.success && metricsResponse.metrics) {
        setAnalytics(metricsResponse.metrics.analytics);
        setLastUpdate(new Date());

        // Enviar datos a N8N
        await n8nWebhook.sendSaleUpdate({
          saleId: 'analytics-update',
          customerName: 'Sistema',
          product: 'Analytics Update',
          amount: metricsResponse.metrics.analytics.todayRevenue,
          status: 'completed',
          timestamp: new Date().toISOString(),
          paymentMethod: 'API'
        });
      } else {
        const errorCode = metricsResponse.code || ERROR_CODES.DATA_FETCH_ERROR;
        const errorInfo = getErrorInfo(errorCode);
        setError(errorInfo.message);
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
      const errorInfo = getErrorInfo(ERROR_CODES.DATA_FETCH_ERROR);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar métricas del dashboard
  const loadMetrics = useCallback(async () => {
    try {
      const metricsResponse = await backendAPI.getMetrics();
      if (metricsResponse.success && metricsResponse.metrics) {
        setMetrics(metricsResponse.metrics);
      } else {
        console.error('Error loading metrics:', metricsResponse.error);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, []);

  // Formatear moneda
  const formatCurrency = useCallback((amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }, []);

  // Calcular cambio porcentual
  const calculateChange = useCallback((current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }, []);

  // Obtener métricas para el dashboard
  const getDashboardMetrics = useCallback(() => {
    if (!metrics) {
      // Retornar métricas por defecto cuando no hay datos
      return [
        {
          title: "Revenue Hoy",
          value: "€0",
          change: { value: 0, type: "increase" as const },
          icon: DollarSign,
          color: "success" as const,
          description: "Cargando datos..."
        },
        {
          title: "Pedidos Hoy",
          value: "0",
          change: { value: 0, type: "increase" as const },
          icon: ShoppingBag,
          color: "primary" as const,
          description: "Cargando datos..."
        },
        {
          title: "Productos Activos",
          value: "0",
          change: { value: 0, type: "increase" as const },
          icon: Package,
          color: "primary" as const,
          description: "Cargando datos..."
        },
        {
          title: "Stock Bajo",
          value: "0",
          change: { value: 0, type: "increase" as const },
          icon: AlertTriangle,
          color: "warning" as const,
          description: "Cargando datos..."
        },
        {
          title: "Tasa Conversión",
          value: "0%",
          change: { value: 0, type: "increase" as const },
          icon: TrendingUp,
          color: "success" as const,
          description: "Cargando datos..."
        },
        {
          title: "AOV Hoy",
          value: "€0",
          change: { value: 0, type: "increase" as const },
          icon: DollarSign,
          color: "success" as const,
          description: "Cargando datos..."
        }
      ];
    }

    const changeToday = calculateChange(metrics.revenue.today, metrics.revenue.yesterday);
    const changeOrders = calculateChange(metrics.orders.today, metrics.orders.yesterday);
    const changeProducts = calculateChange(metrics.products.active, metrics.products.total);
    const changeStock = calculateChange(metrics.products.lowStock, 0);

    return [
      {
        title: "Revenue Hoy",
        value: formatCurrency(metrics.revenue.today),
        change: { 
          value: Math.abs(changeToday), 
          type: changeToday >= 0 ? "increase" as const : "decrease" as const 
        },
        icon: DollarSign,
        color: "success" as const,
        description: `vs. ayer (${changeToday >= 0 ? '+' : ''}${changeToday.toFixed(1)}%)`
      },
      {
        title: "Pedidos Hoy",
        value: metrics.orders.today.toString(),
        change: { 
          value: Math.abs(changeOrders), 
          type: changeOrders >= 0 ? "increase" as const : "decrease" as const 
        },
        icon: ShoppingBag,
        color: "primary" as const,
        description: `vs. ayer (${changeOrders >= 0 ? '+' : ''}${changeOrders.toFixed(1)}%)`
      },
      {
        title: "Productos Activos",
        value: metrics.products.active.toString(),
        change: { 
          value: Math.abs(changeProducts), 
          type: changeProducts >= 0 ? "increase" as const : "decrease" as const 
        },
        icon: Package,
        color: "primary" as const,
        description: `de ${metrics.products.total} total`
      },
      {
        title: "Stock Bajo",
        value: metrics.products.lowStock.toString(),
        change: { 
          value: Math.abs(changeStock), 
          type: changeStock >= 0 ? "increase" as const : "decrease" as const 
        },
        icon: AlertTriangle,
        color: "warning" as const,
        description: "requieren reposición"
      },
      {
        title: "Tasa Conversión",
        value: `${metrics.conversion.rate}%`,
        change: { 
          value: 0.8, 
          type: metrics.conversion.trend === 'up' ? "increase" as const : "decrease" as const 
        },
        icon: TrendingUp,
        color: "success" as const,
        description: "visitas a ventas"
      },
      {
        title: "AOV Hoy",
        value: formatCurrency(metrics.orders.today > 0 ? metrics.revenue.today / metrics.orders.today : 0),
        change: { 
          value: 5.2, 
          type: "increase" as const 
        },
        icon: DollarSign,
        color: "success" as const,
        description: "valor promedio por orden"
      }
    ];
  }, [metrics, formatCurrency, calculateChange]);

  // Efectos
  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (initialized) return;

    const initializeData = async () => {
      try {
        console.log('🔄 Inicializando datos de Shopify...');
        setInitialized(true);
        
        const connected = await checkConnection();
        console.log('📡 Estado de conexión:', connected);
        
        if (connected) {
          console.log('✅ Conectado, cargando datos...');
          await Promise.all([
            loadAnalytics(),
            loadMetrics()
          ]);
        } else {
          console.log('❌ No conectado, usando datos en cero');
          // Cargar datos en cero hasta conectar con Shopify
          setAnalytics({
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            totalProducts: 0,
            lowStockProducts: 0,
            conversionRate: 0,
            topProducts: [],
            recentOrders: [],
            lowStockItems: [],
            todayOrders: 0,
            todayRevenue: 0
          });
          setMetrics({
            revenue: { today: 0, yesterday: 0, thisMonth: 0, lastMonth: 0 },
            orders: { today: 0, yesterday: 0, thisMonth: 0, lastMonth: 0 },
            products: { total: 0, active: 0, lowStock: 0 },
            conversion: { rate: 0, trend: 'up' }
          });
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error initializing Shopify data:', error);
        const errorInfo = getErrorInfo(ERROR_CODES.INITIALIZATION_ERROR);
        setError(errorInfo.message);
        
        // En caso de error, cargar datos simulados como fallback
        setAnalytics({
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          totalProducts: 0,
          lowStockProducts: 0,
          conversionRate: 0,
          topProducts: [],
          recentOrders: [],
          lowStockItems: [],
          todayOrders: 0,
          todayRevenue: 0
        });
        setMetrics({
          revenue: { today: 0, yesterday: 0, thisMonth: 0, lastMonth: 0 },
          orders: { today: 0, yesterday: 0, thisMonth: 0, lastMonth: 0 },
          products: { total: 0, active: 0, lowStock: 0 },
          conversion: { rate: 0, trend: 'stable' }
        });
        setLastUpdate(new Date());
      } finally {
        setLoading(false);
      }
    };

    // Inicializar con un pequeño delay para evitar problemas de hidratación
    const timeoutId = setTimeout(initializeData, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [initialized]); // Solo depende de initialized

  // Polling separado que no interfiere con la inicialización
  useEffect(() => {
    if (!initialized || !isConnected) return;

    const interval = setInterval(() => {
      loadAnalytics();
      loadMetrics();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [initialized, isConnected, loadAnalytics, loadMetrics]);

  return {
    analytics,
    metrics,
    isConnected,
    loading,
    error,
    lastUpdate,
    checkConnection,
    loadAnalytics,
    loadMetrics,
    getDashboardMetrics,
    formatCurrency
  };
};
