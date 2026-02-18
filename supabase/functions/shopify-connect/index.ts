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

    const { code, shop, state } = await req.json()

    if (!code || !shop) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: Deno.env.get('SHOPIFY_CLIENT_ID'),
        client_secret: Deno.env.get('SHOPIFY_CLIENT_SECRET'),
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Error al intercambiar código por token')
    }

    const { access_token, scope } = await tokenResponse.json()

    // Get shop information
    const shopResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    })

    if (!shopResponse.ok) {
      throw new Error('Error al obtener información de la tienda')
    }

    const { shop: shopInfo } = await shopResponse.json()

    // Save shop connection to database
    const { data: shopData, error: shopError } = await supabaseClient
      .from('shops')
      .insert({
        user_id: user.id,
        shopify_shop_id: shopInfo.id.toString(),
        shopify_domain: shop,
        shopify_access_token: access_token,
        shopify_scope: scope,
        shop_name: shopInfo.name,
        shop_email: shopInfo.email,
        shop_phone: shopInfo.phone,
      })
      .select()
      .single()

    if (shopError) {
      console.error('Error guardando tienda:', shopError)
      return new Response(
        JSON.stringify({ error: 'Error al guardar la conexión de la tienda' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        shop: {
          id: shopData.id,
          shop_name: shopData.shop_name,
          shopify_domain: shopData.shopify_domain,
          shop_email: shopData.shop_email,
          shop_phone: shopData.shop_phone,
          connected_at: shopData.connected_at,
        }
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error en shopify-connect:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

