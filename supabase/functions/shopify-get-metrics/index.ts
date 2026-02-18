import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyMetrics {
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

class ShopifyAPIClient {
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

  async getOrders(dateRange: string = '30d'): Promise<any[]> {
    const days = parseInt(dateRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const createdAtMin = startDate.toISOString();
    const response = await this.makeRequest<{ orders: any[] }>(`/orders.json?status=any&created_at_min=${createdAtMin}&limit=250`);

    return response.orders;
  }

  async getProducts(): Promise<any[]> {
    const response = await this.makeRequest<{ products: any[] }>(`/products.json?limit=250`);
    return response.products;
  }

  async getCustomers(dateRange: string = '30d'): Promise<any[]> {
    const days = parseInt(dateRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const createdAtMin = startDate.toISOString();
    const response = await this.makeRequest<{ customers: any[] }>(`/customers.json?created_at_min=${createdAtMin}&limit=250`);

    return response.customers;
  }

  async getMetrics(dateRange: string = '30d'): Promise<ShopifyMetrics> {
    try {
      console.log(`🔄 Obteniendo métricas de Shopify para rango: ${dateRange}`);

      // Obtener datos en paralelo para mejor performance
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

      console.log('✅ Métricas calculadas exitosamente');
      return metrics;
    } catch (error) {
      console.error('❌ Error obteniendo métricas de Shopify:', error);
      throw error;
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get request parameters
    const url = new URL(req.url);
    const dateRange = url.searchParams.get('dateRange') || '30d';

    // Get user's shop data
    const { data: shop, error: shopError } = await supabaseClient
      .from('shops')
      .select('shopify_domain, shopify_access_token')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (shopError || !shop) {
      console.log('No se encontró tienda activa para el usuario:', user.id);
      return new Response(
        JSON.stringify({ error: 'No hay tienda conectada' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Shopify client and get metrics
    const shopifyClient = new ShopifyAPIClient(shop.shopify_domain, shop.shopify_access_token);
    const metrics = await shopifyClient.getMetrics(dateRange);

    // Store metrics in cache table for faster future access
    try {
      await supabaseClient
        .from('shopify_metrics')
        .upsert({
          user_id: user.id,
          shop_domain: shop.shopify_domain,
          date_range: dateRange,
          metrics_data: metrics,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,shop_domain,date_range'
        });
    } catch (cacheError) {
      console.warn('Error guardando métricas en caché:', cacheError);
      // No fallar si no se puede guardar en caché
    }

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en shopify-get-metrics function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: 'Error obteniendo métricas de Shopify'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});