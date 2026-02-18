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
    // Create a Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener parámetros de la URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const shop = url.searchParams.get('shop');
    const error = url.searchParams.get('error');

    // Verificar si hay error en la autorización
    if (error) {
      console.error('OAuth error:', error);
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Error de Conexión - Shopify</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
            .container { max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Error de Conexión</h1>
            <p>No se pudo conectar con Shopify: ${error}</p>
            <button onclick="window.close()">Cerrar</button>
          </div>
        </body>
        </html>`,
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      );
    }

    // Verificar parámetros requeridos
    if (!code || !state || !shop) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Error de Parámetros - Shopify</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
            .container { max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Error de Parámetros</h1>
            <p>Faltan parámetros requeridos en la respuesta de Shopify</p>
            <button onclick="window.close()">Cerrar</button>
          </div>
        </body>
        </html>`,
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
        }
      );
    }

    // Verificar el state en la base de datos
    const { data: stateData, error: stateError } = await supabaseClient
      .from('shopify_oauth_states')
      .select('*')
      .eq('state_token', state)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !stateData) {
      console.error('Invalid or expired state:', stateError);
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Error de Estado - Shopify</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; }
            .container { max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Error de Estado</h1>
            <p>El estado de autorización no es válido o ha expirado</p>
            <button onclick="window.close()">Cerrar</button>
          </div>
        </body>
        </html>`,
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        }
      );
    }

    // Marcar estado como usado
    await supabaseClient
      .from('shopify_oauth_states')
      .update({ used: true })
      .eq('id', stateData.id);

    const userId = stateData.user_id;
    const shopDomain = stateData.shop_domain;

    // Configuración de Shopify
    const SHOPIFY_API_KEY = Deno.env.get('SHOPIFY_API_KEY');
    const SHOPIFY_API_SECRET = Deno.env.get('SHOPIFY_API_SECRET');
    const REDIRECT_URI = stateData.redirect_uri || `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-oauth-callback`;

    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
      throw new Error('Configuración de Shopify no encontrada');
    }

    // Intercambiar código por access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Error al obtener el token de acceso');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No se recibió el token de acceso');
    }

    // Obtener información de la tienda
    let shopInfo = {};
    try {
      const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        shopInfo = shopData.shop || {};
      }
    } catch (error) {
      console.error('Error obteniendo info de la tienda:', error);
    }

    // Guardar o actualizar conexión en la base de datos
    const { data: existingConnection } = await supabaseClient
      .from('shopify_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('shop_domain', shop)
      .single();

    let connectionId: string;

    if (existingConnection) {
      // Actualizar conexión existente
      const { data: updatedConnection, error: updateError } = await supabaseClient
        .from('shopify_connections')
        .update({
          access_token: accessToken,
          scope: tokenData.scope?.split(',') || stateData.scopes,
          shop_info: shopInfo,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Error actualizando conexión:', updateError);
        throw new Error('Error guardando conexión');
      }

      connectionId = updatedConnection.id;
    } else {
      // Crear nueva conexión
      const { data: newConnection, error: insertError } = await supabaseClient
        .from('shopify_connections')
        .insert({
          user_id: userId,
          shop_domain: shop,
          access_token: accessToken,
          scope: tokenData.scope?.split(',') || stateData.scopes,
          shop_info: shopInfo,
          is_active: true
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creando conexión:', insertError);
        throw new Error('Error guardando conexión');
      }

      connectionId = newConnection.id;
    }

    // Log de actividad exitosa
    try {
      await supabaseClient.rpc('log_shopify_activity', {
        p_connection_id: connectionId,
        p_user_id: userId,
        p_action: 'oauth_success',
        p_details: {
          shop: shop,
          scopes: tokenData.scope?.split(',') || stateData.scopes,
          shop_info: shopInfo
        },
        p_success: true
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }

    console.log(`Shopify connection successful for user ${userId}, shop ${shop}`);

    // Redirigir al usuario de vuelta a la aplicación
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/success?shop=${encodeURIComponent(shop)}&connected=true`;

    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Conexión Exitosa - Shopify</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .success { color: #059669; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #059669; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .shop-name { color: #5b47fb; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">🎉 ¡Conexión Exitosa!</h1>
          <p>Tu tienda <span class="shop-name">${shopInfo.name || shop}</span> se ha conectado correctamente a NOMADEV.</p>
          <div class="spinner"></div>
          <p>Configurando tu dashboard... Serás redirigido automáticamente.</p>
          <script>
            setTimeout(() => {
              window.location.href = '${redirectUrl}';
            }, 3000);
          </script>
        </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      }
    );

  } catch (error) {
    console.error('Error en shopify-oauth-callback function:', error);
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Error del Servidor - Shopify</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc2626; }
          .container { max-width: 500px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">Error del Servidor</h1>
          <p>Ocurrió un error al procesar la conexión: ${error.message}</p>
          <button onclick="window.close()">Cerrar</button>
        </div>
      </body>
      </html>`,
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
      }
    );
  }
});
