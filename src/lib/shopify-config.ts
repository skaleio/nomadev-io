// Configuración de Shopify: usar variables de entorno (nunca hardcodear tokens)
export const SHOPIFY_CONFIG = {
  shopDomain: import.meta.env.VITE_SHOPIFY_SHOP_DOMAIN ?? '',
  accessToken: import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN ?? '',
  apiKey: import.meta.env.VITE_SHOPIFY_API_KEY ?? '',
  apiSecret: import.meta.env.VITE_SHOPIFY_API_SECRET ?? '',
  apiVersion: import.meta.env.VITE_SHOPIFY_API_VERSION ?? '2024-01'
};

export const SHOPIFY_ENDPOINTS = {
  baseUrl: `https://${SHOPIFY_CONFIG.shopDomain}/admin/api/${SHOPIFY_CONFIG.apiVersion}`,
  orders: '/orders.json',
  products: '/products.json',
  shop: '/shop.json',
  analytics: '/analytics.json',
  inventory: '/inventory_levels.json',
  customers: '/customers.json'
};

export const getShopifyHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Shopify-Access-Token': SHOPIFY_CONFIG.accessToken,
});
