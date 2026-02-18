/**
 * 🚀 EasyDrop Integration Edge Function
 * 
 * Función para integrar automáticamente con EasyDrop cuando se confirma un pedido
 * 
 * @author NOMADEV Team
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderData {
  order_id: string;
  shop_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: {
    address1: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
  line_items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  total_price: string;
  order_number?: string;
}

interface EasyDropShipmentData {
  sender: {
    name: string;
    company?: string;
    address: string;
    city: string;
    region: string;
    postal_code: string;
    phone: string;
    email?: string;
  };
  recipient: {
    name: string;
    address: string;
    city: string;
    region: string;
    postal_code: string;
    phone: string;
    email?: string;
  };
  package: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    description: string;
    declared_value: number;
  };
  service: {
    type: string;
    insurance: boolean;
    signature_required: boolean;
  };
  references: {
    order_number: string;
    customer_id?: string;
    notes?: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderData, shopData } = await req.json()

    console.log('🚀 Procesando integración EasyDrop para pedido:', orderData.order_id)

    // 1. Verificar que el pedido esté confirmado
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderData.order_id)
      .single()

    if (orderError || !order) {
      throw new Error(`Pedido no encontrado: ${orderError?.message}`)
    }

    if (order.validation_status !== 'completed') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Pedido no confirmado aún' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 2. Obtener configuración de EasyDrop para la tienda
    const { data: shop, error: shopError } = await supabaseClient
      .from('shops')
      .select('*')
      .eq('id', orderData.shop_id)
      .single()

    if (shopError || !shop) {
      throw new Error(`Tienda no encontrada: ${shopError?.message}`)
    }

    // Verificar si la tienda tiene configuración de EasyDrop
    if (!shop.easydrop_config) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'EasyDrop no configurado para esta tienda' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const easydropConfig = shop.easydrop_config

    // 3. Preparar datos para EasyDrop
    const shipmentData = prepareEasyDropData(orderData, shopData, easydropConfig)

    // 4. Crear envío en EasyDrop
    const easydropResponse = await createEasyDropShipment(shipmentData, easydropConfig)

    if (!easydropResponse.success) {
      throw new Error(`Error creando envío en EasyDrop: ${easydropResponse.error}`)
    }

    // 5. Guardar información del envío en la base de datos
    const { error: shipmentError } = await supabaseClient
      .from('shipments')
      .insert({
        order_id: orderData.order_id,
        tracking_number: easydropResponse.trackingNumber,
        carrier: 'EasyDrop',
        status: 'pending',
        tracking_events: [{
          timestamp: new Date().toISOString(),
          location: 'Origen',
          status: 'created',
          description: 'Envío creado en EasyDrop'
        }]
      })

    if (shipmentError) {
      console.error('Error guardando envío:', shipmentError)
    }

    // 6. Actualizar estado del pedido
    await supabaseClient
      .from('orders')
      .update({
        order_status: 'shipped',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderData.order_id)

    // 7. Enviar Track ID por WhatsApp
    await sendTrackingViaWhatsApp(
      orderData.customer_phone,
      easydropResponse.trackingNumber,
      orderData.order_number || orderData.order_id,
      supabaseClient
    )

    // 8. Log de la operación
    await supabaseClient
      .from('webhook_logs')
      .insert({
        user_id: 'system',
        source: 'easydrop-integration',
        event: 'shipment_created',
        payload: {
          order_id: orderData.order_id,
          tracking_number: easydropResponse.trackingNumber,
          easydrop_response: easydropResponse
        },
        status: 'success'
      })

    console.log('✅ Integración EasyDrop completada exitosamente')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Envío creado exitosamente en EasyDrop',
        trackingNumber: easydropResponse.trackingNumber,
        labelUrl: easydropResponse.labelUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error en integración EasyDrop:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * 📦 Preparar datos para EasyDrop
 */
function prepareEasyDropData(
  orderData: OrderData, 
  shopData: any, 
  easydropConfig: any
): EasyDropShipmentData {
  const shippingAddress = orderData.shipping_address

  return {
    sender: {
      name: shopData.name || 'Tienda',
      company: shopData.company,
      address: shopData.address || 'Dirección de la tienda',
      city: shopData.city || 'Santiago',
      region: shopData.region || 'Metropolitana',
      postal_code: shopData.postal_code || '0000000',
      phone: shopData.phone || '+56900000000',
      email: shopData.email,
    },
    recipient: {
      name: orderData.customer_name,
      address: shippingAddress.address1,
      city: shippingAddress.city,
      region: shippingAddress.province,
      postal_code: shippingAddress.zip,
      phone: orderData.customer_phone,
      email: orderData.customer_email,
    },
    package: {
      weight: calculateOrderWeight(orderData.line_items),
      dimensions: {
        length: 30, // Valores por defecto, se pueden calcular mejor
        width: 20,
        height: 10,
      },
      description: generatePackageDescription(orderData.line_items),
      declared_value: parseFloat(orderData.total_price),
    },
    service: {
      type: 'standard',
      insurance: parseFloat(orderData.total_price) > 50000, // Seguro si > $50k CLP
      signature_required: true,
    },
    references: {
      order_number: orderData.order_number || orderData.order_id,
      customer_id: orderData.customer_phone,
      notes: `Pedido de ${orderData.customer_name} - NOMADEV`,
    },
  }
}

/**
 * 🚀 Crear envío en EasyDrop
 */
async function createEasyDropShipment(
  shipmentData: EasyDropShipmentData,
  config: any
): Promise<{ success: boolean; trackingNumber: string; labelUrl?: string; error?: string }> {
  try {
    const response = await fetch(`${config.baseUrl}/api/v1/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-API-Secret': config.apiSecret,
        'User-Agent': 'NOMADEV-EasyDrop-Integration/1.0.0',
      },
      body: JSON.stringify(shipmentData),
    })

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        trackingNumber: data.tracking_number,
        labelUrl: data.label_url,
      }
    } else {
      return {
        success: false,
        trackingNumber: '',
        error: data.message || 'Error creando envío',
      }
    }
  } catch (error) {
    return {
      success: false,
      trackingNumber: '',
      error: `Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    }
  }
}

/**
 * 📱 Enviar Track ID por WhatsApp
 */
async function sendTrackingViaWhatsApp(
  phoneNumber: string,
  trackingNumber: string,
  orderNumber: string,
  supabaseClient: any
): Promise<void> {
  try {
    const message = `🚚 ¡Tu pedido #${orderNumber} ha sido enviado!

📦 Número de seguimiento: ${trackingNumber}

Puedes rastrear tu envío en: https://tracking.easydrop.cl/${trackingNumber}

¡Gracias por tu compra! 🎉`

    // Llamar a la función de WhatsApp
    const { error } = await supabaseClient.functions.invoke('whatsapp-send', {
      body: {
        phoneNumber: phoneNumber,
        message: message,
        type: 'tracking'
      }
    })

    if (error) {
      console.error('Error enviando track ID por WhatsApp:', error)
    }
  } catch (error) {
    console.error('Error en envío de WhatsApp:', error)
  }
}

/**
 * ⚖️ Calcular peso total del pedido
 */
function calculateOrderWeight(lineItems: any[]): number {
  // Peso promedio por producto (se puede mejorar con datos reales)
  const averageWeightPerItem = 0.5 // kg
  const totalItems = lineItems.reduce((sum, item) => sum + item.quantity, 0)
  return totalItems * averageWeightPerItem
}

/**
 * 📝 Generar descripción del paquete
 */
function generatePackageDescription(lineItems: any[]): string {
  const items = lineItems.slice(0, 3).map(item => item.name).join(', ')
  const moreItems = lineItems.length > 3 ? ` y ${lineItems.length - 3} productos más` : ''
  return `Pedido: ${items}${moreItems}`
}
