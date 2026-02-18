import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  id?: string;
  eventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export type SecurityEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failed'
  | 'mfa_attempt'
  | 'mfa_success'
  | 'mfa_failed'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'data_breach_attempt'
  | 'sql_injection_attempt'
  | 'xss_attempt'
  | 'csrf_attempt'
  | 'unauthorized_access'
  | 'privilege_escalation'
  | 'data_export'
  | 'data_import'
  | 'password_change'
  | 'account_locked'
  | 'account_unlocked'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'webhook_attack'
  | 'ddos_detected'
  | 'malware_detected'
  | 'phishing_attempt';

export interface SecurityAlert {
  id: string;
  eventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers: string[];
  affectedIPs: string[];
  firstDetected: Date;
  lastDetected: Date;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
}

/**
 * Registra un evento de seguridad
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  details: Record<string, any>,
  options: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  } = {}
): Promise<void> {
  try {
    const severity = options.severity || getDefaultSeverity(eventType);
    
    const event: Omit<SecurityEvent, 'id'> = {
      eventType,
      severity,
      userId: options.userId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      endpoint: options.endpoint,
      details,
      timestamp: new Date()
    };
    
    const { error } = await supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        severity,
        user_id: options.userId,
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
        endpoint: options.endpoint,
        event_details: details,
        created_at: event.timestamp.toISOString()
      });
    
    if (error) throw error;
    
    // Verificar si necesita generar una alerta
    await checkForSecurityAlerts(event);
    
    // Enviar notificación si es crítico
    if (severity === 'critical') {
      await sendCriticalSecurityAlert(event);
    }
    
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * Detecta patrones de actividad sospechosa
 */
export async function detectSuspiciousActivity(
  userId?: string,
  ipAddress?: string
): Promise<SecurityAlert[]> {
  try {
    const alerts: SecurityAlert[] = [];
    
    // Detectar múltiples intentos de login fallidos
    if (userId) {
      const failedLogins = await detectFailedLoginPattern(userId);
      if (failedLogins) alerts.push(failedLogins);
    }
    
    // Detectar actividad desde múltiples IPs
    if (userId) {
      const multiIPActivity = await detectMultiIPActivity(userId);
      if (multiIPActivity) alerts.push(multiIPActivity);
    }
    
    // Detectar patrones de bot
    if (ipAddress) {
      const botPattern = await detectBotPattern(ipAddress);
      if (botPattern) alerts.push(botPattern);
    }
    
    // Detectar intentos de inyección SQL
    const sqlInjection = await detectSQLInjectionPattern(userId, ipAddress);
    if (sqlInjection) alerts.push(sqlInjection);
    
    // Detectar intentos de XSS
    const xssAttempts = await detectXSSPattern(userId, ipAddress);
    if (xssAttempts) alerts.push(xssAttempts);
    
    return alerts;
  } catch (error) {
    console.error('Error detecting suspicious activity:', error);
    return [];
  }
}

/**
 * Bloquea una IP o usuario por actividad sospechosa
 */
export async function blockSuspiciousActivity(
  type: 'ip' | 'user',
  identifier: string,
  reason: string,
  durationHours: number = 24
): Promise<void> {
  try {
    const blockedUntil = new Date();
    blockedUntil.setHours(blockedUntil.getHours() + durationHours);
    
    await supabase
      .from('security_blocks')
      .upsert({
        block_type: type,
        identifier,
        reason,
        blocked_until: blockedUntil.toISOString(),
        created_at: new Date().toISOString()
      });
    
    await logSecurityEvent('account_locked', {
      type,
      identifier,
      reason,
      durationHours,
      blockedUntil: blockedUntil.toISOString()
    }, { severity: 'high' });
    
  } catch (error) {
    console.error('Error blocking suspicious activity:', error);
  }
}

/**
 * Obtiene estadísticas de seguridad
 */
export async function getSecurityStats(
  timeRange: '24h' | '7d' | '30d' = '24h'
): Promise<{
  totalEvents: number;
  criticalEvents: number;
  blockedIPs: number;
  blockedUsers: number;
  topThreats: Array<{ eventType: string; count: number }>;
  topIPs: Array<{ ip: string; count: number }>;
}> {
  try {
    const timeRangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[timeRange];
    
    const since = new Date(Date.now() - timeRangeMs);
    
    // Total de eventos
    const { data: totalEvents, error: totalError } = await supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .gte('created_at', since.toISOString());
    
    if (totalError) throw totalError;
    
    // Eventos críticos
    const { data: criticalEvents, error: criticalError } = await supabase
      .from('security_events')
      .select('*', { count: 'exact' })
      .gte('created_at', since.toISOString())
      .eq('severity', 'critical');
    
    if (criticalError) throw criticalError;
    
    // IPs bloqueadas
    const { data: blockedIPs, error: blockedIPsError } = await supabase
      .from('security_blocks')
      .select('*', { count: 'exact' })
      .eq('block_type', 'ip')
      .gte('created_at', since.toISOString());
    
    if (blockedIPsError) throw blockedIPsError;
    
    // Usuarios bloqueados
    const { data: blockedUsers, error: blockedUsersError } = await supabase
      .from('security_blocks')
      .select('*', { count: 'exact' })
      .eq('block_type', 'user')
      .gte('created_at', since.toISOString());
    
    if (blockedUsersError) throw blockedUsersError;
    
    // Top amenazas
    const { data: topThreats, error: topThreatsError } = await supabase
      .from('security_events')
      .select('event_type')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });
    
    if (topThreatsError) throw topThreatsError;
    
    const threatCounts = topThreats?.reduce((acc: Record<string, number>, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {}) || {};
    
    const topThreatsArray = Object.entries(threatCounts)
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Top IPs
    const { data: topIPs, error: topIPsError } = await supabase
      .from('security_events')
      .select('ip_address')
      .gte('created_at', since.toISOString())
      .not('ip_address', 'is', null);
    
    if (topIPsError) throw topIPsError;
    
    const ipCounts = topIPs?.reduce((acc: Record<string, number>, event) => {
      if (event.ip_address) {
        acc[event.ip_address] = (acc[event.ip_address] || 0) + 1;
      }
      return acc;
    }, {}) || {};
    
    const topIPsArray = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalEvents: totalEvents?.length || 0,
      criticalEvents: criticalEvents?.length || 0,
      blockedIPs: blockedIPs?.length || 0,
      blockedUsers: blockedUsers?.length || 0,
      topThreats: topThreatsArray,
      topIPs: topIPsArray
    };
  } catch (error) {
    console.error('Error getting security stats:', error);
    return {
      totalEvents: 0,
      criticalEvents: 0,
      blockedIPs: 0,
      blockedUsers: 0,
      topThreats: [],
      topIPs: []
    };
  }
}

// Funciones auxiliares privadas
function getDefaultSeverity(eventType: SecurityEventType): 'low' | 'medium' | 'high' | 'critical' {
  const severityMap: Record<SecurityEventType, 'low' | 'medium' | 'high' | 'critical'> = {
    login_attempt: 'low',
    login_success: 'low',
    login_failed: 'medium',
    mfa_attempt: 'low',
    mfa_success: 'low',
    mfa_failed: 'high',
    rate_limit_exceeded: 'medium',
    suspicious_activity: 'high',
    data_breach_attempt: 'critical',
    sql_injection_attempt: 'critical',
    xss_attempt: 'critical',
    csrf_attempt: 'high',
    unauthorized_access: 'critical',
    privilege_escalation: 'critical',
    data_export: 'medium',
    data_import: 'medium',
    password_change: 'low',
    account_locked: 'high',
    account_unlocked: 'medium',
    api_key_created: 'low',
    api_key_revoked: 'medium',
    webhook_attack: 'high',
    ddos_detected: 'critical',
    malware_detected: 'critical',
    phishing_attempt: 'high'
  };
  
  return severityMap[eventType] || 'medium';
}

async function checkForSecurityAlerts(event: SecurityEvent): Promise<void> {
  // Implementar lógica para generar alertas basadas en patrones
  // Por ejemplo, múltiples eventos del mismo tipo en poco tiempo
}

async function sendCriticalSecurityAlert(event: SecurityEvent): Promise<void> {
  // Implementar notificación por email/SMS/Slack para eventos críticos
  console.log('CRITICAL SECURITY ALERT:', event);
}

async function detectFailedLoginPattern(userId: string): Promise<SecurityAlert | null> {
  // Implementar detección de patrones de login fallido
  return null;
}

async function detectMultiIPActivity(userId: string): Promise<SecurityAlert | null> {
  // Implementar detección de actividad desde múltiples IPs
  return null;
}

async function detectBotPattern(ipAddress: string): Promise<SecurityAlert | null> {
  // Implementar detección de patrones de bot
  return null;
}

async function detectSQLInjectionPattern(userId?: string, ipAddress?: string): Promise<SecurityAlert | null> {
  // Implementar detección de intentos de inyección SQL
  return null;
}

async function detectXSSPattern(userId?: string, ipAddress?: string): Promise<SecurityAlert | null> {
  // Implementar detección de intentos de XSS
  return null;
}
