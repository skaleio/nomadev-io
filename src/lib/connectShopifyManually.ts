import { supabase } from '../integrations/supabase/client';

export async function connectShopifyManually() {
  try {
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar si ya existe una tienda para este usuario
    const { data: existingShop } = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let data;
    let error;

    if (existingShop) {
      // Actualizar la tienda existente
      const result = await supabase
        .from('shops')
        .update({
          shopify_domain: import.meta.env.VITE_SHOPIFY_SHOP_DOMAIN ?? '',
          shopify_access_token: import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN ?? '',
          shop_name: import.meta.env.VITE_SHOPIFY_SHOP_NAME ?? 'Mi Tienda',
          is_active: true
        })
        .eq('user_id', user.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Crear nueva tienda
      const result = await supabase
        .from('shops')
        .insert({
          user_id: user.id,
          shopify_domain: import.meta.env.VITE_SHOPIFY_SHOP_DOMAIN ?? '',
          shopify_access_token: import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN ?? '',
          shop_name: import.meta.env.VITE_SHOPIFY_SHOP_NAME ?? 'Mi Tienda',
          is_active: true
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error en Supabase:', error);
      throw new Error(`Error de base de datos: ${error.message}`);
    }

    console.log('Tienda conectada exitosamente:', data);
    return data;
  } catch (error) {
    console.error('Error connecting Shopify manually:', error);
    throw error;
  }
}
