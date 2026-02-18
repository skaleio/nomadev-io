/**
 * Rate Limiter Avanzado para NOMADEV API
 * Implementa:
 * - Token Bucket Algorithm
 * - Sliding Window Counter
 * - Circuit Breaker Pattern
 * - Distributed Rate Limiting con Redis
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RateLimitConfig {
  max_requests: number
  window_ms: number
  burst_size?: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset_at: number
  retry_after?: number
}

export class RateLimiter {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  /**
   * Algoritmo de Token Bucket
   * Permite ráfagas (bursts) controladas
   */
  async checkTokenBucket(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - config.window_ms
    
    // Obtener el bucket actual
    const { data: bucket } = await this.supabase
      .from('rate_limit_buckets')
      .select('*')
      .eq('identifier', identifier)
      .single()

    if (!bucket) {
      // Crear nuevo bucket
      await this.supabase
        .from('rate_limit_buckets')
        .insert({
          identifier,
          tokens: config.max_requests - 1,
          last_refill: now,
          window_ms: config.window_ms,
          max_tokens: config.max_requests
        })

      return {
        allowed: true,
        remaining: config.max_requests - 1,
        reset_at: now + config.window_ms
      }
    }

    // Calcular tokens a agregar desde la última recarga
    const elapsedMs = now - bucket.last_refill
    const refillRate = config.max_requests / config.window_ms
    const tokensToAdd = Math.floor(elapsedMs * refillRate)
    const currentTokens = Math.min(
      bucket.tokens + tokensToAdd,
      config.max_requests
    )

    if (currentTokens >= 1) {
      // Consumir un token
      await this.supabase
        .from('rate_limit_buckets')
        .update({
          tokens: currentTokens - 1,
          last_refill: now
        })
        .eq('identifier', identifier)

      return {
        allowed: true,
        remaining: currentTokens - 1,
        reset_at: now + Math.ceil((config.max_requests - currentTokens + 1) / refillRate)
      }
    }

    // No hay tokens disponibles
    const retryAfterMs = Math.ceil((1 - currentTokens) / refillRate)
    
    return {
      allowed: false,
      remaining: 0,
      reset_at: now + retryAfterMs,
      retry_after: Math.ceil(retryAfterMs / 1000) // en segundos
    }
  }

  /**
   * Sliding Window Counter
   * Más preciso que fixed window
   */
  async checkSlidingWindow(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const currentWindow = Math.floor(now / config.window_ms)
    const previousWindow = currentWindow - 1

    // Obtener contadores de ventanas actuales y previas
    const { data: windows } = await this.supabase
      .from('rate_limit_windows')
      .select('*')
      .eq('identifier', identifier)
      .in('window', [currentWindow, previousWindow])

    const currentWindowData = windows?.find((w: any) => w.window === currentWindow)
    const previousWindowData = windows?.find((w: any) => w.window === previousWindow)

    // Calcular el peso de la ventana anterior
    const previousWindowWeight = 1 - (now % config.window_ms) / config.window_ms
    const weightedPreviousCount = (previousWindowData?.count || 0) * previousWindowWeight
    const currentCount = currentWindowData?.count || 0
    
    const totalCount = Math.floor(weightedPreviousCount + currentCount)

    if (totalCount < config.max_requests) {
      // Incrementar contador
      await this.supabase
        .from('rate_limit_windows')
        .upsert({
          identifier,
          window: currentWindow,
          count: currentCount + 1,
          expires_at: new Date(now + config.window_ms * 2).toISOString()
        })

      return {
        allowed: true,
        remaining: config.max_requests - totalCount - 1,
        reset_at: (currentWindow + 1) * config.window_ms
      }
    }

    return {
      allowed: false,
      remaining: 0,
      reset_at: (currentWindow + 1) * config.window_ms,
      retry_after: Math.ceil(((currentWindow + 1) * config.window_ms - now) / 1000)
    }
  }

  /**
   * Rate limit por usuario con múltiples niveles
   */
  async checkMultiTierRateLimit(
    userId: string,
    endpoint: string,
    tier: 'free' | 'starter' | 'pro' | 'enterprise'
  ): Promise<RateLimitResult> {
    // Configuración por tier
    const configs: Record<string, RateLimitConfig> = {
      free: { max_requests: 10, window_ms: 60000 }, // 10/min
      starter: { max_requests: 100, window_ms: 60000 }, // 100/min
      pro: { max_requests: 1000, window_ms: 60000 }, // 1000/min
      enterprise: { max_requests: 10000, window_ms: 60000 }, // 10000/min
    }

    const config = configs[tier]
    const identifier = `${userId}:${endpoint}`

    return this.checkTokenBucket(identifier, config)
  }

  /**
   * Circuit Breaker para proteger servicios externos
   */
  async checkCircuitBreaker(
    serviceId: string,
    failureThreshold: number = 5,
    timeoutMs: number = 60000
  ): Promise<{ open: boolean; message?: string }> {
    const { data: circuit } = await this.supabase
      .from('circuit_breakers')
      .select('*')
      .eq('service_id', serviceId)
      .single()

    if (!circuit) {
      // Inicializar circuit breaker
      await this.supabase
        .from('circuit_breakers')
        .insert({
          service_id: serviceId,
          state: 'closed',
          failure_count: 0,
          last_failure_at: null
        })

      return { open: false }
    }

    const now = Date.now()

    // Circuit breaker abierto - verificar si debe pasar a half-open
    if (circuit.state === 'open') {
      const timeSinceLastFailure = now - new Date(circuit.last_failure_at).getTime()
      
      if (timeSinceLastFailure >= timeoutMs) {
        // Pasar a half-open (permitir una request de prueba)
        await this.supabase
          .from('circuit_breakers')
          .update({ state: 'half-open' })
          .eq('service_id', serviceId)

        return { open: false }
      }

      return {
        open: true,
        message: `Service ${serviceId} is temporarily unavailable. Retry after ${Math.ceil((timeoutMs - timeSinceLastFailure) / 1000)}s`
      }
    }

    // Circuit breaker cerrado o half-open - permitir request
    return { open: false }
  }

  /**
   * Registrar fallo en circuit breaker
   */
  async recordCircuitBreakerFailure(
    serviceId: string,
    failureThreshold: number = 5
  ): Promise<void> {
    const { data: circuit } = await this.supabase
      .from('circuit_breakers')
      .select('*')
      .eq('service_id', serviceId)
      .single()

    if (!circuit) return

    const newFailureCount = circuit.failure_count + 1

    if (newFailureCount >= failureThreshold) {
      // Abrir circuit breaker
      await this.supabase
        .from('circuit_breakers')
        .update({
          state: 'open',
          failure_count: newFailureCount,
          last_failure_at: new Date().toISOString()
        })
        .eq('service_id', serviceId)
    } else {
      // Incrementar contador
      await this.supabase
        .from('circuit_breakers')
        .update({
          failure_count: newFailureCount,
          last_failure_at: new Date().toISOString()
        })
        .eq('service_id', serviceId)
    }
  }

  /**
   * Registrar éxito en circuit breaker
   */
  async recordCircuitBreakerSuccess(serviceId: string): Promise<void> {
    const { data: circuit } = await this.supabase
      .from('circuit_breakers')
      .select('*')
      .eq('service_id', serviceId)
      .single()

    if (!circuit) return

    if (circuit.state === 'half-open') {
      // Cerrar circuit breaker después de éxito en half-open
      await this.supabase
        .from('circuit_breakers')
        .update({
          state: 'closed',
          failure_count: 0,
          last_failure_at: null
        })
        .eq('service_id', serviceId)
    } else if (circuit.state === 'closed' && circuit.failure_count > 0) {
      // Resetear contador de fallos
      await this.supabase
        .from('circuit_breakers')
        .update({ failure_count: 0 })
        .eq('service_id', serviceId)
    }
  }
}

/**
 * Middleware para aplicar rate limiting
 */
export async function rateLimitMiddleware(
  req: Request,
  identifier: string,
  config: RateLimitConfig,
  supabase: any
): Promise<Response | null> {
  const limiter = new RateLimiter(supabase)
  const result = await limiter.checkTokenBucket(identifier, config)

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retry_after: result.retry_after,
        reset_at: result.reset_at
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.max_requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset_at.toString(),
          'Retry-After': result.retry_after?.toString() || '60'
        }
      }
    )
  }

  return null // Permitir la request
}

