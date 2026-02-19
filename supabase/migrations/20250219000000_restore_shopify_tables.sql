-- ============================================
-- Restaurar tablas de Shopify para OAuth y conexión
-- (eliminadas en cleanup; necesarias para flujo OAuth y ver pedidos)
-- ============================================

-- Tabla para estados OAuth (prevenir CSRF) - fue eliminada en cleanup
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

CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_token ON shopify_oauth_states(state_token);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_expires ON shopify_oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_user ON shopify_oauth_states(user_id);

-- Tabla para almacenar conexiones OAuth de Shopify (puede no existir si BD nueva)
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

CREATE INDEX IF NOT EXISTS idx_shopify_connections_user_id ON shopify_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_connections_shop_domain ON shopify_connections(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_connections_active ON shopify_connections(is_active) WHERE is_active = TRUE;

-- Tabla para logs de actividad Shopify (opcional para OAuth; útil para soporte)
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

CREATE INDEX IF NOT EXISTS idx_shopify_activity_user ON shopify_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_shopify_activity_connection ON shopify_activity_log(connection_id);
CREATE INDEX IF NOT EXISTS idx_shopify_activity_created ON shopify_activity_log(created_at);

-- Tabla para webhooks de Shopify (Fase 2+)
CREATE TABLE IF NOT EXISTS shopify_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    connection_id UUID REFERENCES shopify_connections(id) ON DELETE CASCADE,
    webhook_id BIGINT,
    topic TEXT NOT NULL,
    address TEXT NOT NULL,
    format TEXT DEFAULT 'json',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopify_webhooks_connection ON shopify_webhooks(connection_id);
CREATE INDEX IF NOT EXISTS idx_shopify_webhooks_topic ON shopify_webhooks(topic);
CREATE INDEX IF NOT EXISTS idx_shopify_webhooks_active ON shopify_webhooks(is_active) WHERE is_active = TRUE;

-- RLS
ALTER TABLE shopify_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas (drop si existen para idempotencia)
DROP POLICY IF EXISTS "Users can view their own OAuth states" ON shopify_oauth_states;
DROP POLICY IF EXISTS "Users can insert their own OAuth states" ON shopify_oauth_states;
DROP POLICY IF EXISTS "Users can update their own OAuth states" ON shopify_oauth_states;
CREATE POLICY "Users can view their own OAuth states" ON shopify_oauth_states FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own OAuth states" ON shopify_oauth_states FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own OAuth states" ON shopify_oauth_states FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own Shopify connections" ON shopify_connections;
DROP POLICY IF EXISTS "Users can insert their own Shopify connections" ON shopify_connections;
DROP POLICY IF EXISTS "Users can update their own Shopify connections" ON shopify_connections;
DROP POLICY IF EXISTS "Users can delete their own Shopify connections" ON shopify_connections;
CREATE POLICY "Users can view their own Shopify connections" ON shopify_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own Shopify connections" ON shopify_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own Shopify connections" ON shopify_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own Shopify connections" ON shopify_connections FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own activity log" ON shopify_activity_log;
DROP POLICY IF EXISTS "System can insert activity logs" ON shopify_activity_log;
CREATE POLICY "Users can view their own activity log" ON shopify_activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert activity logs" ON shopify_activity_log FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view webhooks for their connections" ON shopify_webhooks;
DROP POLICY IF EXISTS "System can manage webhooks" ON shopify_webhooks;
CREATE POLICY "Users can view webhooks for their connections" ON shopify_webhooks FOR SELECT USING (
    EXISTS (SELECT 1 FROM shopify_connections WHERE id = connection_id AND user_id = auth.uid())
);
CREATE POLICY "System can manage webhooks" ON shopify_webhooks FOR ALL WITH CHECK (true);

-- Función updated_at (puede existir ya en el proyecto)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_shopify_connections_updated_at ON shopify_connections;
CREATE TRIGGER update_shopify_connections_updated_at
    BEFORE UPDATE ON shopify_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopify_webhooks_updated_at ON shopify_webhooks;
CREATE TRIGGER update_shopify_webhooks_updated_at
    BEFORE UPDATE ON shopify_webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para registrar actividad (callback e init la usan)
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
    INSERT INTO shopify_activity_log (connection_id, user_id, action, details, success, error_message)
    VALUES (p_connection_id, p_user_id, p_action, p_details, p_success, p_error_message)
    RETURNING id INTO log_id;
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;
