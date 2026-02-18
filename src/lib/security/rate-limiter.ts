import { supabase } from '@/integrations/supabase/client';

export interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en ms
  maxRequests: number; // Máximo de requests
  blockDurationMs: number; // Duración del bloqueo
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  reason?: string;
}

// Configuraciones de rate limiting por tipo de endpoint
export const RATE_LIMIT_CONFIGS = {
  // Autenticación - Muy restrictivo
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 intentos por 15 minutos
    blockDurationMs: 30 * 60 * 1000, // Bloqueo por 30 minutos
  },
  
  // API general - Moderado
  api: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100, // 100 requests por minuto
    blockDurationMs: 5 * 60 * 1000, // Bloqueo por 5 minutos
  },
  
  // Uploads - Restrictivo
  upload: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10, // 10 uploads por minuto
    blockDurationMs: 10 * 60 * 1000, // Bloqueo por 10 minutos
  },
  
  // Búsquedas - Moderado
  search: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 50, // 50 búsquedas por minuto
    blockDurationMs: 5 * 60 * 1000, // Bloqueo por 5 minutos
  },
  
  // Webhooks - Muy restrictivo
  webhook: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 20, // 20 webhooks por minuto
    blockDurationMs: 15 * 60 * 1000, // Bloqueo por 15 minutos
  }
} as const;

/**
 * Verifica si una request está dentro del rate limit
 */
export async function checkRateLimit(
  identifier: string, // IP, user ID, o combinación
  config: RateLimitConfig,
  endpoint?: string
): Promise<RateLimitResult> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    
    // Verificar si está bloqueado
    const isBlocked = await checkIfBlocked(identifier, now);
    if (isBlocked) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now.getTime() + config.blockDurationMs),
        retryAfter: config.blockDurationMs / 1000,
        reason: 'IP blocked due to excessive requests'
      };
    }
    
    // Contar requests en la ventana de tiempo
    const { data: requests, error } = await supabase
      .from('rate_limit_logs')
      .select('*')
      .eq('identifier', identifier)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const requestCount = requests?.length || 0;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    
    if (requestCount >= config.maxRequests) {
      // Bloquear por exceso de requests
      await blockIdentifier(identifier, config.blockDurationMs, endpoint);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now.getTime() + config.windowMs),
        retryAfter: config.windowMs / 1000,
        reason: 'Rate limit exceeded'
      };
    }
    
    // Registrar la request actual
    await logRequest(identifier, endpoint, now);
    
    return {
      allowed: true,
      remaining,
      resetTime: new Date(now.getTime() + config.windowMs)
    };
    
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // En caso de error, permitir la request pero logear
    return {
      allowed: true,
      remaining: 0,
      resetTime: new Date(Date.now() + 60000)
    };
  }
}

/**
 * Verifica rate limit específico para autenticación
 */
export async function checkAuthRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(identifier, RATE_LIMIT_CONFIGS.auth, 'auth');
}

/**
 * Verifica rate limit para API general
 */
export async function checkAPIRateLimit(identifier: string, endpoint?: string): Promise<RateLimitResult> {
  return checkRateLimit(identifier, RATE_LIMIT_CONFIGS.api, endpoint);
}

/**
 * Verifica rate limit para uploads
 */
export async function checkUploadRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(identifier, RATE_LIMIT_CONFIGS.upload, 'upload');
}

/**
 * Verifica rate limit para búsquedas
 */
export async function checkSearchRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(identifier, RATE_LIMIT_CONFIGS.search, 'search');
}

/**
 * Verifica rate limit para webhooks
 */
export async function checkWebhookRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(identifier, RATE_LIMIT_CONFIGS.webhook, 'webhook');
}

/**
 * Detecta patrones de ataque DDoS
 */
export async function detectDDoSPattern(identifier: string): Promise<boolean> {
  try {
    const now = new Date();
    const lastMinute = new Date(now.getTime() - 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Contar requests en la última hora
    const { data: hourlyRequests, error: hourlyError } = await supabase
      .from('rate_limit_logs')
      .select('*')
      .eq('identifier', identifier)
      .gte('created_at', lastHour.toISOString());
    
    if (hourlyError) throw hourlyError;
    
    const hourlyCount = hourlyRequests?.length || 0;
    
    // Si más de 1000 requests por hora, posible DDoS
    if (hourlyCount > 1000) {
      await logSecurityEvent('ddos_detected', {
        identifier,
        hourlyCount,
        timestamp: now.toISOString()
      });
      
      // Bloquear por 24 horas
      await blockIdentifier(identifier, 24 * 60 * 60 * 1000, 'ddos');
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error detecting DDoS pattern:', error);
    return false;
  }
}

/**
 * Limpia logs antiguos de rate limiting
 */
export async function cleanupRateLimitLogs(): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 días
    
    await supabase
      .from('rate_limit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    console.log('Rate limit logs cleaned up');
  } catch (error) {
    console.error('Error cleaning up rate limit logs:', error);
  }
}

// Funciones auxiliares privadas
async function checkIfBlocked(identifier: string, now: Date): Promise<boolean> {
  const { data, error } = await supabase
    .from('rate_limit_blocks')
    .select('*')
    .eq('identifier', identifier)
    .gt('blocked_until', now.toISOString())
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  return !!data;
}

async function blockIdentifier(identifier: string, durationMs: number, reason?: string): Promise<void> {
  const blockedUntil = new Date(Date.now() + durationMs);
  
  await supabase
    .from('rate_limit_blocks')
    .upsert({
      identifier,
      blocked_until: blockedUntil.toISOString(),
      reason: reason || 'Rate limit exceeded',
      created_at: new Date().toISOString()
    });
  
  // Log del evento de seguridad
  await logSecurityEvent('rate_limit_block', {
    identifier,
    duration: durationMs,
    reason,
    blockedUntil: blockedUntil.toISOString()
  });
}

async function logRequest(identifier: string, endpoint?: string, timestamp?: Date): Promise<void> {
  await supabase
    .from('rate_limit_logs')
    .insert({
      identifier,
      endpoint: endpoint || 'unknown',
      created_at: (timestamp || new Date()).toISOString()
    });
}

async function logSecurityEvent(eventType: string, data: any): Promise<void> {
  await supabase
    .from('security_events')
    .insert({
      event_type: eventType,
      event_data: data,
      created_at: new Date().toISOString()
    });
}
