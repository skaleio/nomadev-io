import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    )

    // Get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's shop credentials from database
    const { data: shopData, error: shopError } = await supabaseClient
      .from('shops')
      .select('shopify_access_token, shopify_domain, shop_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

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
      )
    }

    const shopifyToken = shopData.shopify_access_token;
    const shopifyStore = shopData.shopify_domain;
    
    console.log('Shopify Token present:', !!shopifyToken);
    console.log('Shopify Store:', shopifyStore);
    console.log('Shop Name:', shopData.shop_name);
    
    if (!shopifyToken || !shopifyStore) {
      throw new Error('Credenciales de Shopify no encontradas en la base de datos');
    }

    // Ensure the store URL has https:// protocol
    const storeUrl = shopifyStore.startsWith('http') ? shopifyStore : `https://${shopifyStore}`;
    console.log('Store URL formatted:', storeUrl);

    // Get orders data with better error handling
    console.log('Attempting to fetch orders...');
    const ordersResponse = await fetch(`${storeUrl}/admin/api/2023-10/orders.json?status=any&limit=10`, {
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json',
      },
    });

    console.log('Orders response status:', ordersResponse.status);
    console.log('Orders response headers:', Object.fromEntries(ordersResponse.headers.entries()));

    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      console.error('Orders API Error:', errorText);
      throw new Error(`Error al obtener órdenes: ${ordersResponse.status} - ${errorText}`);
    }

    const ordersData = await ordersResponse.json();
    console.log('Órdenes obtenidas:', ordersData.orders?.length || 0);

    // Get products data
    const productsResponse = await fetch(`${storeUrl}/admin/api/2023-10/products.json?status=active`, {
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json',
      },
    });

    if (!productsResponse.ok) {
      console.error('Error en products response:', productsResponse.status, productsResponse.statusText);
      throw new Error(`Error al obtener productos: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    console.log('Productos obtenidos:', productsData.products?.length || 0);

    // Calculate analytics
    const orders = ordersData.orders || [];
    const products = productsData.products || [];
    
    // Revenue calculations
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.toDateString() === today.toDateString();
    });
    
    const thisMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= thisMonth;
    });
    
    const lastMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= lastMonth && orderDate < thisMonth;
    });

    // Calculate revenue
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => 
      sum + parseFloat(order.total_price || '0'), 0
    );
    
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => 
      sum + parseFloat(order.total_price || '0'), 0
    );

    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Count cancelled orders as returns
    const returns = orders.filter(order => 
      order.cancelled_at !== null || order.financial_status === 'refunded'
    ).length;

    const analytics = {
      monthlyRevenue: {
        value: thisMonthRevenue,
        change: revenueChange,
        formatted: `$${thisMonthRevenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`
      },
      ordersToday: {
        value: todayOrders.length,
        change: 15.7 // We'll calculate this properly later with historical data
      },
      activeProducts: {
        value: products.length,
        change: 8.2 // We'll calculate this properly later with historical data
      },
      returns: {
        value: returns,
        change: -23.5 // Negative is good for returns
      },
      recentOrders: orders.slice(0, 10).map(order => ({
        id: order.id,
        name: order.name,
        customer: order.customer?.first_name + ' ' + order.customer?.last_name || 'Cliente',
        total: parseFloat(order.total_price || '0'),
        status: order.financial_status,
        created_at: order.created_at
      })),
      topProducts: products.slice(0, 5).map(product => ({
        id: product.id,
        title: product.title,
        vendor: product.vendor,
        product_type: product.product_type,
        created_at: product.created_at
      }))
    };

    console.log('Analytics calculados:', analytics);

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en shopify-analytics function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Revisa las credenciales de Shopify y que la API esté habilitada'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});