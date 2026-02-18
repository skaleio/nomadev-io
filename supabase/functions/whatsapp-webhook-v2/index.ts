// Edge Function para procesar webhooks de WhatsApp Business API
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificación del webhook (GET request)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      // Verificar token (debería coincidir con el configurado en el agente)
      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'nomadev_webhook_token'

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified successfully')
        return new Response(challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        })
      }

      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    // Procesar webhook (POST request)
    if (req.method === 'POST') {
      const payload = await req.json()
      console.log('Received WhatsApp webhook:', JSON.stringify(payload))

      // Validar estructura del payload
      if (!payload.entry || !Array.isArray(payload.entry)) {
        return new Response('Invalid payload', { status: 400, headers: corsHeaders })
      }

      // Procesar cada entrada
      for (const entry of payload.entry) {
        if (!entry.changes || !Array.isArray(entry.changes)) continue

        for (const change of entry.changes) {
          if (change.field !== 'messages') continue

          const value = change.value
          const phoneNumberId = value.metadata?.phone_number_id

          if (!phoneNumberId) continue

          // Buscar agente por phone_number_id
          const { data: agents, error: agentError } = await supabase
            .from('agents')
            .select('*')
            .eq('whatsapp_phone_id', phoneNumberId)
            .limit(1)

          if (agentError || !agents || agents.length === 0) {
            console.error('Agent not found for phone_number_id:', phoneNumberId)
            continue
          }

          const agent = agents[0]

          // Procesar mensajes entrantes
          if (value.messages && Array.isArray(value.messages)) {
            for (const message of value.messages) {
              await processIncomingMessage(supabase, message, value, agent)
            }
          }

          // Procesar actualizaciones de estado
          if (value.statuses && Array.isArray(value.statuses)) {
            for (const status of value.statuses) {
              await processStatusUpdate(supabase, status)
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function processIncomingMessage(supabase: any, message: any, value: any, agent: any) {
  try {
    const from = message.from
    const messageId = message.id
    const contactName = value.contacts?.[0]?.profile?.name || 'Usuario'

    // Obtener o crear conversación
    let conversation = await getOrCreateConversation(supabase, agent, from, contactName)

    // Extraer contenido del mensaje
    let messageContent = ''
    let messageType = 'text'

    if (message.type === 'text' && message.text) {
      messageContent = message.text.body
      messageType = 'text'
    } else if (message.type === 'image') {
      messageContent = '[Imagen]'
      messageType = 'image'
    } else if (message.type === 'audio') {
      messageContent = '[Audio]'
      messageType = 'audio'
    } else if (message.type === 'video') {
      messageContent = '[Video]'
      messageType = 'video'
    } else if (message.type === 'document') {
      messageContent = `[Documento: ${message.document?.filename || 'archivo'}]`
      messageType = 'document'
    }

    // Guardar mensaje entrante
    const { data: incomingMsg, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        agent_id: agent.id,
        content: messageContent,
        message_type: messageType,
        direction: 'inbound',
        sender_phone: from,
        sender_name: contactName,
        whatsapp_message_id: messageId,
        ai_generated: false,
        metadata: {},
        attachments: []
      })
      .select()
      .single()

    if (msgError) {
      console.error('Error saving incoming message:', msgError)
      return
    }

    // Si el agente está activo, generar respuesta con IA
    if (agent.status === 'active' && messageType === 'text') {
      await generateAndSendAIResponse(supabase, agent, conversation, messageContent, from)
    }
  } catch (error) {
    console.error('Error processing incoming message:', error)
  }
}

async function getOrCreateConversation(supabase: any, agent: any, phone: string, contactName: string) {
  // Buscar conversación existente
  const { data: existing, error: searchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('agent_id', agent.id)
    .eq('contact_phone', phone)
    .eq('status', 'active')
    .limit(1)

  if (existing && existing.length > 0) {
    return existing[0]
  }

  // Crear nueva conversación
  const { data: newConv, error: createError } = await supabase
    .from('conversations')
    .insert({
      agent_id: agent.id,
      user_id: agent.user_id,
      contact_phone: phone,
      contact_name: contactName,
      whatsapp_conversation_id: phone,
      status: 'active',
      context: {},
      metadata: {},
      lead_score: 0
    })
    .select()
    .single()

  if (createError) {
    throw new Error('Error creating conversation: ' + createError.message)
  }

  return newConv
}

async function generateAndSendAIResponse(
  supabase: any,
  agent: any,
  conversation: any,
  userMessage: string,
  recipientPhone: string
) {
  try {
    // Obtener historial de mensajes
    const { data: previousMessages } = await supabase
      .from('messages')
      .select('content, direction, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(10)

    // Construir prompt para OpenAI
    const systemPrompt = buildSystemPrompt(agent, conversation)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(previousMessages || []).map((m: any) => ({
        role: m.direction === 'inbound' ? 'user' : 'assistant',
        content: m.content
      })),
      { role: 'user', content: userMessage }
    ]

    // Llamar a OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured')
      return
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: agent.ai_model || 'gpt-4-turbo-preview',
        messages: messages,
        temperature: agent.ai_temperature ?? 0.7,
        max_tokens: agent.ai_max_tokens ?? 2000
      })
    })

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', await openaiResponse.text())
      return
    }

    const openaiData = await openaiResponse.json()
    const aiResponseContent = openaiData.choices[0].message.content
    const tokensUsed = openaiData.usage.total_tokens

    // Guardar mensaje de respuesta
    const { data: responseMsg } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        agent_id: agent.id,
        content: aiResponseContent,
        message_type: 'text',
        direction: 'outbound',
        ai_generated: true,
        ai_model: agent.ai_model || 'gpt-4-turbo-preview',
        ai_tokens_used: tokensUsed,
        ai_confidence: 0.95,
        metadata: {},
        attachments: []
      })
      .select()
      .single()

    // Enviar mensaje por WhatsApp
    if (responseMsg) {
      await sendWhatsAppMessage(agent, recipientPhone, aiResponseContent, responseMsg.id, supabase)
    }
  } catch (error) {
    console.error('Error generating AI response:', error)
  }
}

function buildSystemPrompt(agent: any, conversation: any): string {
  let prompt = ''

  if (agent.ai_system_prompt) {
    prompt += agent.ai_system_prompt + '\n\n'
  } else {
    prompt += `Eres ${agent.name}, un asistente de IA.\n\n`
  }

  if (agent.personality) {
    prompt += `Tu personalidad:\n`
    prompt += `- Tono: ${agent.personality.tone}\n`
    prompt += `- Idioma: ${agent.personality.language}\n`
    prompt += `- Estilo: ${agent.personality.style}\n\n`
  }

  if (agent.ai_context) {
    prompt += `Contexto adicional:\n${agent.ai_context}\n\n`
  }

  if (conversation.contact_name) {
    prompt += `Estás hablando con: ${conversation.contact_name}\n`
  }

  prompt += `\nInstrucciones importantes:\n`
  prompt += `- Responde de manera natural y conversacional\n`
  prompt += `- Mantén las respuestas concisas y relevantes\n`
  prompt += `- Sé empático y profesional\n`

  return prompt
}

async function sendWhatsAppMessage(
  agent: any,
  to: string,
  message: string,
  messageId: string,
  supabase: any
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${agent.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${agent.whatsapp_access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        })
      }
    )

    const data = await response.json()

    if (response.ok && data.messages && data.messages[0]) {
      // Actualizar mensaje con WhatsApp message ID
      await supabase
        .from('messages')
        .update({
          whatsapp_message_id: data.messages[0].id,
          whatsapp_status: 'sent'
        })
        .eq('id', messageId)
    } else {
      console.error('Error sending WhatsApp message:', data)
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
  }
}

async function processStatusUpdate(supabase: any, status: any) {
  try {
    const updates: any = {
      whatsapp_status: status.status
    }

    if (status.status === 'delivered') {
      updates.delivered_at = new Date(parseInt(status.timestamp) * 1000).toISOString()
    } else if (status.status === 'read') {
      updates.read_at = new Date(parseInt(status.timestamp) * 1000).toISOString()
    }

    await supabase
      .from('messages')
      .update(updates)
      .eq('whatsapp_message_id', status.id)
  } catch (error) {
    console.error('Error processing status update:', error)
  }
}

