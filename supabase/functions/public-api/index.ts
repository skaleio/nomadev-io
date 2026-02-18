import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface ApiKeyData {
  id: string
  user_id: string
  scopes: string[]
  is_active: boolean
  rate_limit: number
  requests_count: number
  expires_at: string | null
}

/**
 * Verifica y valida la API key
 */
async function validateApiKey(apiKey: string, supabase: any): Promise<ApiKeyData | null> {
  if (!apiKey || !apiKey.startsWith('nmdev_')) {
    return null
  }

  // Hashear la key para buscar en DB
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Buscar key en base de datos
  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single()

  if (error || !keyData) {
    return null
  }

  // Verificar si la key ha expirado
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return null
  }

  return keyData
}

/**
 * Verifica rate limit de la API key
 */
async function checkRateLimit(apiKeyId: string, rateLimit: number, supabase: any): Promise<boolean> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 60 * 1000) // ventana de 1 minuto
  
  // Contar requests en la ventana actual
  const { data: rateLimitData } = await supabase
    .from('api_rate_limits')
    .select('requests_count')
    .eq('api_key_id', apiKeyId)
    .gte('window_start', windowStart.toISOString())
    .single()

  if (rateLimitData && rateLimitData.requests_count >= rateLimit) {
    return false
  }

  // Actualizar contador
  await supabase
    .from('api_rate_limits')
    .upsert({
      api_key_id: apiKeyId,
      window_start: windowStart.toISOString(),
      window_end: now.toISOString(),
      requests_count: (rateLimitData?.requests_count || 0) + 1
    })

  return true
}

/**
 * Registra el uso de la API
 */
async function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  ipAddress: string | null,
  userAgent: string | null,
  requestBody: any,
  responseBody: any,
  errorMessage: string | null,
  supabase: any
) {
  await supabase.from('api_usage_logs').insert({
    api_key_id: apiKeyId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTime,
    ip_address: ipAddress,
    user_agent: userAgent,
    request_body: requestBody,
    response_body: responseBody,
    error_message: errorMessage,
  })

  // Actualizar last_used_at y requests_count
  await supabase
    .from('api_keys')
    .update({ 
      last_used_at: new Date().toISOString(),
      requests_count: supabase.raw('requests_count + 1')
    })
    .eq('id', apiKeyId)
}

serve(async (req) => {
  const startTime = Date.now()
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  let apiKeyData: ApiKeyData | null = null
  let endpoint = ''
  let statusCode = 200
  let responseBody: any = {}
  let errorMessage: string | null = null

  try {
    // Extraer API key del header
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      statusCode = 401
      throw new Error('API key is required. Include it in the x-api-key header or Authorization header.')
    }

    // Validar API key
    apiKeyData = await validateApiKey(apiKey, supabaseClient)
    
    if (!apiKeyData) {
      statusCode = 401
      throw new Error('Invalid or expired API key')
    }

    // Verificar rate limit
    const withinRateLimit = await checkRateLimit(apiKeyData.id, apiKeyData.rate_limit, supabaseClient)
    
    if (!withinRateLimit) {
      statusCode = 429
      throw new Error(`Rate limit exceeded. Maximum ${apiKeyData.rate_limit} requests per minute.`)
    }

    const url = new URL(req.url)
    endpoint = url.pathname
    const requestBody = req.method !== 'GET' ? await req.json() : null

    // ============================================
    // ENDPOINTS DE LA API PÚBLICA
    // ============================================

    // POST /messages/send - Enviar mensaje de WhatsApp
    if (req.method === 'POST' && endpoint.includes('/messages/send')) {
      if (!apiKeyData.scopes.includes('messages:send')) {
        statusCode = 403
        throw new Error('Insufficient permissions. Scope messages:send required.')
      }

      const { phone, message, media_url } = requestBody

      if (!phone || !message) {
        statusCode = 400
        throw new Error('phone and message are required')
      }

      // Llamar a la función de envío de WhatsApp
      const { data, error } = await supabaseClient.functions.invoke('send-whatsapp-message', {
        body: {
          phone,
          message,
          media_url,
          user_id: apiKeyData.user_id
        }
      })

      if (error) throw error

      responseBody = {
        success: true,
        message_id: data.message_id,
        status: 'sent',
        timestamp: new Date().toISOString()
      }
    }

    // GET /orders - Obtener lista de pedidos
    else if (req.method === 'GET' && endpoint.includes('/orders')) {
      if (!apiKeyData.scopes.includes('orders:read')) {
        statusCode = 403
        throw new Error('Insufficient permissions. Scope orders:read required.')
      }

      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const status = url.searchParams.get('status')

      let query = supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', apiKeyData.user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      responseBody = {
        orders: data,
        total: data.length,
        limit,
        offset
      }
    }

    // GET /orders/:id - Obtener un pedido específico
    else if (req.method === 'GET' && endpoint.match(/\/orders\/[a-zA-Z0-9-]+$/)) {
      if (!apiKeyData.scopes.includes('orders:read')) {
        statusCode = 403
        throw new Error('Insufficient permissions. Scope orders:read required.')
      }

      const orderId = endpoint.split('/').pop()

      const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', apiKeyData.user_id)
        .single()

      if (error || !data) {
        statusCode = 404
        throw new Error('Order not found')
      }

      responseBody = { order: data }
    }

    // POST /orders - Crear nuevo pedido
    else if (req.method === 'POST' && endpoint.includes('/orders')) {
      if (!apiKeyData.scopes.includes('orders:create')) {
        statusCode = 403
        throw new Error('Insufficient permissions. Scope orders:create required.')
      }

      const orderData = {
        ...requestBody,
        user_id: apiKeyData.user_id,
        created_via: 'api',
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabaseClient
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (error) throw error

      statusCode = 201
      responseBody = {
        success: true,
        order: data
      }
    }

    // GET /analytics - Obtener métricas analíticas
    else if (req.method === 'GET' && endpoint.includes('/analytics')) {
      if (!apiKeyData.scopes.includes('analytics:read')) {
        statusCode = 403
        throw new Error('Insufficient permissions. Scope analytics:read required.')
      }

      const period = url.searchParams.get('period') || '7d'
      
      // Calcular fecha de inicio según el período
      const now = new Date()
      const daysMap: { [key: string]: number } = {
        '1d': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90
      }
      const days = daysMap[period] || 7
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

      // Obtener métricas desde Supabase
      const { data: orders } = await supabaseClient
        .from('orders')
        .select('id, status, total_amount, created_at')
        .eq('user_id', apiKeyData.user_id)
        .gte('created_at', startDate.toISOString())

      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0
      const confirmedOrders = orders?.filter((o: any) => o.status === 'confirmed').length || 0
      const conversionRate = totalOrders > 0 ? ((confirmedOrders / totalOrders) * 100).toFixed(2) : 0

      responseBody = {
        period,
        metrics: {
          total_orders: totalOrders,
          confirmed_orders: confirmedOrders,
          total_revenue: totalRevenue,
          conversion_rate: `${conversionRate}%`,
          average_order_value: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
        }
      }
    }

    // Endpoint no encontrado
    else {
      statusCode = 404
      throw new Error(`Endpoint not found: ${endpoint}`)
    }

    // Registrar uso exitoso
    const responseTime = Date.now() - startTime
    await logApiUsage(
      apiKeyData.id,
      endpoint,
      req.method,
      statusCode,
      responseTime,
      req.headers.get('x-forwarded-for'),
      req.headers.get('user-agent'),
      requestBody,
      responseBody,
      null,
      supabaseClient
    )

    return new Response(
      JSON.stringify(responseBody),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': apiKeyData.rate_limit.toString(),
          'X-RateLimit-Remaining': '...', // Calcular desde rate_limits table
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      }
    )

  } catch (error) {
    errorMessage = error.message
    
    // Registrar error
    if (apiKeyData) {
      const responseTime = Date.now() - startTime
      await logApiUsage(
        apiKeyData.id,
        endpoint,
        req.method,
        statusCode,
        responseTime,
        req.headers.get('x-forwarded-for'),
        req.headers.get('user-agent'),
        null,
        null,
        errorMessage,
        supabaseClient
      )
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        status: statusCode,
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

