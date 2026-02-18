-- Crear tabla para manejar estados OAuth de Shopify
CREATE TABLE shopify_oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Índices para consultas rápidas
CREATE INDEX idx_oauth_states_state ON shopify_oauth_states(state);
CREATE INDEX idx_oauth_states_user_id ON shopify_oauth_states(user_id);
CREATE INDEX idx_oauth_states_expires_at ON shopify_oauth_states(expires_at);

-- RLS (Row Level Security)
ALTER TABLE shopify_oauth_states ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios estados
CREATE POLICY "Users can view their own oauth states" ON shopify_oauth_states
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios estados
CREATE POLICY "Users can insert their own oauth states" ON shopify_oauth_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios estados
CREATE POLICY "Users can delete their own oauth states" ON shopify_oauth_states
  FOR DELETE USING (auth.uid() = user_id);

-- Función para limpiar estados expirados (se ejecutará automáticamente)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM shopify_oauth_states 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE shopify_oauth_states IS 'Almacena estados temporales para el flujo OAuth de Shopify';
COMMENT ON COLUMN shopify_oauth_states.state IS 'Estado único generado para verificar la autenticidad de la respuesta OAuth';
COMMENT ON COLUMN shopify_oauth_states.expires_at IS 'Tiempo de expiración del estado (10 minutos por defecto)';