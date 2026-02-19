import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthStartRequest {
  shop: string;
  user_id: string;
}

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
    );

    // Get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const body: OAuthStartRequest = await req.json();
    const { shop, user_id } = body;

    if (!shop || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos: shop, user_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar que el user_id coincida con el usuario autenticado
    if (user.id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'No autorizado para este usuario' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Configuración de OAuth de Shopify
    const SHOPIFY_API_KEY = Deno.env.get('SHOPIFY_API_KEY');
    const SHOPIFY_API_SECRET = Deno.env.get('SHOPIFY_API_SECRET');
    const REDIRECT_URI = Deno.env.get('SHOPIFY_REDIRECT_URI') || `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth-callback`;

    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
      console.error('Missing Shopify credentials');
      return new Response(
        JSON.stringify({ error: 'Configuración de Shopify no encontrada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Limpiar y validar el dominio de la tienda
    let cleanShop = shop.trim().toLowerCase();
    
    // Remover protocolo si está presente
    cleanShop = cleanShop.replace(/^https?:\/\//, '');
    
    // Remover .myshopify.com si está presente
    cleanShop = cleanShop.replace(/\.myshopify\.com$/, '');
    
    // Agregar .myshopify.com si no está presente
    if (!cleanShop.includes('.')) {
      cleanShop = `${cleanShop}.myshopify.com`;
    }

    // Generar state único para seguridad
    const state = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

    // Guardar el state en la base de datos para verificación posterior
    const { error: stateError } = await supabaseClient
      .from('shopify_oauth_states')
      .insert({
        state_token: state,
        user_id,
        shop_domain: cleanShop,
        redirect_uri: REDIRECT_URI,
        scopes: ['read_products', 'write_products', 'read_orders', 'write_orders', 'read_customers', 'write_customers', 'read_inventory', 'write_inventory', 'read_analytics', 'read_reports'],
        expires_at: expiresAt,
      });

    if (stateError) {
      console.error('Error saving OAuth state:', stateError);
      return new Response(
        JSON.stringify({ error: 'Error interno del servidor' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Construir la URL de autorización de Shopify
    const scopes = [
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
    ].join(',');

    const authUrl = new URL(`https://${cleanShop}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', SHOPIFY_API_KEY);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('state', state);

    console.log(`OAuth URL generated for shop: ${cleanShop}`);

    return new Response(JSON.stringify({
      auth_url: authUrl.toString(),
      shop: cleanShop,
      state
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en shopify-oauth-start function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
