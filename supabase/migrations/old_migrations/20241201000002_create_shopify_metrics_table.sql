-- Crear tabla para almacenar snapshots de métricas de Shopify
CREATE TABLE shopify_metrics_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  date_range VARCHAR(10) NOT NULL, -- '7d', '30d', '90d'
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX idx_metrics_timestamp ON shopify_metrics_snapshots(timestamp);
CREATE INDEX idx_metrics_user_id ON shopify_metrics_snapshots(user_id);
CREATE INDEX idx_metrics_shop_id ON shopify_metrics_snapshots(shop_id);
CREATE INDEX idx_metrics_date_range ON shopify_metrics_snapshots(date_range);
CREATE INDEX idx_metrics_period ON shopify_metrics_snapshots(period_start, period_end);

-- RLS (Row Level Security)
ALTER TABLE shopify_metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias métricas
CREATE POLICY "Users can view their own metrics" ON shopify_metrics_snapshots
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias métricas
CREATE POLICY "Users can insert their own metrics" ON shopify_metrics_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias métricas
CREATE POLICY "Users can update their own metrics" ON shopify_metrics_snapshots
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propias métricas
CREATE POLICY "Users can delete their own metrics" ON shopify_metrics_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE shopify_metrics_snapshots IS 'Almacena snapshots históricos de métricas de Shopify para análisis y comparación';
COMMENT ON COLUMN shopify_metrics_snapshots.metrics IS 'JSON con todas las métricas calculadas (ventas, productos, clientes, performance)';
COMMENT ON COLUMN shopify_metrics_snapshots.date_range IS 'Rango de fechas del snapshot: 7d, 30d, 90d';
