import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Worker para procesar cola de mensajes masivos
 * Se ejecuta periódicamente o bajo demanda
 */

interface QueueMessage {
  id: string
  phone: string
  message: string
  media_url: string | null
  campaign_id: string | null
  recipient_id: string | null
}

async function sendWhatsAppMessage(
  phone: string,
  message: string,
  mediaUrl: string | null,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Llamar a la función de envío de WhatsApp
    const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        phone,
        message,
        media_url: mediaUrl
      }
    })

    if (error) throw error

    return {
      success: true,
      messageId: data.message_id
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function processMessage(message: QueueMessage, supabase: any): Promise<void> {
  console.log(`Processing message ${message.id} to ${message.phone}`)

  const result = await sendWhatsAppMessage(
    message.phone,
    message.message,
    message.media_url,
    supabase
  )

  if (result.success) {
    // Marcar como enviado
    await supabase.rpc('mark_message_sent', {
      message_id_param: message.id,
      whatsapp_message_id: result.messageId
    })

    console.log(`✅ Message ${message.id} sent successfully`)

    // Actualizar contador de campaña
    if (message.campaign_id) {
      await supabase
        .from('campaigns')
        .update({ sent_count: supabase.raw('sent_count + 1') })
        .eq('id', message.campaign_id)
    }
  } else {
    // Marcar como fallido y programar retry
    await supabase.rpc('mark_message_failed', {
      message_id_param: message.id,
      error_message_param: result.error
    })

    console.log(`❌ Message ${message.id} failed: ${result.error}`)

    // Actualizar contador de campaña
    if (message.campaign_id) {
      await supabase
        .from('campaigns')
        .update({ failed_count: supabase.raw('failed_count + 1') })
        .eq('id', message.campaign_id)
    }
  }
}

async function processBatch(
  userId: string,
  batchSize: number,
  supabase: any
): Promise<{ processed: number; succeeded: number; failed: number }> {
  console.log(`📦 Processing batch for user ${userId}, size: ${batchSize}`)

  // Obtener lote de mensajes
  const { data: messages, error } = await supabase.rpc('get_batch_from_queue', {
    user_id_param: userId,
    batch_size_param: batchSize
  })

  if (error) {
    console.error('Error fetching batch:', error)
    return { processed: 0, succeeded: 0, failed: 0 }
  }

  if (!messages || messages.length === 0) {
    console.log('No messages to process')
    return { processed: 0, succeeded: 0, failed: 0 }
  }

  console.log(`Found ${messages.length} messages to process`)

  let succeeded = 0
  let failed = 0

  // Procesar mensajes con control de velocidad
  for (const message of messages) {
    await processMessage(message, supabase)
    
    // Verificar el resultado
    const { data: processedMessage } = await supabase
      .from('message_queue')
      .select('status')
      .eq('id', message.id)
      .single()

    if (processedMessage?.status === 'sent') {
      succeeded++
    } else {
      failed++
    }

    // Delay entre mensajes para respetar rate limits
    // Por ejemplo, 10 mensajes por minuto = 6 segundos entre mensajes
    await new Promise(resolve => setTimeout(resolve, 6000))
  }

  return {
    processed: messages.length,
    succeeded,
    failed
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'process'

    // GET /batch-message-worker?action=process&user_id=xxx&batch_size=10
    if (action === 'process') {
      const userId = url.searchParams.get('user_id')
      const batchSize = parseInt(url.searchParams.get('batch_size') || '10')

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'user_id is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const result = await processBatch(userId, batchSize, supabaseClient)

      return new Response(
        JSON.stringify({
          success: true,
          result
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // GET /batch-message-worker?action=process-all-campaigns
    // Procesa todas las campañas activas
    if (action === 'process-all-campaigns') {
      const { data: campaigns } = await supabaseClient
        .from('campaigns')
        .select('id, user_id, send_rate, batch_size')
        .eq('status', 'processing')

      if (!campaigns || campaigns.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'No active campaigns to process'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const results = []

      for (const campaign of campaigns) {
        const result = await processBatch(
          campaign.user_id,
          campaign.batch_size,
          supabaseClient
        )

        results.push({
          campaign_id: campaign.id,
          ...result
        })

        // Verificar si la campaña se completó
        const { data: remainingMessages } = await supabaseClient
          .from('message_queue')
          .select('id')
          .eq('campaign_id', campaign.id)
          .eq('status', 'pending')
          .limit(1)

        if (!remainingMessages || remainingMessages.length === 0) {
          // Marcar campaña como completada
          await supabaseClient
            .from('campaigns')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', campaign.id)

          console.log(`✅ Campaign ${campaign.id} completed`)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          campaigns_processed: campaigns.length,
          results
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // GET /batch-message-worker?action=stats
    // Obtener estadísticas de la cola
    if (action === 'stats') {
      const userId = url.searchParams.get('user_id')

      let query = supabaseClient
        .from('message_queue')
        .select('status')

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: messages } = await query

      const stats = {
        total: messages?.length || 0,
        pending: messages?.filter((m: any) => m.status === 'pending').length || 0,
        processing: messages?.filter((m: any) => m.status === 'processing').length || 0,
        sent: messages?.filter((m: any) => m.status === 'sent').length || 0,
        failed: messages?.filter((m: any) => m.status === 'failed').length || 0,
      }

      return new Response(
        JSON.stringify({ stats }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Worker error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

