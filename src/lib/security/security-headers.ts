/**
 * Configuración de headers de seguridad HTTP
 * Implementa las mejores prácticas de seguridad web
 */

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
  'X-XSS-Protection': string;
  'Cross-Origin-Embedder-Policy': string;
  'Cross-Origin-Opener-Policy': string;
  'Cross-Origin-Resource-Policy': string;
}

/**
 * Genera headers de seguridad estrictos
 */
export function generateSecurityHeaders(): SecurityHeaders {
  return {
    // Content Security Policy - Muy restrictivo
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.evolution.com wss://api.evolution.com",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "frame-src 'none'",
      "manifest-src 'self'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ].join('; '),

    // Prevenir clickjacking
    'X-Frame-Options': 'DENY',

    // Prevenir MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Control de referrer
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permisos de API del navegador
    'Permissions-Policy': [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'camera=()',
      'cross-origin-isolated=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'navigation-override=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()'
    ].join(', '),

    // HTTPS estricto
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Protección XSS (legacy pero útil)
    'X-XSS-Protection': '1; mode=block',

    // Políticas de Cross-Origin
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
}

/**
 * CSP específico para desarrollo
 */
export function generateDevelopmentCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com http://localhost:* ws://localhost:*",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob: http://localhost:*",
    "media-src 'self' https: http://localhost:*",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.evolution.com wss://api.evolution.com http://localhost:* ws://localhost:*",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "frame-src 'none'",
    "manifest-src 'self'"
  ].join('; ');
}

/**
 * CSP específico para producción
 */
export function generateProductionCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.evolution.com wss://api.evolution.com",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "frame-src 'none'",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ].join('; ');
}

/**
 * Headers específicos para API endpoints
 */
export function generateAPIHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  };
}

/**
 * Headers para archivos estáticos
 */
export function generateStaticHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };
}

/**
 * Headers para uploads
 */
export function generateUploadHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  };
}

/**
 * Valida si una URL está permitida por CSP
 */
export function isURLAllowedByCSP(url: string, directive: string): boolean {
  const csp = generateSecurityHeaders()['Content-Security-Policy'];
  const directiveMatch = csp.match(new RegExp(`${directive}\\s+([^;]+)`));
  
  if (!directiveMatch) return false;
  
  const allowedSources = directiveMatch[1].split(' ');
  const urlObj = new URL(url);
  
  return allowedSources.some(source => {
    if (source === "'self'") {
      return urlObj.origin === window.location.origin;
    }
    if (source === "'unsafe-inline'") {
      return url.startsWith('data:') || url.startsWith('blob:');
    }
    if (source === "'unsafe-eval'") {
      return false; // Nunca permitir eval en producción
    }
    if (source.includes('*')) {
      const pattern = source.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(url);
    }
    return url.startsWith(source);
  });
}

/**
 * Middleware para aplicar headers de seguridad
 */
export function applySecurityHeaders(
  headers: Record<string, string> = {},
  isDevelopment: boolean = false
): Record<string, string> {
  const securityHeaders = generateSecurityHeaders();
  
  // Ajustar CSP para desarrollo
  if (isDevelopment) {
    securityHeaders['Content-Security-Policy'] = generateDevelopmentCSP();
  }
  
  return {
    ...headers,
    ...securityHeaders
  };
}

/**
 * Configuración de CORS segura
 */
export function generateCORSConfig() {
  return {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://nomadev.io', 'https://www.nomadev.io']
      : ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Request-ID'
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ]
  };
}
