-- Tabla para almacenar conexiones OAuth de Shopify
CREATE TABLE IF NOT EXISTS shopify_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_domain TEXT NOT NULL,
    access_token TEXT NOT NULL,
    scope TEXT[] DEFAULT '{}',
    token_type TEXT DEFAULT 'bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token TEXT,
    shop_info JSONB DEFAULT '{}',
    webhooks_configured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, shop_domain)
);

-- Tabla para estados OAuth (prevenir CSRF)
CREATE TABLE IF NOT EXISTS shopify_oauth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    state_token TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_domain TEXT,
    redirect_uri TEXT,
    scopes TEXT[] DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para logs de actividad Shopify
CREATE TABLE IF NOT EXISTS shopify_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    connection_id UUID REFERENCES shopify_connections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para webhooks de Shopify
CREATE TABLE IF NOT EXISTS shopify_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    connection_id UUID REFERENCES shopify_connections(id) ON DELETE CASCADE,
    webhook_id BIGINT, -- ID del webhook en Shopify
    topic TEXT NOT NULL,
    address TEXT NOT NULL,
    format TEXT DEFAULT 'json',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_shopify_connections_user_id ON shopify_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_connections_shop_domain ON shopify_connections(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_connections_active ON shopify_connections(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_token ON shopify_oauth_states(state_token);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_expires ON shopify_oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_user ON shopify_oauth_states(user_id);

CREATE INDEX IF NOT EXISTS idx_shopify_activity_user ON shopify_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_activity_connection ON shopify_activity_log(connection_id);
CREATE INDEX IF NOT EXISTS idx_shopify_activity_created ON shopify_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_shopify_webhooks_connection ON shopify_webhooks(connection_id);
CREATE INDEX IF NOT EXISTS idx_shopify_webhooks_topic ON shopify_webhooks(topic);
CREATE INDEX IF NOT EXISTS idx_shopify_webhooks_active ON shopify_webhooks(is_active) WHERE is_active = TRUE;

-- RLS (Row Level Security) policies
ALTER TABLE shopify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas para shopify_connections
CREATE POLICY "Users can view their own Shopify connections" ON shopify_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Shopify connections" ON shopify_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Shopify connections" ON shopify_connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Shopify connections" ON shopify_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para shopify_oauth_states
CREATE POLICY "Users can view their own OAuth states" ON shopify_oauth_states
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own OAuth states" ON shopify_oauth_states
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OAuth states" ON shopify_oauth_states
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para shopify_activity_log
CREATE POLICY "Users can view their own activity log" ON shopify_activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON shopify_activity_log
    FOR INSERT WITH CHECK (true);

-- Políticas para shopify_webhooks
CREATE POLICY "Users can view webhooks for their connections" ON shopify_webhooks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shopify_connections
            WHERE id = connection_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage webhooks" ON shopify_webhooks
    FOR ALL WITH CHECK (true);

-- Función para limpiar estados OAuth expirados
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM shopify_oauth_states
    WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_shopify_connections_updated_at
    BEFORE UPDATE ON shopify_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopify_webhooks_updated_at
    BEFORE UPDATE ON shopify_webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para registrar actividad
CREATE OR REPLACE FUNCTION log_shopify_activity(
    p_connection_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_details JSONB DEFAULT '{}',
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO shopify_activity_log (
        connection_id,
        user_id,
        action,
        details,
        success,
        error_message
    )
    VALUES (
        p_connection_id,
        p_user_id,
        p_action,
        p_details,
        p_success,
        p_error_message
    )
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE shopify_connections IS 'Almacena las conexiones OAuth activas de Shopify por usuario';
COMMENT ON TABLE shopify_oauth_states IS 'Estados temporales para el flujo OAuth de Shopify (prevenir CSRF)';
COMMENT ON TABLE shopify_activity_log IS 'Log de actividades relacionadas con Shopify por usuario';
COMMENT ON TABLE shopify_webhooks IS 'Webhooks configurados en las tiendas de Shopify';

COMMENT ON COLUMN shopify_connections.access_token IS 'Token de acceso encriptado de Shopify';
COMMENT ON COLUMN shopify_connections.shop_info IS 'Información adicional de la tienda en formato JSON';
COMMENT ON COLUMN shopify_oauth_states.state_token IS 'Token único para validar el flujo OAuth';
COMMENT ON COLUMN shopify_oauth_states.expires_at IS 'Fecha de expiración del estado (10 minutos por defecto)';

-- Insertar algunos scopes comunes como referencia
INSERT INTO shopify_oauth_states (state_token, user_id, scopes, expires_at) VALUES
('example-state-token', NULL, ARRAY['read_products', 'write_products', 'read_orders', 'write_orders', 'read_customers', 'write_customers'], NOW() + INTERVAL '1 second')
ON CONFLICT DO NOTHING;

-- Limpiar el ejemplo inmediatamente
DELETE FROM shopify_oauth_states WHERE state_token = 'example-state-token';