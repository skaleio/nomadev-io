// backend-api.ts - Servicio para comunicarse con el backend
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Tipos para las respuestas del backend
export interface BackendResponse<T> {
  success: boolean;
  error?: string;
  code?: string;
  data?: T;
}

export interface ShopifyConnectionResponse {
  success: boolean;
  connected: boolean;
  shop?: {
    name: string;
    domain: string;
    email: string;
    currency: string;
    timezone: string;
  };
  error?: string;
  code?: string;
}

export interface ShopifyOrdersResponse {
  success: boolean;
  orders: any[];
  count: number;
  error?: string;
  code?: string;
}

export interface ShopifyProductsResponse {
  success: boolean;
  products: any[];
  count: number;
  error?: string;
  code?: string;
}

export interface ShopifyMetricsResponse {
  success: boolean;
  metrics: {
    revenue: {
      today: number;
      yesterday: number;
      thisMonth: number;
      lastMonth: number;
    };
    orders: {
      today: number;
      yesterday: number;
      thisMonth: number;
      lastMonth: number;
    };
    products: {
      total: number;
      active: number;
      lowStock: number;
    };
    conversion: {
      rate: number;
      trend: 'up' | 'down' | 'stable';
    };
    analytics: {
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
      totalProducts: number;
      lowStockProducts: number;
      conversionRate: number;
      topProducts: any[];
      recentOrders: any[];
      lowStockItems: any[];
      todayOrders: number;
      todayRevenue: number;
    };
  };
  error?: string;
  code?: string;
}

// Re-exportar tipos para compatibilidad
export type ShopifyAnalytics = ShopifyMetricsResponse['metrics']['analytics'];
export type ShopifyMetrics = Omit<ShopifyMetricsResponse['metrics'], 'analytics'>;

export interface ShopifyShopResponse {
  success: boolean;
  shop: any;
  error?: string;
  code?: string;
}

// Función helper para hacer peticiones al backend
const fetchFromBackend = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error en petición a ${endpoint}:`, error);
    throw error;
  }
};

// Servicio principal para comunicarse con el backend
export class BackendAPIService {
  // Verificar conexión con Shopify
  async checkConnection(): Promise<ShopifyConnectionResponse> {
    try {
      console.log('🔍 Verificando conexión con Shopify a través del backend...');
      const response = await fetchFromBackend<ShopifyConnectionResponse>('/api/shopify/connection');
      
      if (response.success && response.connected) {
        console.log('✅ Conexión exitosa con Shopify');
      } else {
        console.warn('⚠️ Problema de conexión con Shopify:', response.error);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error verificando conexión:', error);
      return {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'CONNECTION_ERROR'
      };
    }
  }

  // Obtener órdenes
  async getOrders(limit: number = 50, status: string = 'any', created_at_min?: string): Promise<ShopifyOrdersResponse> {
    try {
      console.log('📦 Obteniendo órdenes a través del backend...');
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        status,
        ...(created_at_min && { created_at_min })
      });

      const response = await fetchFromBackend<ShopifyOrdersResponse>(`/api/shopify/orders?${params}`);
      
      if (response.success) {
        console.log(`✅ Obtenidas ${response.count} órdenes`);
      } else {
        console.warn('⚠️ Error obteniendo órdenes:', response.error);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo órdenes:', error);
      return {
        success: false,
        orders: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'FETCH_ERROR'
      };
    }
  }

  // Obtener productos
  async getProducts(limit: number = 50): Promise<ShopifyProductsResponse> {
    try {
      console.log('🛍️ Obteniendo productos a través del backend...');
      
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await fetchFromBackend<ShopifyProductsResponse>(`/api/shopify/products?${params}`);
      
      if (response.success) {
        console.log(`✅ Obtenidos ${response.count} productos`);
      } else {
        console.warn('⚠️ Error obteniendo productos:', response.error);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      return {
        success: false,
        products: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'FETCH_ERROR'
      };
    }
  }

  // Obtener métricas del dashboard
  async getMetrics(): Promise<ShopifyMetricsResponse> {
    try {
      console.log('📊 Obteniendo métricas a través del backend...');
      
      const response = await fetchFromBackend<ShopifyMetricsResponse>('/api/shopify/metrics');
      
      if (response.success) {
        console.log('✅ Métricas obtenidas exitosamente');
      } else {
        console.warn('⚠️ Error obteniendo métricas:', response.error);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo métricas:', error);
      return {
        success: false,
        metrics: {
          revenue: { today: 0, yesterday: 0, thisMonth: 0, lastMonth: 0 },
          orders: { today: 0, yesterday: 0, thisMonth: 0, lastMonth: 0 },
          products: { total: 0, active: 0, lowStock: 0 },
          conversion: { rate: 0, trend: 'stable' },
          analytics: {
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
          }
        },
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'FETCH_ERROR'
      };
    }
  }

  // Obtener información de la tienda
  async getShopInfo(): Promise<ShopifyShopResponse> {
    try {
      console.log('🏪 Obteniendo información de la tienda a través del backend...');
      
      const response = await fetchFromBackend<ShopifyShopResponse>('/api/shopify/shop');
      
      if (response.success) {
        console.log('✅ Información de tienda obtenida');
      } else {
        console.warn('⚠️ Error obteniendo información de tienda:', response.error);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo información de tienda:', error);
      return {
        success: false,
        shop: null,
        error: error instanceof Error ? error.message : 'Error desconocido',
        code: 'FETCH_ERROR'
      };
    }
  }

  // Verificar salud del backend
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetchFromBackend<{ success: boolean; message: string }>('/api/health');
      return response.success;
    } catch (error) {
      console.error('❌ Backend no disponible:', error);
      return false;
    }
  }
}

// Instancia singleton
export const backendAPI = new BackendAPIService();
