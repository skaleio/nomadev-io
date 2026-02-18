-- Tabla para notificaciones de usuarios
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX idx_user_notifications_read ON user_notifications(read);

-- RLS (Row Level Security)
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus notificaciones
CREATE POLICY "Users can view their own notifications"
ON user_notifications FOR SELECT
USING (auth.uid() = user_id);

-- Política para insertar notificaciones (solo el sistema)
CREATE POLICY "System can create notifications"
ON user_notifications FOR INSERT
WITH CHECK (TRUE);

-- Política para marcar como leídas
CREATE POLICY "Users can update their own notifications"
ON user_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Tabla para logs de webhooks
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  topic VARCHAR(100),
  shop_domain VARCHAR(255),
  payload_size INTEGER,
  error_message TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX idx_webhook_logs_processed_at ON webhook_logs(processed_at DESC);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);

-- RLS para logs (solo administradores)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Función para limpiar logs antiguos (más de 30 días)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM webhook_logs
  WHERE processed_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Función para limpiar notificaciones leídas antiguas (más de 7 días)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM user_notifications
  WHERE read = TRUE
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$;