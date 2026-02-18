-- Crear tabla para almacenar configuraciones de variables de entorno de usuarios
CREATE TABLE IF NOT EXISTS user_env_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL,
  variable_value TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_env_configs_user_id ON user_env_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_env_configs_variable_name ON user_env_configs(variable_name);
CREATE INDEX IF NOT EXISTS idx_user_env_configs_created_at ON user_env_configs(created_at);

-- Crear índice compuesto para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_user_env_configs_user_variable ON user_env_configs(user_id, variable_name);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_user_env_configs_updated_at 
  BEFORE UPDATE ON user_env_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Política RLS (Row Level Security)
ALTER TABLE user_env_configs ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver/editar sus propias configuraciones
CREATE POLICY "Users can manage their own env configs" ON user_env_configs
  FOR ALL USING (auth.uid() = user_id);

-- Política para que los administradores puedan ver todas las configuraciones
CREATE POLICY "Admins can view all env configs" ON user_env_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Comentarios para documentación
COMMENT ON TABLE user_env_configs IS 'Almacena las configuraciones de variables de entorno de cada usuario';
COMMENT ON COLUMN user_env_configs.user_id IS 'ID del usuario propietario de la configuración';
COMMENT ON COLUMN user_env_configs.variable_name IS 'Nombre de la variable de entorno (ej: VITE_SUPABASE_URL)';
COMMENT ON COLUMN user_env_configs.variable_value IS 'Valor de la variable (encriptado si is_encrypted es true)';
COMMENT ON COLUMN user_env_configs.is_encrypted IS 'Indica si el valor está encriptado';
COMMENT ON COLUMN user_env_configs.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN user_env_configs.updated_at IS 'Fecha de última actualización del registro';
