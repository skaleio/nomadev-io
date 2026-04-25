/**
 * Rutas cuyo acceso está deshabilitado en el sidebar (candado / próximamente).
 * El buscador global y el command palette no deben sugerir estos destinos.
 */
const LOCKED_NAV_PATHS = [
  "/validation",
  "/shopify",
  "/shopify/connect",
  "/dropi",
  "/dropi/connect",
  "/studio-ia",
  "/chat",
  "/order-validation",
  "/tracking",
  "/leads",
  "/product-image-generator",
  "/copywriting",
  "/logo-generator",
  "/agents",
  "/agent-builder",
  "/price-optimizer",
  "/brand-identity",
  "/website-builder",
] as const;

/** URLs antiguas del índice de búsqueda que apuntan a módulos bloqueados. */
const LOCKED_SEARCH_ALIASES = ["/shopify-analytics", "/landing-pages", "/seo-optimizer"] as const;

const ALL_LOCKED = [...LOCKED_NAV_PATHS, ...LOCKED_SEARCH_ALIASES];

export function isGloballyLockedPath(url: string): boolean {
  const path = url.split("?")[0].split("#")[0];
  return ALL_LOCKED.some((p) => path === p || path.startsWith(`${p}/`));
}
