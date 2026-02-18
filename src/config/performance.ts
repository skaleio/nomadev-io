/**
 * Configuración de optimización de rendimiento para NOMADEV.IO
 */

// Configuración de lazy loading para componentes pesados
export const LAZY_LOAD_CONFIG = {
  // Componentes que se cargan bajo demanda
  lazyComponents: [
    'InteractiveDemo',
    'Analytics',
    'Charts',
    'DataTables'
  ],
  
  // Tiempo de debounce para búsquedas
  searchDebounce: 300,
  
  // Tiempo de debounce para filtros
  filterDebounce: 200,
  
  // Límite de elementos por página
  itemsPerPage: 50,
  
  // Configuración de caché
  cacheConfig: {
    // Tiempo de vida del caché en milisegundos
    ttl: 5 * 60 * 1000, // 5 minutos
    
    // Tamaño máximo del caché
    maxSize: 100,
    
    // Claves que se cachean
    cacheKeys: [
      'user-profile',
      'shopify-shops',
      'analytics-data',
      'conversations'
    ]
  }
};

// Configuración de WebSocket
export const WEBSOCKET_CONFIG = {
  // Tiempo de reconexión
  reconnectInterval: 5000,
  
  // Máximo número de intentos de reconexión
  maxReconnectAttempts: 5,
  
  // Tiempo de timeout para mensajes
  messageTimeout: 10000,
  
  // Configuración de heartbeat
  heartbeat: {
    interval: 30000, // 30 segundos
    timeout: 5000    // 5 segundos
  }
};

// Configuración de API
export const API_CONFIG = {
  // Timeout para requests
  timeout: 10000,
  
  // Número máximo de reintentos
  maxRetries: 3,
  
  // Intervalo entre reintentos
  retryInterval: 1000,
  
  // Configuración de rate limiting
  rateLimit: {
    requests: 100,
    window: 60000 // 1 minuto
  }
};

// Configuración de animaciones
export const ANIMATION_CONFIG = {
  // Duración de transiciones
  duration: {
    fast: 150,
    normal: 300,
    slow: 500
  },
  
  // Easing functions
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)'
  }
};

// Configuración de monitoreo de rendimiento
export const PERFORMANCE_CONFIG = {
  // Métricas a monitorear
  metrics: [
    'first-contentful-paint',
    'largest-contentful-paint',
    'first-input-delay',
    'cumulative-layout-shift'
  ],
  
  // Umbrales de rendimiento
  thresholds: {
    fcp: 1800,  // First Contentful Paint
    lcp: 2500,  // Largest Contentful Paint
    fid: 100,   // First Input Delay
    cls: 0.1    // Cumulative Layout Shift
  }
};
