import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN') ?? '';
    const shopDomain = Deno.env.get('SHOPIFY_SHOP_DOMAIN') ?? '';
    if (!accessToken || !shopDomain) {
      return new Response(JSON.stringify({ error: 'Configura SHOPIFY_ACCESS_TOKEN y SHOPIFY_SHOP_DOMAIN en los secrets de la función' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    console.log('Probando conexión a Shopify...');
    
    // Probar obtener información de la tienda
    const response = await fetch(`https://${shopDomain}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const shopData = await response.json();
    console.log('✅ Conexión exitosa a Shopify:', shopData);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Conexión exitosa a Shopify',
      shop: shopData.shop
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error conectando a Shopify:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
