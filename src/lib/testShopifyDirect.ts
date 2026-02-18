import { supabase } from '../integrations/supabase/client';

// Función para probar la conexión a Shopify usando Edge Function
export async function testShopifyDirect() {
  try {
    console.log('Probando conexión a Shopify via Edge Function...');
    
    // Usar la Edge Function para evitar problemas de CORS
    const { data, error } = await supabase.functions.invoke('shopify-test-connection');

    if (error) {
      throw error;
    }

    console.log('✅ Conexión exitosa a Shopify:', data);
    return data;
  } catch (error) {
    console.error('❌ Error conectando a Shopify:', error);
    throw error;
  }
}
