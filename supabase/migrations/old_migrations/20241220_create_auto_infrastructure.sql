-- Crear tabla para infraestructura automatizada de usuarios
CREATE TABLE IF NOT EXISTS user_infrastructure (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  database_schema TEXT NOT NULL UNIQUE,
  evolution_instance TEXT NOT NULL UNIQUE,
  webhook_url TEXT NOT NULL,
  api_keys JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para webhooks de usuarios
CREATE TABLE IF NOT EXISTS user_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para configuraciones externas de usuarios (Shopify, etc.)
CREATE TABLE IF NOT EXISTS user_external_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL, -- 'shopify', 'woocommerce', etc.
  config_data JSONB NOT NULL, -- Credenciales y configuraciones
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_name)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_infrastructure_user_id ON user_infrastructure(user_id);
CREATE INDEX IF NOT EXISTS idx_user_infrastructure_schema ON user_infrastructure(database_schema);
CREATE INDEX IF NOT EXISTS idx_user_infrastructure_instance ON user_infrastructure(evolution_instance);
CREATE INDEX IF NOT EXISTS idx_user_infrastructure_active ON user_infrastructure(is_active);

CREATE INDEX IF NOT EXISTS idx_user_webhooks_user_id ON user_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_webhooks_active ON user_webhooks(is_active);

CREATE INDEX IF NOT EXISTS idx_user_external_configs_user_id ON user_external_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_external_configs_service ON user_external_configs(service_name);
CREATE INDEX IF NOT EXISTS idx_user_external_configs_active ON user_external_configs(is_active);

-- Función para crear esquema de usuario
CREATE OR REPLACE FUNCTION create_user_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- Crear tablas básicas en el esquema del usuario
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT,
    customer_id UUID,
    status TEXT NOT NULL,
    total_amount DECIMAL(10,2),
    currency TEXT DEFAULT ''USD'',
    order_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )', schema_name);
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT,
    email TEXT,
    phone TEXT,
    name TEXT,
    customer_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )', schema_name);
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT ''USD'',
    product_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )', schema_name);
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT,
    message_data JSONB,
    status TEXT DEFAULT ''sent'',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )', schema_name);
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )', schema_name);
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,2),
    metric_data JSONB,
    date_recorded DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )', schema_name);
  
  -- Crear índices en las tablas del usuario
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_orders_external_id ON %I.orders(external_id)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_orders_status ON %I.orders(status)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_customers_email ON %I.customers(email)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_messages_from ON %I.messages(from_number)', schema_name, schema_name);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_analytics_metric ON %I.analytics(metric_name)', schema_name, schema_name);
  
END;
$$ LANGUAGE plpgsql;

-- Función para crear tabla específica en esquema de usuario
CREATE OR REPLACE FUNCTION create_user_table(schema_name TEXT, table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Esta función ya está cubierta por create_user_schema
  -- Se mantiene para compatibilidad
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para eliminar esquema de usuario
CREATE OR REPLACE FUNCTION drop_user_schema(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_user_infrastructure_updated_at 
  BEFORE UPDATE ON user_infrastructure 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_webhooks_updated_at 
  BEFORE UPDATE ON user_webhooks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_external_configs_updated_at 
  BEFORE UPDATE ON user_external_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS
ALTER TABLE user_infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_external_configs ENABLE ROW LEVEL SECURITY;

-- Políticas para user_infrastructure
CREATE POLICY "Users can view their own infrastructure" ON user_infrastructure
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all infrastructure" ON user_infrastructure
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Políticas para user_webhooks
CREATE POLICY "Users can manage their own webhooks" ON user_webhooks
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_external_configs
CREATE POLICY "Users can manage their own external configs" ON user_external_configs
  FOR ALL USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE user_infrastructure IS 'Infraestructura automatizada para cada usuario (esquemas, instancias, webhooks)';
COMMENT ON TABLE user_webhooks IS 'Configuración de webhooks por usuario';
COMMENT ON TABLE user_external_configs IS 'Configuraciones de servicios externos (Shopify, WooCommerce, etc.)';

COMMENT ON COLUMN user_infrastructure.database_schema IS 'Esquema único de base de datos para el usuario';
COMMENT ON COLUMN user_infrastructure.evolution_instance IS 'Instancia única de Evolution API para el usuario';
COMMENT ON COLUMN user_infrastructure.api_keys IS 'Claves API únicas generadas para el usuario';
COMMENT ON COLUMN user_external_configs.service_name IS 'Nombre del servicio externo (shopify, woocommerce, etc.)';
COMMENT ON COLUMN user_external_configs.config_data IS 'Datos de configuración encriptados del servicio externo';
