import { supabase } from '@/integrations/supabase/client';

export interface ShopifyMetrics {
  ventas: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    orders_today: number;
    revenue_today: number;
  };
  productos: {
    total_products: number;
    published_products: number;
    low_stock_products: number;
    top_products: Array<{
      id: string;
      name: string;
      quantity_sold: number;
      revenue: number;
    }>;
    inventory_value: number;
  };
  clientes: {
    total_customers: number;
    new_customers: number;
    returning_customers: number;
    retention_rate: number;
  };
  timestamp: string;
}

export interface ShopifyShop {
  id: string;
  name: string;
  domain: string;
  email: string;
  currency: string;
  timezone: string;
  plan_name: string;
}

export class ShopifyAPIClient {
  private baseUrl: string;
  private accessToken: string;
  private apiVersion = '2023-10';

  constructor(shopDomain: string, accessToken: string) {
    this.baseUrl = `https://${shopDomain}/admin/api/${this.apiVersion}`;
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API Error (${response.status}):`, errorText);
      throw new Error(`Shopify API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Obtener información de la tienda
  async getShop(): Promise<ShopifyShop> {
    const response = await this.makeRequest<{ shop: any }>('/shop.json');
    return {
      id: response.shop.id.toString(),
      name: response.shop.name,
      domain: response.shop.domain,
      email: response.shop.email,
      currency: response.shop.currency,
      timezone: response.shop.timezone,
      plan_name: response.shop.plan_name,
    };
  }

  // Obtener órdenes en un rango de fechas
  async getOrders(dateRange: '7d' | '30d' | '90d' = '30d'): Promise<any[]> {
    const days = parseInt(dateRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const createdAtMin = startDate.toISOString();
    const response = await this.makeRequest<{ orders: any[] }>(`/orders.json?status=any&created_at_min=${createdAtMin}&limit=250`);

    return response.orders;
  }

  // Obtener productos
  async getProducts(limit: number = 250): Promise<any[]> {
    const response = await this.makeRequest<{ products: any[] }>(`/products.json?limit=${limit}`);
    return response.products;
  }

  // Obtener clientes
  async getCustomers(dateRange: '7d' | '30d' | '90d' = '30d'): Promise<any[]> {
    const days = parseInt(dateRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const createdAtMin = startDate.toISOString();
    const response = await this.makeRequest<{ customers: any[] }>(`/customers.json?created_at_min=${createdAtMin}&limit=250`);

    return response.customers;
  }

  // Calcular métricas completas
  async getMetrics(dateRange: '7d' | '30d' | '90d' = '30d'): Promise<ShopifyMetrics> {
    try {
      console.log(`🔄 Obteniendo métricas de Shopify para rango: ${dateRange}`);

      // Obtener datos en paralelo
      const [orders, products, customers] = await Promise.all([
        this.getOrders(dateRange),
        this.getProducts(),
        this.getCustomers(dateRange),
      ]);

      console.log(`📊 Datos obtenidos: ${orders.length} órdenes, ${products.length} productos, ${customers.length} clientes`);

      // Calcular métricas de ventas
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + parseFloat(order.total_price || '0');
      }, 0);

      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      // Órdenes de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const ordersToday = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= today;
      });

      const revenueToday = ordersToday.reduce((sum, order) => {
        return sum + parseFloat(order.total_price || '0');
      }, 0);

      // Productos con bajo stock (menos de 10 unidades)
      let lowStockProducts = 0;
      let inventoryValue = 0;

      products.forEach(product => {
        product.variants.forEach((variant: any) => {
          const inventory = parseInt(variant.inventory_quantity || '0');
          if (inventory < 10) {
            lowStockProducts++;
          }
          inventoryValue += inventory * parseFloat(variant.price || '0');
        });
      });

      // Calcular productos más vendidos
      const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

      orders.forEach(order => {
        order.line_items.forEach((item: any) => {
          const productId = item.product_id?.toString();
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = {
                name: item.title || 'Producto sin nombre',
                quantity: 0,
                revenue: 0
              };
            }
            productSales[productId].quantity += parseInt(item.quantity || '0');
            productSales[productId].revenue += parseFloat(item.price || '0') * parseInt(item.quantity || '0');
          }
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({
          id,
          name: data.name,
          quantity_sold: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calcular métricas de clientes
      const allCustomerIds = new Set(orders.map(order => order.customer?.id).filter(Boolean));
      const newCustomerIds = new Set(customers.map(customer => customer.id));
      const returningCustomers = allCustomerIds.size - newCustomerIds.size;
      const retentionRate = allCustomerIds.size > 0 ? (returningCustomers / allCustomerIds.size) * 100 : 0;

      const metrics: ShopifyMetrics = {
        ventas: {
          total_revenue: Math.round(totalRevenue * 100) / 100,
          total_orders: orders.length,
          average_order_value: Math.round(averageOrderValue * 100) / 100,
          orders_today: ordersToday.length,
          revenue_today: Math.round(revenueToday * 100) / 100,
        },
        productos: {
          total_products: products.length,
          published_products: products.filter(p => p.status === 'active').length,
          low_stock_products: lowStockProducts,
          top_products: topProducts,
          inventory_value: Math.round(inventoryValue * 100) / 100,
        },
        clientes: {
          total_customers: allCustomerIds.size,
          new_customers: newCustomerIds.size,
          returning_customers: returningCustomers,
          retention_rate: Math.round(retentionRate * 100) / 100,
        },
        timestamp: new Date().toISOString(),
      };

      console.log('✅ Métricas calculadas exitosamente:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Error obteniendo métricas de Shopify:', error);
      throw error;
    }
  }

  // Crear webhook
  async createWebhook(topic: string, address: string): Promise<any> {
    const webhookData = {
      webhook: {
        topic,
        address,
        format: 'json'
      }
    };

    return this.makeRequest('/webhooks.json', {
      method: 'POST',
      body: JSON.stringify(webhookData)
    });
  }

  // Listar webhooks existentes
  async getWebhooks(): Promise<any[]> {
    const response = await this.makeRequest<{ webhooks: any[] }>('/webhooks.json');
    return response.webhooks;
  }
}

// Función helper para obtener el cliente para un usuario específico
export async function getShopifyClient(userId: string): Promise<ShopifyAPIClient | null> {
  try {
    const { data: shop, error } = await supabase
      .from('shops')
      .select('shopify_domain, shopify_access_token')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !shop) {
      console.log('No se encontró tienda activa para el usuario:', userId);
      return null;
    }

    return new ShopifyAPIClient(shop.shopify_domain, shop.shopify_access_token);
  } catch (error) {
    console.error('Error creando cliente Shopify:', error);
    return null;
  }
}

// Función para obtener métricas completas de un usuario
export async function getUserShopifyMetrics(userId: string, dateRange: '7d' | '30d' | '90d' = '30d'): Promise<ShopifyMetrics | null> {
  try {
    const client = await getShopifyClient(userId);
    if (!client) {
      return null;
    }

    return await client.getMetrics(dateRange);
  } catch (error) {
    console.error('Error obteniendo métricas del usuario:', error);
    throw error;
  }
}