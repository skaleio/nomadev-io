// Modo demo: cuando un visitante no autenticado entra desde "Ver Demo Interactiva",
// activamos un flag en sessionStorage para que pueda navegar por las herramientas
// (sidebar incluido) sin que ProtectedRoute lo mande al login.
//
// El flag vive durante la sesión del navegador y se limpia al iniciar sesión
// real o cuando se cierra la pestaña.

const DEMO_KEY = 'nomadev_demo_mode';

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const enableDemoMode = (): void => {
  safe(() => sessionStorage.setItem(DEMO_KEY, '1'), undefined);
};

export const disableDemoMode = (): void => {
  safe(() => sessionStorage.removeItem(DEMO_KEY), undefined);
};

export const isDemoMode = (): boolean =>
  safe(() => sessionStorage.getItem(DEMO_KEY) === '1', false);

// Mapeo de rutas reales → rutas demo equivalentes para el sidebar.
// Si una herramienta no tiene demo dedicado, no se mapea y se renderiza
// la página real (ProtectedRoute la deja pasar pero sin datos).
export const DEMO_ROUTE_MAP: Record<string, string> = {
  '/dashboard': '/interactive-demo',
  '/orders': '/orders-demo',
  '/crm': '/crm-demo',
  '/chat': '/chat-demo',
  '/leads': '/leads-demo',
  '/tracking': '/tracking-demo',
  '/shopify': '/shopify-demo',
  '/validation': '/validation-demo',
  '/studio-ia': '/studio-ia-demo',
  '/settings': '/settings-demo',
  '/order-validation': '/order-validation-demo',
};

export const mapToDemoRoute = (path: string): string => DEMO_ROUTE_MAP[path] ?? path;
