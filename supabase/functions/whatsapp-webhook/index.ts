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
    const body = await req.text()
    const webhookData = JSON.parse(body)

    // Create a Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process different types of WhatsApp messages
    if (webhookData.event === 'messages.upsert') {
      await processIncomingMessage(supabaseClient, webhookData.data)
    } else if (webhookData.event === 'messages.update') {
      await processMessageUpdate(supabaseClient, webhookData.data)
    }

    // Log webhook
    await supabaseClient
      .from('webhook_logs')
      .insert({
        user_id: 'system', // System webhook
        source: 'evolution',
        event: webhookData.event,
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
    console.error('Error procesando webhook de WhatsApp:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function processIncomingMessage(supabaseClient: any, messageData: any) {
  const message = messageData.message
  const phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '')
  
  // Find conversation by phone number
  const { data: conversation, error: conversationError } = await supabaseClient
    .from('conversations')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('status', 'ACTIVE')
    .single()

  if (conversationError || !conversation) {
    console.log(`Conversación no encontrada para ${phoneNumber}`)
    return
  }

  // Determine message type
  let messageType = 'TEXT'
  let content = message.message?.conversation || ''

  if (message.message?.imageMessage) {
    messageType = 'IMAGE'
    content = message.message.imageMessage.caption || '[Imagen]'
  } else if (message.message?.documentMessage) {
    messageType = 'DOCUMENT'
    content = message.message.documentMessage.fileName || '[Documento]'
  } else if (message.message?.audioMessage) {
    messageType = 'AUDIO'
    content = '[Audio]'
  } else if (message.message?.videoMessage) {
    messageType = 'VIDEO'
    content = message.message.videoMessage.caption || '[Video]'
  } else if (message.message?.locationMessage) {
    messageType = 'LOCATION'
    content = '[Ubicación]'
  } else if (message.message?.contactMessage) {
    messageType = 'CONTACT'
    content = '[Contacto]'
  }

  // Save incoming message
  const { error: messageError } = await supabaseClient
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      message_id: message.key.id,
      content: content,
      type: messageType,
      direction: 'INBOUND',
      status: 'DELIVERED',
      metadata: {
        timestamp: message.messageTimestamp,
        from: message.key.remoteJid,
        messageData: message
      }
    })

  if (messageError) {
    console.error('Error guardando mensaje entrante:', messageError)
  }

  // Update conversation last message
  await supabaseClient
    .from('conversations')
    .update({ 
      last_message: new Date().toISOString(),
      metadata: {
        last_message_type: messageType,
        last_message_content: content
      }
    })
    .eq('id', conversation.id)
}

async function processMessageUpdate(supabaseClient: any, updateData: any) {
  const messageId = updateData.key.id
  const status = updateData.update.status

  // Map Evolution API status to our enum
  let messageStatus = 'SENT'
  switch (status) {
    case 'PENDING':
      messageStatus = 'SENT'
      break
    case 'SERVER_ACK':
      messageStatus = 'SENT'
      break
    case 'DELIVERY_ACK':
      messageStatus = 'DELIVERED'
      break
    case 'READ':
      messageStatus = 'READ'
      break
    case 'FAILED':
      messageStatus = 'FAILED'
      break
  }

  // Update message status
  await supabaseClient
    .from('messages')
    .update({ 
      status: messageStatus,
      metadata: {
        status_update: updateData
      }
    })
    .eq('message_id', messageId)
}

