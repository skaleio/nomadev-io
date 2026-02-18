// shopify-simple.ts - Versión simplificada para obtener métricas de Shopify
export interface SimpleShopifyMetrics {
  revenue: {
    today: number;
    yesterday: number;
    thisMonth: number;
  };
  orders: {
    today: number;
    yesterday: number;
    thisMonth: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
  };
}

// Configuración simple: solo variables de entorno
const SHOPIFY_CONFIG = {
  shopDomain: import.meta.env.VITE_SHOPIFY_SHOP_DOMAIN ?? '',
  accessToken: import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN ?? '',
  apiVersion: import.meta.env.VITE_SHOPIFY_API_VERSION ?? '2024-01'
};

// Función para hacer peticiones a Shopify (solo funciona con backend)
export const fetchShopifyData = async (endpoint: string) => {
  try {
    // Intentar con el backend primero
    const backendUrl = `http://localhost:3001/api/shopify${endpoint}`;
    const response = await fetch(backendUrl);
    
    if (response.ok) {
      return await response.json();
    }
    
    throw new Error('Backend no disponible');
  } catch (error) {
    console.warn('Backend no disponible, usando datos simulados');
    return null;
  }
};

// Obtener métricas de forma simple
export const getSimpleMetrics = async (): Promise<SimpleShopifyMetrics> => {
  try {
    // Intentar obtener datos reales
    const metricsResponse = await fetchShopifyData('/metrics');
    
    if (metricsResponse?.success) {
      return {
        revenue: {
          today: metricsResponse.metrics.revenue.today,
          yesterday: metricsResponse.metrics.revenue.yesterday,
          thisMonth: metricsResponse.metrics.revenue.thisMonth
        },
        orders: {
          today: metricsResponse.metrics.orders.today,
          yesterday: metricsResponse.metrics.orders.yesterday,
          thisMonth: metricsResponse.metrics.orders.thisMonth
        },
        products: {
          total: metricsResponse.metrics.products.total,
          active: metricsResponse.metrics.products.active,
          lowStock: metricsResponse.metrics.products.lowStock
        }
      };
    }
  } catch (error) {
    console.warn('Error obteniendo métricas reales:', error);
  }

  // Fallback a datos simulados
  return {
    revenue: {
      today: 1250.50,
      yesterday: 980.25,
      thisMonth: 15420.75
    },
    orders: {
      today: 8,
      yesterday: 6,
      thisMonth: 145
    },
    products: {
      total: 25,
      active: 22,
      lowStock: 3
    }
  };
};

// Verificar conexión simple
export const checkSimpleConnection = async (): Promise<boolean> => {
  try {
    const response = await fetchShopifyData('/connection');
    return response?.success && response?.connected;
  } catch (error) {
    return false;
  }
};

// Hook simplificado
import { useState, useEffect } from 'react';

export const useSimpleShopify = () => {
  const [metrics, setMetrics] = useState<SimpleShopifyMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, connected] = await Promise.all([
        getSimpleMetrics(),
        checkSimpleConnection()
      ]);
      
      setMetrics(metricsData);
      setIsConnected(connected);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    metrics,
    isConnected,
    loading,
    refresh: loadData
  };
};
