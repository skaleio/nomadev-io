-- =====================================================
-- MIGRACIÓN SOLO DE SEGURIDAD ANTI-HACKEO
-- =====================================================

-- Tabla para MFA (Multi-Factor Authentication)
CREATE TABLE IF NOT EXISTS user_mfa_secrets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  secret TEXT NOT NULL, -- Encriptado
  backup_codes TEXT NOT NULL, -- Encriptado
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla para sesiones MFA
CREATE TABLE IF NOT EXISTS user_mfa_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  last_used TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla para rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP, user ID, o combinación
  endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para bloqueos de rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  blocked_until TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para eventos de seguridad
CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  endpoint TEXT,
  event_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para alertas de seguridad
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_users TEXT[],
  affected_ips INET[],
  first_detected TIMESTAMPTZ DEFAULT NOW(),
  last_detected TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive')),
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para bloqueos de seguridad
CREATE TABLE IF NOT EXISTS security_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_type TEXT NOT NULL CHECK (block_type IN ('ip', 'user')),
  identifier TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para intentos de login
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  ip_address INET NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  mfa_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para API keys de seguridad
CREATE TABLE IF NOT EXISTS security_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- Hash de la API key
  permissions TEXT[] NOT NULL,
  last_used TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para auditoría de cambios
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA RENDIMIENTO
-- =====================================================

-- Índices para rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_identifier_created ON rate_limit_logs(identifier, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at ON rate_limit_logs(created_at);

-- Índices para eventos de seguridad
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_type_severity ON security_events(event_type, severity);

-- Índices para intentos de login
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);

-- Índices para auditoría
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON security_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON security_audit_log(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE user_mfa_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mfa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para MFA
CREATE POLICY "Users can manage their own MFA secrets" ON user_mfa_secrets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own MFA sessions" ON user_mfa_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para API keys
CREATE POLICY "Users can manage their own API keys" ON security_api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para auditoría (solo lectura para usuarios)
CREATE POLICY "Users can view their own audit log" ON security_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Las tablas de seguridad del sistema solo son accesibles por service role
CREATE POLICY "Only service role can access security tables" ON rate_limit_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can access security blocks" ON security_blocks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can access security events" ON security_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can access security alerts" ON security_alerts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can access login attempts" ON login_attempts
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- FUNCIONES DE SEGURIDAD
-- =====================================================

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION cleanup_security_logs()
RETURNS void AS $$
BEGIN
  -- Limpiar logs de rate limiting más antiguos de 7 días
  DELETE FROM rate_limit_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Limpiar eventos de seguridad más antiguos de 30 días
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '30 days' 
  AND severity IN ('low', 'medium');
  
  -- Limpiar intentos de login más antiguos de 90 días
  DELETE FROM login_attempts 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Limpiar auditoría más antigua de 1 año
  DELETE FROM security_audit_log 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para detectar actividad sospechosa
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS void AS $$
BEGIN
  -- Detectar múltiples intentos de login fallidos
  INSERT INTO security_events (event_type, severity, user_id, ip_address, event_details)
  SELECT 
    'suspicious_activity',
    'high',
    user_id,
    ip_address,
    jsonb_build_object(
      'failed_attempts', COUNT(*),
      'time_window', '1 hour'
    )
  FROM login_attempts 
  WHERE success = false 
    AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY user_id, ip_address
  HAVING COUNT(*) >= 5;
  
  -- Detectar actividad desde múltiples IPs
  INSERT INTO security_events (event_type, severity, user_id, event_details)
  SELECT 
    'suspicious_activity',
    'medium',
    user_id,
    jsonb_build_object(
      'unique_ips', COUNT(DISTINCT ip_address),
      'time_window', '24 hours'
    )
  FROM login_attempts 
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY user_id
  HAVING COUNT(DISTINCT ip_address) >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS DE AUDITORÍA
-- =====================================================

-- Función para auditoría automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO security_audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO security_audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO security_audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers de auditoría a tablas críticas (solo si existen)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_users_trigger ON public.users;
    CREATE TRIGGER audit_users_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.users
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shops' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_shops_trigger ON public.shops;
    CREATE TRIGGER audit_shops_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.shops
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
  END IF;
END $$;
