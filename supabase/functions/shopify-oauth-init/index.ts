import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { shop, scopes, redirectUri } = await req.json()

    // Validar parámetros requeridos
    if (!shop) {
      return new Response(
        JSON.stringify({ error: 'El parámetro "shop" es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Configuración de Shopify OAuth
    const SHOPIFY_CLIENT_ID = Deno.env.get('SHOPIFY_CLIENT_ID')
    const SHOPIFY_CLIENT_SECRET = Deno.env.get('SHOPIFY_CLIENT_SECRET')
    const SHOPIFY_REDIRECT_URI = redirectUri || Deno.env.get('SHOPIFY_REDIRECT_URI') || `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth-callback`

    if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Configuración OAuth de Shopify incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generar estado único para CSRF protection
    const stateToken = crypto.randomUUID()

    // Scopes por defecto para el MVP
    const defaultScopes = [
      'read_products',
      'write_products',
      'read_orders',
      'write_orders',
      'read_customers',
      'write_customers',
      'read_inventory',
      'write_inventory',
      'read_analytics',
      'read_reports'
    ]

    const requestedScopes = scopes && Array.isArray(scopes) ? scopes : defaultScopes

    // Guardar estado en la base de datos
    const { error: stateError } = await supabaseClient
      .from('shopify_oauth_states')
      .insert({
        state_token: stateToken,
        user_id: user.id,
        shop_domain: shop,
        redirect_uri: SHOPIFY_REDIRECT_URI,
        scopes: requestedScopes,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos
      })

    if (stateError) {
      console.error('Error guardando estado OAuth:', stateError)
      return new Response(
        JSON.stringify({ error: 'Error interno del servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construir URL de autorización de Shopify
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`
    const scopeString = requestedScopes.join(',')

    const authUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`)
    authUrl.searchParams.set('client_id', SHOPIFY_CLIENT_ID)
    authUrl.searchParams.set('scope', scopeString)
    authUrl.searchParams.set('redirect_uri', SHOPIFY_REDIRECT_URI)
    authUrl.searchParams.set('state', stateToken)
    authUrl.searchParams.set('grant_options[]', 'per-user')

    console.log('OAuth URL generada:', authUrl.toString())

    // Log de la actividad
    try {
      await supabaseClient.rpc('log_shopify_activity', {
        p_connection_id: null,
        p_user_id: user.id,
        p_action: 'oauth_init',
        p_details: {
          shop: shopDomain,
          scopes: requestedScopes,
          state_token: stateToken
        },
        p_success: true
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        authUrl: authUrl.toString(),
        state: stateToken,
        shop: shopDomain,
        scopes: requestedScopes,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error en shopify-oauth-init:', error)
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/*
Ejemplo de uso desde el frontend:

const initShopifyAuth = async (shop: string) => {
  const response = await supabase.functions.invoke('shopify-oauth-init', {
    body: {
      shop: 'mi-tienda',
      scopes: ['read_products', 'read_orders'],
      redirectUri: 'https://mi-app.com/auth/callback'
    }
  })

  if (response.data.success) {
    window.location.href = response.data.authUrl
  }
}
*/