-- =====================================================
-- MIGRACIÓN: Agregar configuración de EasyDrop a shops
-- =====================================================

-- Agregar columna para configuración de EasyDrop
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS easydrop_config JSONB;

-- Agregar comentario a la columna
COMMENT ON COLUMN public.shops.easydrop_config IS 'Configuración de API de EasyDrop para integración de envíos';

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_shops_easydrop_config 
ON public.shops USING GIN (easydrop_config);

-- =====================================================
-- ACTUALIZAR TABLA DE ENVÍOS PARA EASYDROP
-- =====================================================

-- Agregar columnas específicas para EasyDrop
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS easydrop_shipment_id TEXT,
ADD COLUMN IF NOT EXISTS easydrop_label_url TEXT,
ADD COLUMN IF NOT EXISTS easydrop_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS easydrop_service_type TEXT DEFAULT 'standard';

-- Agregar comentarios
COMMENT ON COLUMN public.shipments.easydrop_shipment_id IS 'ID del envío en EasyDrop';
COMMENT ON COLUMN public.shipments.easydrop_label_url IS 'URL de la etiqueta de envío de EasyDrop';
COMMENT ON COLUMN public.shipments.easydrop_cost IS 'Costo del envío en EasyDrop';
COMMENT ON COLUMN public.shipments.easydrop_service_type IS 'Tipo de servicio de EasyDrop (standard, express, overnight)';

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_shipments_easydrop_shipment_id 
ON public.shipments (easydrop_shipment_id);

CREATE INDEX IF NOT EXISTS idx_shipments_easydrop_service_type 
ON public.shipments (easydrop_service_type);

-- =====================================================
-- CREAR TABLA DE LOGS DE INTEGRACIÓN EASYDROP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.easydrop_integration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('create_shipment', 'track_shipment', 'update_status', 'error')),
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar comentarios
COMMENT ON TABLE public.easydrop_integration_logs IS 'Logs de integración con EasyDrop para auditoría y debugging';
COMMENT ON COLUMN public.easydrop_integration_logs.action IS 'Acción realizada en EasyDrop';
COMMENT ON COLUMN public.easydrop_integration_logs.status IS 'Estado de la operación';
COMMENT ON COLUMN public.easydrop_integration_logs.request_data IS 'Datos enviados a EasyDrop';
COMMENT ON COLUMN public.easydrop_integration_logs.response_data IS 'Respuesta recibida de EasyDrop';

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_easydrop_logs_shop_id 
ON public.easydrop_integration_logs (shop_id);

CREATE INDEX IF NOT EXISTS idx_easydrop_logs_order_id 
ON public.easydrop_integration_logs (order_id);

CREATE INDEX IF NOT EXISTS idx_easydrop_logs_action 
ON public.easydrop_integration_logs (action);

CREATE INDEX IF NOT EXISTS idx_easydrop_logs_status 
ON public.easydrop_integration_logs (status);

CREATE INDEX IF NOT EXISTS idx_easydrop_logs_created_at 
ON public.easydrop_integration_logs (created_at);

-- =====================================================
-- CREAR FUNCIÓN PARA ACTUALIZAR TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_easydrop_integration_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS trigger_update_easydrop_integration_logs_updated_at 
ON public.easydrop_integration_logs;

CREATE TRIGGER trigger_update_easydrop_integration_logs_updated_at
    BEFORE UPDATE ON public.easydrop_integration_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_easydrop_integration_logs_updated_at();

-- =====================================================
-- CREAR VISTA PARA ESTADÍSTICAS DE EASYDROP
-- =====================================================

CREATE OR REPLACE VIEW public.easydrop_stats AS
SELECT 
    s.id as shop_id,
    s.name as shop_name,
    COUNT(DISTINCT sh.id) as total_shipments,
    COUNT(DISTINCT CASE WHEN sh.status = 'delivered' THEN sh.id END) as delivered_shipments,
    COUNT(DISTINCT CASE WHEN sh.status = 'in_transit' THEN sh.id END) as in_transit_shipments,
    COUNT(DISTINCT CASE WHEN sh.status = 'failed' THEN sh.id END) as failed_shipments,
    COALESCE(SUM(sh.easydrop_cost), 0) as total_shipping_cost,
    COALESCE(AVG(sh.easydrop_cost), 0) as avg_shipping_cost,
    COUNT(DISTINCT eil.id) as total_api_calls,
    COUNT(DISTINCT CASE WHEN eil.status = 'success' THEN eil.id END) as successful_api_calls,
    COUNT(DISTINCT CASE WHEN eil.status = 'error' THEN eil.id END) as failed_api_calls,
    ROUND(
        (COUNT(DISTINCT CASE WHEN eil.status = 'success' THEN eil.id END)::DECIMAL / 
         NULLIF(COUNT(DISTINCT eil.id), 0)) * 100, 2
    ) as success_rate_percentage
FROM public.shops s
LEFT JOIN public.shipments sh ON s.id = sh.order_id IN (
    SELECT o.id FROM public.orders o WHERE o.shop_id = s.id
)
LEFT JOIN public.easydrop_integration_logs eil ON s.id = eil.shop_id
WHERE s.easydrop_config IS NOT NULL
GROUP BY s.id, s.name;

-- Agregar comentario a la vista
COMMENT ON VIEW public.easydrop_stats IS 'Estadísticas de integración con EasyDrop por tienda';

-- =====================================================
-- CREAR POLÍTICAS RLS PARA EASYDROP
-- =====================================================

-- Habilitar RLS en la tabla de logs
ALTER TABLE public.easydrop_integration_logs ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propios logs
CREATE POLICY "Users can view their own easydrop integration logs" ON public.easydrop_integration_logs
    FOR SELECT USING (
        shop_id IN (
            SELECT id FROM public.shops WHERE user_id = auth.uid()
        )
    );

-- Política para que los usuarios solo inserten logs para sus tiendas
CREATE POLICY "Users can insert easydrop integration logs for their shops" ON public.easydrop_integration_logs
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT id FROM public.shops WHERE user_id = auth.uid()
        )
    );

-- Política para que los usuarios solo actualicen logs de sus tiendas
CREATE POLICY "Users can update easydrop integration logs for their shops" ON public.easydrop_integration_logs
    FOR UPDATE USING (
        shop_id IN (
            SELECT id FROM public.shops WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- DATOS DE EJEMPLO PARA TESTING
-- =====================================================

-- Insertar configuración de ejemplo para testing (solo en desarrollo)
-- NOTA: Esto se debe comentar en producción
/*
INSERT INTO public.shops (user_id, name, easydrop_config)
SELECT 
    u.id,
    'Tienda de Prueba EasyDrop',
    '{
        "apiKey": "test_api_key_123",
        "apiSecret": "test_api_secret_456",
        "baseUrl": "https://sandbox-api.easydrop.cl",
        "environment": "sandbox"
    }'::jsonb
FROM auth.users u
WHERE u.email = 'test@nomadev.io'
ON CONFLICT DO NOTHING;
*/
