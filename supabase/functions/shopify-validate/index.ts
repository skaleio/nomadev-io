import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const { shopifyDomain, accessToken } = await req.json()

    if (!shopifyDomain || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos: shopifyDomain y accessToken' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate token with Shopify API
    const shopResponse = await fetch(`https://${shopifyDomain}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!shopResponse.ok) {
      const errorText = await shopResponse.text();
      console.error('Shopify API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Credenciales inválidas', 
          details: `Error ${shopResponse.status}: ${errorText}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { shop: shopInfo } = await shopResponse.json()

    // Save shop connection to database
    const { data: shopData, error: shopError } = await supabaseClient
      .from('shops')
      .upsert({
        user_id: user.id,
        shopify_shop_id: shopInfo.id.toString(),
        shopify_domain: shopifyDomain,
        shopify_access_token: accessToken,
        shopify_scope: 'read_products,read_orders,read_customers',
        shop_name: shopInfo.name,
        shop_email: shopInfo.email,
        shop_phone: shopInfo.phone,
        is_active: true,
      }, {
        onConflict: 'user_id,shopify_shop_id'
      })
      .select()
      .single()

    if (shopError) {
      console.error('Error guardando tienda:', shopError)
      return new Response(
        JSON.stringify({ error: 'Error al guardar la conexión de la tienda: ' + shopError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        shop: shopInfo,
        shopData: shopData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error en shopify-validate:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
