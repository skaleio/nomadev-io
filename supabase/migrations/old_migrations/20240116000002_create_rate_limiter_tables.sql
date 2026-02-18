-- ================================================
-- NOMADEV Rate Limiter & Load Balancing Tables
-- ================================================

-- Token Bucket para rate limiting con ráfagas
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL UNIQUE, -- user_id, ip, api_key_id
  tokens DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_refill BIGINT NOT NULL,
  window_ms INTEGER NOT NULL,
  max_tokens INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_buckets_identifier ON rate_limit_buckets(identifier);

-- Sliding Window Counter para rate limiting preciso
CREATE TABLE IF NOT EXISTS rate_limit_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL,
  window BIGINT NOT NULL,
  count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_identifier_window UNIQUE (identifier, window)
);

CREATE INDEX idx_rate_limit_windows_identifier ON rate_limit_windows(identifier);
CREATE INDEX idx_rate_limit_windows_expires_at ON rate_limit_windows(expires_at);
CREATE INDEX idx_rate_limit_windows_window ON rate_limit_windows(window);

-- Circuit Breakers para proteger servicios externos
CREATE TABLE IF NOT EXISTS circuit_breakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id VARCHAR(255) NOT NULL UNIQUE,
  state VARCHAR(20) NOT NULL DEFAULT 'closed', -- closed, open, half-open
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_circuit_breakers_service_id ON circuit_breakers(service_id);
CREATE INDEX idx_circuit_breakers_state ON circuit_breakers(state);

-- Tabla para Health Checks de servicios
CREATE TABLE IF NOT EXISTS service_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(255) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL, -- healthy, degraded, down
  response_time_ms INTEGER,
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_health_checks_service_name ON service_health_checks(service_name);
CREATE INDEX idx_service_health_checks_last_check_at ON service_health_checks(last_check_at DESC);

-- Función para limpiar ventanas expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_windows()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_windows
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar updated_at
CREATE TRIGGER update_rate_limit_buckets_updated_at
  BEFORE UPDATE ON rate_limit_buckets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_breakers_updated_at
  BEFORE UPDATE ON circuit_breakers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE rate_limit_buckets IS 'Token bucket algorithm para rate limiting con bursts';
COMMENT ON TABLE rate_limit_windows IS 'Sliding window counter para rate limiting preciso';
COMMENT ON TABLE circuit_breakers IS 'Circuit breakers para proteger servicios externos';
COMMENT ON TABLE service_health_checks IS 'Health checks para monitoreo de servicios';

