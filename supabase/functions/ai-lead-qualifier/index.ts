// Edge Function para calificar leads automáticamente con IA
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { leadId } = await req.json()

    if (!leadId) {
      return new Response(JSON.stringify({ error: 'Lead ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Obtener lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Obtener mensajes de la conversación si existe
    let conversationMessages: any[] = []

    if (lead.conversation_id) {
      const { data: messages } = await supabase
        .from('messages')
        .select('content, direction, created_at')
        .eq('conversation_id', lead.conversation_id)
        .order('created_at', { ascending: true })
        .limit(20)

      conversationMessages = messages || []
    }

    // Calificar lead con IA
    const qualification = await qualifyLeadWithAI(lead, conversationMessages)

    // Actualizar lead
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        score: qualification.score,
        status: qualification.stage,
        notes: lead.notes 
          ? `${lead.notes}\n\nClasificación automática (${new Date().toISOString()}): ${qualification.reasoning}`
          : `Clasificación automática: ${qualification.reasoning}`,
        probability: qualification.probability
      })
      .eq('id', leadId)
      .select()
      .single()

    if (updateError) {
      throw new Error('Error updating lead: ' + updateError.message)
    }

    // Registrar actividad
    await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        user_id: lead.user_id,
        activity_type: 'ai_qualification',
        title: 'Lead calificado automáticamente',
        description: qualification.reasoning,
        metadata: {
          score: qualification.score,
          stage: qualification.stage,
          probability: qualification.probability,
          factors: qualification.factors
        }
      })

    return new Response(JSON.stringify({ 
      success: true, 
      lead: updatedLead,
      qualification 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function qualifyLeadWithAI(lead: any, conversationMessages: any[]) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Construir contexto para la IA
  const conversationText = conversationMessages
    .map(m => `${m.direction === 'inbound' ? 'Cliente' : 'Asistente'}: ${m.content}`)
    .join('\n')

  const leadInfo = {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    position: lead.position,
    source: lead.source,
    campaign: lead.campaign,
    notes: lead.notes
  }

  const prompt = `Eres un experto en calificación de leads y ventas. Analiza la siguiente información y proporciona una evaluación detallada del lead.

Información del lead:
${JSON.stringify(leadInfo, null, 2)}

${conversationText ? `Historial de conversación:\n${conversationText}` : 'No hay historial de conversación disponible.'}

Evalúa el lead considerando:
1. Nivel de interés demostrado
2. Capacidad de compra (si es evidente)
3. Autoridad para tomar decisiones
4. Necesidad del producto/servicio
5. Timeline de compra
6. Engagement en la conversación

Responde SOLO con un JSON en este formato exacto:
{
  "score": número entre 0 y 100,
  "stage": "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost",
  "probability": número entre 0 y 100,
  "reasoning": "explicación detallada de tu evaluación",
  "factors": {
    "interest": número entre 0 y 100,
    "capacity": número entre 0 y 100,
    "authority": número entre 0 y 100,
    "need": número entre 0 y 100,
    "timeline": número entre 0 y 100
  },
  "recommendations": ["recomendación 1", "recomendación 2", "recomendación 3"]
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error('Error calling OpenAI API')
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Limpiar el contenido para extraer solo el JSON
    let jsonContent = content.trim()
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '')
    }

    const qualification = JSON.parse(jsonContent)

    return qualification
  } catch (error) {
    console.error('Error qualifying lead with AI:', error)
    // Retornar calificación por defecto en caso de error
    return {
      score: 50,
      stage: 'contacted',
      probability: 50,
      reasoning: 'Calificación automática no disponible. Se requiere revisión manual.',
      factors: {
        interest: 50,
        capacity: 50,
        authority: 50,
        need: 50,
        timeline: 50
      },
      recommendations: [
        'Revisar manualmente el lead',
        'Contactar para obtener más información',
        'Evaluar necesidades específicas'
      ]
    }
  }
}

