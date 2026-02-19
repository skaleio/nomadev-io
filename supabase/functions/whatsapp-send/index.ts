import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    const { phoneNumber, message, orderId, shopId } = await req.json()

    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: 'Número de teléfono y mensaje son requeridos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user owns the shop
    if (shopId) {
      const { data: shop, error: shopError } = await supabaseClient
        .from('shops')
        .select('id')
        .eq('id', shopId)
        .eq('user_id', user.id)
        .single()

      if (shopError || !shop) {
        return new Response(
          JSON.stringify({ error: 'Tienda no encontrada o no autorizada' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Get or create conversation
    let conversationId
    const { data: existingConversation } = await supabaseClient
      .from('conversations')
      .select('id')
      .eq('phone_number', phoneNumber)
      .eq('user_id', user.id)
      .eq('shop_id', shopId)
      .single()

    if (existingConversation) {
      conversationId = existingConversation.id
    } else {
      const { data: newConversation, error: conversationError } = await supabaseClient
        .from('conversations')
        .insert({
          user_id: user.id,
          shop_id: shopId,
          phone_number: phoneNumber,
          order_id: orderId,
          status: 'ACTIVE'
        })
        .select()
        .single()

      if (conversationError) {
        console.error('Error creando conversación:', conversationError)
        return new Response(
          JSON.stringify({ error: 'Error creando conversación' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      conversationId = newConversation.id
    }

    // WhatsApp: se usará la API oficial de Meta cuando esté configurada
    const messageId = `msg_${Date.now()}`

    // Save message to database
    const { data: savedMessage, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        content: message,
        type: 'TEXT',
        direction: 'OUTBOUND',
        status: 'SENT'
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error guardando mensaje:', messageError)
    }

    // Update conversation last message
    await supabaseClient
      .from('conversations')
      .update({ last_message: new Date().toISOString() })
      .eq('id', conversationId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: messageId,
        conversationId: conversationId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error en whatsapp-send:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

