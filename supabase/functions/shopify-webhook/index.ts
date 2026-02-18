import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Verify Shopify webhook signature
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body, 'utf8')
  const hash = hmac.digest('base64')
  return hash === signature
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const eventType = url.pathname.split('/').pop()
    const signature = req.headers.get('X-Shopify-Hmac-Sha256')
    const body = await req.text()

    if (!signature || !eventType) {
      return new Response(
        JSON.stringify({ error: 'Firma o tipo de evento faltante' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET')
    if (!webhookSecret || !verifyWebhookSignature(body, signature, webhookSecret)) {
      return new Response(
        JSON.stringify({ error: 'Firma de webhook inválida' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const webhookData = JSON.parse(body)
    const shopDomain = req.headers.get('X-Shopify-Shop-Domain')

    if (!shopDomain) {
      return new Response(
        JSON.stringify({ error: 'Dominio de tienda faltante' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the shop
    const { data: shop, error: shopError } = await supabaseClient
      .from('shops')
      .select('*')
      .eq('shopify_domain', shopDomain)
      .single()

    if (shopError || !shop) {
      console.error('Tienda no encontrada:', shopDomain)
      return new Response(
        JSON.stringify({ error: 'Tienda no encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Process different webhook events
    switch (eventType) {
      case 'orders/create':
        await processOrderCreate(supabaseClient, webhookData, shop)
        break
      case 'orders/updated':
        await processOrderUpdate(supabaseClient, webhookData, shop)
        break
      case 'orders/paid':
        await processOrderPaid(supabaseClient, webhookData, shop)
        break
      case 'orders/cancelled':
        await processOrderCancelled(supabaseClient, webhookData, shop)
        break
      default:
        console.log(`Evento no manejado: ${eventType}`)
    }

    // Log webhook
    await supabaseClient
      .from('webhook_logs')
      .insert({
        user_id: shop.user_id,
        source: 'shopify',
        event: eventType,
        payload: webhookData,
        status: 'success'
      })

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error procesando webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function processOrderCreate(supabaseClient: any, orderData: any, shop: any) {
  // Check if order already exists
  const { data: existingOrder } = await supabaseClient
    .from('orders')
    .select('id')
    .eq('shopify_order_id', orderData.id.toString())
    .single()

  if (existingOrder) {
    return // Order already exists
  }

  // Create customer if not exists
  let customerId = null
  if (orderData.customer) {
    const { data: existingCustomer } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('shopify_customer_id', orderData.customer.id.toString())
      .single()

    if (!existingCustomer) {
      const { data: newCustomer } = await supabaseClient
        .from('customers')
        .insert({
          shop_id: shop.id,
          shopify_customer_id: orderData.customer.id.toString(),
          email: orderData.customer.email,
          phone: orderData.customer.phone,
          first_name: orderData.customer.first_name,
          last_name: orderData.customer.last_name,
          total_spent: parseFloat(orderData.customer.total_spent || '0'),
          orders_count: orderData.customer.orders_count || 0
        })
        .select()
        .single()

      customerId = newCustomer?.id
    } else {
      customerId = existingCustomer.id
    }
  }

  // Create order
  await supabaseClient
    .from('orders')
    .insert({
      shop_id: shop.id,
      customer_id: customerId,
      shopify_order_id: orderData.id.toString(),
      order_number: orderData.order_number,
      customer_email: orderData.email,
      customer_phone: orderData.phone,
      total_price: parseFloat(orderData.total_price),
      currency: orderData.currency,
      status: mapOrderStatus(orderData.financial_status),
      fulfillment_status: orderData.fulfillment_status,
      validation_status: 'PENDING'
    })
}

async function processOrderUpdate(supabaseClient: any, orderData: any, shop: any) {
  await supabaseClient
    .from('orders')
    .update({
      status: mapOrderStatus(orderData.financial_status),
      fulfillment_status: orderData.fulfillment_status,
      total_price: parseFloat(orderData.total_price)
    })
    .eq('shopify_order_id', orderData.id.toString())
}

async function processOrderPaid(supabaseClient: any, orderData: any, shop: any) {
  await supabaseClient
    .from('orders')
    .update({
      status: 'PROCESSING',
      validation_status: 'VALIDATED'
    })
    .eq('shopify_order_id', orderData.id.toString())
}

async function processOrderCancelled(supabaseClient: any, orderData: any, shop: any) {
  await supabaseClient
    .from('orders')
    .update({
      status: 'CANCELLED'
    })
    .eq('shopify_order_id', orderData.id.toString())
}

function mapOrderStatus(shopifyStatus: string): string {
  switch (shopifyStatus) {
    case 'pending':
      return 'PENDING'
    case 'authorized':
    case 'partially_paid':
      return 'PROCESSING'
    case 'paid':
      return 'PROCESSING'
    case 'partially_refunded':
    case 'refunded':
      return 'REFUNDED'
    case 'voided':
      return 'CANCELLED'
    default:
      return 'PENDING'
  }
}

