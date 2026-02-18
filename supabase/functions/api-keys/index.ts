import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateKeyRequest {
  name: string
  scopes?: string[]
  rate_limit?: number
  expires_in_days?: number
}

/**
 * Genera una API key segura con prefijo
 */
async function generateApiKey(): Promise<{ key: string; hash: string; prefix: string }> {
  // Generar 32 bytes aleatorios
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const key = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  // Prefijo para identificar keys de NOMADEV
  const prefix = `nmdev_${key.substring(0, 8)}`
  const fullKey = `${prefix}_${key}`
  
  // Hash para almacenar en DB
  const encoder = new TextEncoder()
  const data = encoder.encode(fullKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return { key: fullKey, hash, prefix }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // GET - Listar API keys del usuario
    if (req.method === 'GET' && path === 'api-keys') {
      const { data: keys, error } = await supabaseClient
        .from('api_keys')
        .select('id, name, key_prefix, scopes, is_active, rate_limit, last_used_at, requests_count, expires_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ keys }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST - Crear nueva API key
    if (req.method === 'POST' && path === 'api-keys') {
      const body: CreateKeyRequest = await req.json()
      
      if (!body.name) {
        return new Response(
          JSON.stringify({ error: 'Name is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Generar API key
      const { key, hash, prefix } = await generateApiKey()

      // Calcular fecha de expiración
      const expires_at = body.expires_in_days
        ? new Date(Date.now() + body.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null

      // Guardar en DB
      const { data: apiKey, error } = await supabaseClient
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: body.name,
          key_hash: hash,
          key_prefix: prefix,
          scopes: body.scopes || ['messages:send', 'orders:read', 'orders:create'],
          rate_limit: body.rate_limit || 100,
          expires_at,
        })
        .select()
        .single()

      if (error) throw error

      // IMPORTANTE: Solo devolvemos la key completa UNA VEZ
      return new Response(
        JSON.stringify({ 
          apiKey: {
            ...apiKey,
            key // Solo se muestra en creación
          },
          warning: 'Guarda esta API key en un lugar seguro. No podrás verla de nuevo.'
        }),
        { 
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // DELETE - Eliminar API key
    if (req.method === 'DELETE') {
      const keyId = url.searchParams.get('id')
      
      if (!keyId) {
        return new Response(
          JSON.stringify({ error: 'Key ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { error } = await supabaseClient
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user.id)

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'API key deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PATCH - Actualizar API key (activar/desactivar, cambiar rate limit)
    if (req.method === 'PATCH') {
      const keyId = url.searchParams.get('id')
      const body = await req.json()
      
      if (!keyId) {
        return new Response(
          JSON.stringify({ error: 'Key ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { data: updatedKey, error } = await supabaseClient
        .from('api_keys')
        .update({
          is_active: body.is_active,
          rate_limit: body.rate_limit,
          scopes: body.scopes,
        })
        .eq('id', keyId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ apiKey: updatedKey }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET - Obtener estadísticas de uso
    if (req.method === 'GET' && path === 'stats') {
      const keyId = url.searchParams.get('id')
      
      if (!keyId) {
        return new Response(
          JSON.stringify({ error: 'Key ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Verificar que la key pertenece al usuario
      const { data: keyData } = await supabaseClient
        .from('api_keys')
        .select('id')
        .eq('id', keyId)
        .eq('user_id', user.id)
        .single()

      if (!keyData) {
        return new Response(
          JSON.stringify({ error: 'API key not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Obtener estadísticas de las últimas 24 horas
      const { data: stats, error } = await supabaseClient
        .from('api_usage_logs')
        .select('endpoint, status_code, created_at')
        .eq('api_key_id', keyId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calcular métricas
      const totalRequests = stats?.length || 0
      const successRequests = stats?.filter(s => s.status_code >= 200 && s.status_code < 300).length || 0
      const errorRequests = stats?.filter(s => s.status_code >= 400).length || 0
      
      const endpointStats = stats?.reduce((acc: any, log: any) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1
        return acc
      }, {})

      return new Response(
        JSON.stringify({
          stats: {
            total_requests: totalRequests,
            success_requests: successRequests,
            error_requests: errorRequests,
            success_rate: totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(2) : 0,
            endpoint_breakdown: endpointStats,
            recent_logs: stats?.slice(0, 10)
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

