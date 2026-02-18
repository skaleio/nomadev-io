import { SHOPIFY_CONFIG, SHOPIFY_ENDPOINTS, getShopifyHeaders } from './shopify-config';

// Tipos para Shopify API
export interface ShopifyOrder {
  id: number;
  order_number: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string;
    product_id: number;
  }>;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  status: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string;
    inventory_quantity: number;
    inventory_management: string;
    inventory_policy: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
}

export interface ShopifyAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalProducts: number;
  lowStockProducts: number;
  conversionRate: number;
  topProducts: Array<{
    id: number;
    title: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: ShopifyOrder[];
  lowStockItems: Array<{
    id: number;
    title: string;
    sku: string;
    inventory: number;
  }>;
  todayOrders: number;
  todayRevenue: number;
}

export interface ShopifyMetrics {
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
}

// Servicio principal de Shopify API
export class ShopifyAPIService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = SHOPIFY_ENDPOINTS.baseUrl;
    this.headers = getShopifyHeaders();
  }

  // Obtener órdenes
  async getOrders(limit: number = 50, status: string = 'any', created_at_min?: string): Promise<ShopifyOrder[]> {
    try {
      let url = `${this.baseUrl}${SHOPIFY_ENDPOINTS.orders}?limit=${limit}&status=${status}`;
      if (created_at_min) {
        url += `&created_at_min=${created_at_min}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.orders || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      // En desarrollo, retornar datos simulados si hay problemas de CORS
      if (import.meta.env.DEV && error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('⚠️ Usando datos simulados para órdenes');
        const { mockOrders } = generateMockData();
        return mockOrders as ShopifyOrder[];
      }
      return [];
    }
  }

  // Obtener productos
  async getProducts(limit: number = 50): Promise<ShopifyProduct[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}${SHOPIFY_ENDPOINTS.products}?limit=${limit}`,
        {
          method: 'GET',
          headers: this.headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      // En desarrollo, retornar datos simulados si hay problemas de CORS
      if (import.meta.env.DEV && error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('⚠️ Usando datos simulados para productos');
        const { mockProducts } = generateMockData();
        return mockProducts as ShopifyProduct[];
      }
      return [];
    }
  }

  // Obtener órdenes de hoy
  async getTodayOrders(): Promise<ShopifyOrder[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      return await this.getOrders(250, 'any', todayISO);
    } catch (error) {
      console.error('Error getting today orders:', error);
      return [];
    }
  }

  // Obtener órdenes de ayer
  async getYesterdayOrders(): Promise<ShopifyOrder[]> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayISO = yesterday.toISOString();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      return await this.getOrders(250, 'any', yesterdayISO);
    } catch (error) {
      console.error('Error getting yesterday orders:', error);
      return [];
    }
  }

  // Obtener órdenes del mes actual
  async getThisMonthOrders(): Promise<ShopifyOrder[]> {
    try {
      const firstDay = new Date();
      firstDay.setDate(1);
      firstDay.setHours(0, 0, 0, 0);
      const firstDayISO = firstDay.toISOString();

      return await this.getOrders(250, 'any', firstDayISO);
    } catch (error) {
      console.error('Error getting this month orders:', error);
      return [];
    }
  }

  // Obtener métricas completas
  async getAnalytics(): Promise<ShopifyAnalytics> {
    try {
      const [todayOrders, yesterdayOrders, thisMonthOrders, products] = await Promise.all([
        this.getTodayOrders(),
        this.getYesterdayOrders(),
        this.getThisMonthOrders(),
        this.getProducts(250)
      ]);

      // Calcular métricas de hoy
      const todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
      const todayOrdersCount = todayOrders.length;

      // Calcular métricas de ayer
      const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
      const yesterdayOrdersCount = yesterdayOrders.length;

      // Calcular métricas del mes
      const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
      const thisMonthOrdersCount = thisMonthOrders.length;

      // Productos con stock bajo
      const lowStockItems = products.flatMap(product =>
        product.variants
          .filter(variant => 
            variant.inventory_management === 'shopify' && 
            variant.inventory_quantity <= 5
          )
          .map(variant => ({
            id: product.id,
            title: product.title,
            sku: variant.sku,
            inventory: variant.inventory_quantity
          }))
      );

      // Top productos por ventas
      const productSales = new Map<number, { title: string; sales: number; revenue: number }>();
      
      thisMonthOrders.forEach(order => {
        order.line_items.forEach(item => {
          const existing = productSales.get(item.product_id) || { 
            title: item.title, 
            sales: 0, 
            revenue: 0 
          };
          existing.sales += item.quantity;
          existing.revenue += parseFloat(item.price) * item.quantity;
          productSales.set(item.product_id, existing);
        });
      });

      const topProducts = Array.from(productSales.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);

      return {
        totalOrders: thisMonthOrdersCount,
        totalRevenue: thisMonthRevenue,
        averageOrderValue: thisMonthOrdersCount > 0 ? thisMonthRevenue / thisMonthOrdersCount : 0,
        totalProducts: products.length,
        lowStockProducts: lowStockItems.length,
        conversionRate: 3.2, // Esto se calcularía con datos de analytics
        topProducts,
        recentOrders: todayOrders.slice(0, 10),
        lowStockItems: lowStockItems.slice(0, 10),
        todayOrders: todayOrdersCount,
        todayRevenue: todayRevenue
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  // Obtener métricas para el dashboard
  async getDashboardMetrics(): Promise<ShopifyMetrics> {
    try {
      const [todayOrders, yesterdayOrders, thisMonthOrders, products] = await Promise.all([
        this.getTodayOrders(),
        this.getYesterdayOrders(),
        this.getThisMonthOrders(),
        this.getProducts(250)
      ]);

      // Calcular revenue
      const todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
      const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
      const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);

      // Calcular órdenes
      const todayOrdersCount = todayOrders.length;
      const yesterdayOrdersCount = yesterdayOrders.length;
      const thisMonthOrdersCount = thisMonthOrders.length;

      // Productos
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.status === 'active').length;
      const lowStockProducts = products.flatMap(p => p.variants)
        .filter(v => v.inventory_management === 'shopify' && v.inventory_quantity <= 5).length;

      // Tasa de conversión (simulada)
      const conversionRate = 3.2;
      const conversionTrend = todayOrdersCount > yesterdayOrdersCount ? 'up' : 'down';

      return {
        revenue: {
          today: todayRevenue,
          yesterday: yesterdayRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: thisMonthRevenue * 0.9 // Simulado
        },
        orders: {
          today: todayOrdersCount,
          yesterday: yesterdayOrdersCount,
          thisMonth: thisMonthOrdersCount,
          lastMonth: Math.floor(thisMonthOrdersCount * 0.9) // Simulado
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts
        },
        conversion: {
          rate: conversionRate,
          trend: conversionTrend
        }
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  // Verificar conexión
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${SHOPIFY_ENDPOINTS.shop}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        console.error(`Shopify API Error: ${response.status} ${response.statusText}`);
        if (response.status === 401) {
          console.error('Error de autenticación: Token de acceso inválido o expirado');
        } else if (response.status === 403) {
          console.error('Error de permisos: El token no tiene los permisos necesarios');
        } else if (response.status === 429) {
          console.error('Límite de API excedido: Demasiadas peticiones');
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking Shopify connection:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Error de red: No se pudo conectar con Shopify');
        // En desarrollo, si hay problemas de CORS, usar modo simulado
        if (import.meta.env.DEV) {
          console.warn('⚠️ Modo desarrollo: Usando datos simulados debido a problemas de CORS');
          return true; // Retornar true para activar modo simulado
        }
      }
      return false;
    }
  }

  // Obtener información de la tienda
  async getShopInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${SHOPIFY_ENDPOINTS.shop}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.shop;
    } catch (error) {
      console.error('Error getting shop info:', error);
      throw error;
    }
  }
}

// Datos simulados para desarrollo - vacíos hasta conectar con Shopify
const generateMockData = () => {
  const mockOrders: any[] = [];
  const mockProducts: any[] = [];

  return { mockOrders, mockProducts };
};

// Instancia singleton
export const shopifyAPI = new ShopifyAPIService();
