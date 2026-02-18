// @ts-ignore - Deno URL imports are valid in Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno URL imports are valid in Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderValidationData {
  clientId: string;
  messageId: string;
  date_time: string;
  etapaActual: 'Producto' | 'Dirección' | 'Monto' | 'Confirmación';
  mensajeCliente: string;
  pedidoCompleto: boolean;
  bloqueDestino: 'validacion' | 'trackid' | 'duda';
  // Datos del pedido
  numero_orden?: string;
  nombre_cliente?: string;
  producto_comprado?: string;
  direccion_cliente?: string;
  monto_total?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    const webhookData: OrderValidationData = JSON.parse(body)

    console.log('Webhook n8n recibido:', webhookData)

    // Create a Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Procesar según el tipo de bloque destino
    switch (webhookData.bloqueDestino) {
      case 'validacion':
        await processValidation(supabaseClient, webhookData)
        break
      case 'trackid':
        await processTracking(supabaseClient, webhookData)
        break
      case 'duda':
        await processDoubt(supabaseClient, webhookData)
        break
      default:
        console.log('Bloque destino no reconocido:', webhookData.bloqueDestino)
    }

    // Log webhook
    await supabaseClient
      .from('webhook_logs')
      .insert({
        user_id: 'system',
        source: 'n8n',
        event: 'order_validation',
        payload: webhookData,
        status: 'success'
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook procesado correctamente' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error procesando webhook n8n:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function processValidation(supabaseClient: any, data: OrderValidationData) {
  console.log('Procesando validación:', data)
  
  // Actualizar estado del pedido en la base de datos
  if (data.numero_orden) {
    const { error } = await supabaseClient
      .from('orders')
      .update({
        validation_stage: data.etapaActual,
        validation_status: 'in_progress',
        last_validation_message: data.mensajeCliente,
        updated_at: new Date().toISOString()
      })
      .eq('order_number', data.numero_orden)

    if (error) {
      console.error('Error actualizando pedido:', error)
    }
  }

  // Crear registro de interacción
  await supabaseClient
    .from('order_interactions')
    .insert({
      client_id: data.clientId,
      message_id: data.messageId,
      stage: data.etapaActual,
      message: data.mensajeCliente,
      interaction_type: 'validation',
      created_at: data.date_time
    })
}

async function processTracking(supabaseClient: any, data: OrderValidationData) {
  console.log('Procesando tracking:', data)
  
  if (data.numero_orden) {
    // Marcar pedido como validado y listo para envío
    const { error } = await supabaseClient
      .from('orders')
      .update({
        validation_stage: 'Confirmación',
        validation_status: 'completed',
        order_status: 'ready_for_shipping',
        last_validation_message: data.mensajeCliente,
        updated_at: new Date().toISOString()
      })
      .eq('order_number', data.numero_orden)

    if (error) {
      console.error('Error actualizando pedido para tracking:', error)
    }

    // 🚀 INTEGRACIÓN AUTOMÁTICA CON EASYDROP
    console.log('🚀 Iniciando integración automática con EasyDrop para pedido:', data.numero_orden)
    
    try {
      // Obtener datos completos del pedido
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select(`
          *,
          shops (
            *,
            easydrop_config
          )
        `)
        .eq('order_number', data.numero_orden)
        .single()

      if (orderError || !order) {
        console.error('Error obteniendo pedido para EasyDrop:', orderError)
        return
      }

      // Verificar si la tienda tiene configuración de EasyDrop
      if (!order.shops?.easydrop_config) {
        console.log('⚠️ EasyDrop no configurado para esta tienda, saltando integración')
        return
      }

      // Preparar datos para EasyDrop
      const easydropData = {
        order_id: order.id,
        shop_id: order.shop_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        shipping_address: order.shipping_address,
        line_items: order.items,
        total_price: order.total_amount.toString(),
        order_number: order.order_number || order.order_id
      }

      // Llamar a la función de integración EasyDrop
      const { data: easydropResult, error: easydropError } = await supabaseClient.functions.invoke(
        'easydrop-integration',
        {
          body: {
            orderData: easydropData,
            shopData: order.shops
          }
        }
      )

      if (easydropError) {
        console.error('❌ Error en integración EasyDrop:', easydropError)
        
        // Log del error
        await supabaseClient
          .from('webhook_logs')
          .insert({
            user_id: 'system',
            source: 'n8n-easydrop-integration',
            event: 'integration_error',
            payload: {
              order_number: data.numero_orden,
              error: easydropError.message
            },
            status: 'error'
          })
      } else {
        console.log('✅ Integración EasyDrop exitosa:', easydropResult)
        
        // Log del éxito
        await supabaseClient
          .from('webhook_logs')
          .insert({
            user_id: 'system',
            source: 'n8n-easydrop-integration',
            event: 'integration_success',
            payload: {
              order_number: data.numero_orden,
              tracking_number: easydropResult.trackingNumber
            },
            status: 'success'
          })
      }

    } catch (error) {
      console.error('❌ Error general en integración EasyDrop:', error)
    }
  }
}

async function processDoubt(supabaseClient: any, data: OrderValidationData) {
  console.log('Procesando duda:', data)
  
  // Crear registro de duda
  await supabaseClient
    .from('order_interactions')
    .insert({
      client_id: data.clientId,
      message_id: data.messageId,
      stage: data.etapaActual,
      message: data.mensajeCliente,
      interaction_type: 'doubt',
      created_at: data.date_time
    })

  // Aquí podrías enviar notificación al equipo de soporte
  // o crear un ticket de atención al cliente
}
