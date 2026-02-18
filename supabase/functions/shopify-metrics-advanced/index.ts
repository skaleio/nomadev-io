import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Clase ShopifyMetricsService - Replica exactamente el flujo N8N
class ShopifyMetricsService {
  private shopDomain: string;
  private accessToken: string;
  private baseUrl: string;

  constructor(shopDomain: string, accessToken: string) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.baseUrl = `https://${shopDomain}/admin/api/2023-10`;
  }

  // Calcular rangos de fecha - Replica exactamente el nodo "Calcular Fechas" de N8N
  private calculateDateRange(dateRange: string = '30d') {
    const now = new Date();
    let startDate: Date;
    
    switch(dateRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
      timestamp: now.toISOString(),
      date_range: dateRange
    };
  }

  // Obtener Orders - Replica exactamente el nodo "Get Orders" de N8N
  private async getOrders(startDate: string, endDate: string) {
    const response = await fetch(`${this.baseUrl}/orders.json?` +
      `created_at_min=${startDate}&` +
      `created_at_max=${endDate}&` +
      `status=any&` +
      `limit=250&` +
      `fields=id,created_at,total_price,currency,financial_status,fulfillment_status,line_items,customer,tags`, {
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener órdenes: ${response.status}`);
    }

    const data = await response.json();
    return data.orders || [];
  }

  // Obtener Products - Replica exactamente el nodo "Get Products" de N8N
  private async getProducts() {
    const response = await fetch(`${this.baseUrl}/products.json?` +
      `limit=250&` +
      `fields=id,title,handle,variants,vendor,product_type,status`, {
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener productos: ${response.status}`);
    }

    const data = await response.json();
    return data.products || [];
  }

  // Obtener Customers - Replica exactamente el nodo "Get Customers" de N8N
  private async getCustomers(startDate: string) {
    const response = await fetch(`${this.baseUrl}/customers.json?` +
      `created_at_min=${startDate}&` +
      `limit=250&` +
      `fields=id,email,created_at,updated_at,orders_count,total_spent,state`, {
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error al obtener clientes: ${response.status}`);
    }

    const data = await response.json();
    return data.customers || [];
  }

  // Procesar Métricas - Replica exactamente el nodo "Procesar Métricas" de N8N
  private processMetrics(orders: any[], products: any[], customers: any[], dateRange: string) {
    // MÉTRICAS DE VENTAS
    const totalVentas = orders.reduce((sum, order) => {
      return sum + parseFloat(order.total_price || 0);
    }, 0);

    const numerosPedidos = orders.length;
    const ticketPromedio = numerosPedidos > 0 ? totalVentas / numerosPedidos : 0;

    // Ventas por día para gráfico
    const ventasPorDia: { [key: string]: number } = {};
    orders.forEach(order => {
      const fecha = new Date(order.created_at).toISOString().split('T')[0];
      ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + parseFloat(order.total_price || 0);
    });

    // PRODUCTOS MÁS VENDIDOS
    const productosVendidos: { [key: string]: number } = {};
    orders.forEach(order => {
      if (order.line_items && Array.isArray(order.line_items)) {
        order.line_items.forEach(item => {
          const productId = item.product_id;
          if (productId) {
            productosVendidos[productId] = (productosVendidos[productId] || 0) + (item.quantity || 0);
          }
        });
      }
    });

    const topProductos = Object.entries(productosVendidos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id && p.id.toString() === productId);
        const revenue = orders.reduce((sum, order) => {
          if (order.line_items && Array.isArray(order.line_items)) {
            const item = order.line_items.find(li => li.product_id && li.product_id.toString() === productId);
            return sum + (item ? parseFloat(item.price || 0) * (item.quantity || 0) : 0);
          }
          return sum;
        }, 0);
        
        return {
          id: productId,
          name: product?.title || 'Producto Desconocido',
          quantity_sold: quantity,
          revenue: Math.round(revenue * 100) / 100
        };
      });

    // MÉTRICAS DE INVENTARIO
    let stockTotal = 0;
    let productosConBajoStock = 0;
    let valorInventario = 0;

    products.forEach(product => {
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(variant => {
          const stock = variant.inventory_quantity || 0;
          stockTotal += stock;
          valorInventario += stock * parseFloat(variant.price || 0);
          if (stock < 10) productosConBajoStock++;
        });
      }
    });

    // MÉTRICAS DE CLIENTES
    const nuevosClientes = customers.length;
    const clientesReincidentes = customers.filter(c => (c.orders_count || 0) > 1).length;
    const tasaRetencion = nuevosClientes > 0 ? (clientesReincidentes / nuevosClientes) * 100 : 0;

    // MÉTRICAS DE PERFORMANCE
    const pedidosPagados = orders.filter(o => o.financial_status === 'paid').length;
    const pedidosEnviados = orders.filter(o => o.fulfillment_status === 'fulfilled').length;
    const tasaConversion = numerosPedidos > 0 ? (pedidosPagados / numerosPedidos) * 100 : 0;

    const { start_date, end_date } = this.calculateDateRange(dateRange);

    // CONSTRUIR RESPUESTA FINAL - Exactamente como en N8N
    return {
      timestamp: new Date().toISOString(),
      period: {
        start: start_date,
        end: end_date
      },
      ventas: {
        total_revenue: Math.round(totalVentas * 100) / 100,
        total_orders: numerosPedidos,
        average_order_value: Math.round(ticketPromedio * 100) / 100,
        daily_sales: Object.entries(ventasPorDia).map(([date, amount]) => ({
          date,
          amount: Math.round(amount * 100) / 100
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      },
      productos: {
        top_products: topProductos,
        total_stock: stockTotal,
        low_stock_products: productosConBajoStock,
        inventory_value: Math.round(valorInventario * 100) / 100
      },
      clientes: {
        new_customers: nuevosClientes,
        returning_customers: clientesReincidentes,
        retention_rate: Math.round(tasaRetencion * 100) / 100
      },
      performance: {
        conversion_rate: Math.round(tasaConversion * 100) / 100,
        fulfilled_orders: pedidosEnviados,
        fulfillment_rate: numerosPedidos > 0 ? Math.round((pedidosEnviados / numerosPedidos) * 10000) / 100 : 0
      }
    };
  }

  // Obtener Métricas Completas - Replica todo el flujo N8N
  async getFullMetrics(dateRange: string = '30d') {
    try {
      // Paso 1: Calcular fechas (nodo "Calcular Fechas")
      const { start_date, end_date } = this.calculateDateRange(dateRange);
      
      // Paso 2: Obtener datos en paralelo (nodos "Get Orders", "Get Products", "Get Customers")
      const [orders, products, customers] = await Promise.all([
        this.getOrders(start_date, end_date),
        this.getProducts(),
        this.getCustomers(start_date)
      ]);

      // Paso 3: Procesar métricas (nodo "Procesar Métricas")
      const metrics = this.processMetrics(orders, products, customers, dateRange);

      return metrics;
    } catch (error) {
      console.error('Error en ShopifyMetricsService:', error);
      throw error;
    }
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricsRequest {
  date_range?: '7d' | '30d' | '90d';
  save_snapshot?: boolean;
}

interface ShopifyMetrics {
  timestamp: string;
  period: {
    start: string;
    end: string;
  };
  date_range: string;
  ventas: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    daily_sales: Array<{
      date: string;
      amount: number;
    }>;
  };
  productos: {
    top_products: Array<{
      id: string;
      name: string;
      quantity_sold: number;
      revenue: number;
    }>;
    total_stock: number;
    low_stock_products: number;
    inventory_value: number;
  };
  clientes: {
    new_customers: number;
    returning_customers: number;
    retention_rate: number;
  };
  performance: {
    conversion_rate: number;
    fulfilled_orders: number;
    fulfillment_rate: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get the session or user object
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

    // Parse request body
    const body: MetricsRequest = await req.json();
    const dateRange = body.date_range || '30d';
    const saveSnapshot = body.save_snapshot !== false; // Default to true

    // Get user's shop credentials from database
    const { data: shopData, error: shopError } = await supabaseClient
      .from('shops')
      .select('id, shopify_access_token, shopify_domain, shop_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (shopError || !shopData) {
      console.error('Error getting shop data:', shopError);
      return new Response(
        JSON.stringify({ 
          error: 'No hay tienda conectada. Conecta tu tienda Shopify primero.',
          details: 'Ve a la página de configuración para conectar tu tienda'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const shopifyToken = shopData.shopify_access_token;
    const shopifyStore = shopData.shopify_domain;
    const shopId = shopData.id;
    
    if (!shopifyToken || !shopifyStore) {
      throw new Error('Credenciales de Shopify no encontradas en la base de datos');
    }

    // Usar el servicio escalable que replica exactamente el flujo N8N
    const metricsService = new ShopifyMetricsService(shopifyStore, shopifyToken);
    const metrics = await metricsService.getFullMetrics(dateRange);

    // Save snapshot to database if requested
    if (saveSnapshot) {
      const { error: insertError } = await supabaseClient
        .from('shopify_metrics_snapshots')
        .insert({
          user_id: user.id,
          shop_id: shopId,
          period_start: metrics.period.start,
          period_end: metrics.period.end,
          date_range: dateRange,
          metrics: metrics
        });

      if (insertError) {
        console.error('Error saving metrics snapshot:', insertError);
        // Don't fail the request if snapshot save fails
      }
    }

    console.log('Advanced metrics calculated successfully');

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en shopify-metrics-advanced function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Revisa las credenciales de Shopify y que la API esté habilitada'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
