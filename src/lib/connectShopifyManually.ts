// La conexión con Shopify se hace vía OAuth (supabase/functions/shopify-oauth-start).
// Este helper manual era un atajo de desarrollo que usaba la tabla `shops` (eliminada).
// Se mantiene el export para no romper ShopifyPage.tsx mientras se migra ese flujo.
export async function connectShopifyManually(): Promise<never> {
  throw new Error(
    'La conexión manual de Shopify ya no está disponible. Usa el flujo OAuth desde Configuración.'
  );
}
