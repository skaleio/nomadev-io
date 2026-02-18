-- ================================================
-- NOMADEV Batch Sending System
-- ================================================

-- Tabla de campañas de envío masivo
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  message_template TEXT NOT NULL,
  media_url TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, processing, completed, failed, cancelled
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Configuración de envío
  send_rate INTEGER DEFAULT 10, -- mensajes por minuto
  batch_size INTEGER DEFAULT 100,
  retry_failed BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  
  -- Segmentación
  target_segment JSONB, -- filtros para segmentar audiencia
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled_for ON campaigns(scheduled_for);

-- Tabla de destinatarios de campaña
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  variables JSONB, -- variables personalizadas para el template
  status VARCHAR(50) DEFAULT 'pending', -- pending, queued, sending, sent, delivered, failed
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  message_id VARCHAR(255), -- ID del mensaje de WhatsApp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_campaign_phone UNIQUE (campaign_id, phone)
);

CREATE INDEX idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX idx_campaign_recipients_phone ON campaign_recipients(phone);

-- Tabla de cola de mensajes (Message Queue)
CREATE TABLE IF NOT EXISTS message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES campaign_recipients(id) ON DELETE CASCADE,
  
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  media_url TEXT,
  
  -- Control de cola
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, sent, failed
  priority INTEGER DEFAULT 5, -- 1-10, mayor = más prioridad
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  -- Resultado
  message_id VARCHAR(255),
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_queue_status ON message_queue(status);
CREATE INDEX idx_message_queue_scheduled_for ON message_queue(scheduled_for);
CREATE INDEX idx_message_queue_priority ON message_queue(priority DESC);
CREATE INDEX idx_message_queue_user_id ON message_queue(user_id);
CREATE INDEX idx_message_queue_campaign_id ON message_queue(campaign_id);

-- Tabla de lotes de procesamiento
CREATE TABLE IF NOT EXISTS processing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL,
  size INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_processing_batches_campaign_id ON processing_batches(campaign_id);
CREATE INDEX idx_processing_batches_status ON processing_batches(status);

-- Tabla de templates de mensajes
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- marketing, transactional, notification
  content TEXT NOT NULL,
  variables TEXT[], -- array de variables disponibles ej: ['name', 'order_id']
  media_url TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_templates_user_id ON message_templates(user_id);
CREATE INDEX idx_message_templates_category ON message_templates(category);
CREATE INDEX idx_message_templates_is_active ON message_templates(is_active);

-- Función para procesar siguiente mensaje en cola
CREATE OR REPLACE FUNCTION get_next_message_from_queue(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  phone VARCHAR(20),
  message TEXT,
  media_url TEXT,
  campaign_id UUID,
  recipient_id UUID
) AS $$
BEGIN
  RETURN QUERY
  UPDATE message_queue
  SET 
    status = 'processing',
    processing_started_at = NOW()
  WHERE message_queue.id = (
    SELECT message_queue.id
    FROM message_queue
    WHERE message_queue.user_id = user_id_param
      AND message_queue.status = 'pending'
      AND message_queue.scheduled_for <= NOW()
      AND (
        message_queue.next_retry_at IS NULL 
        OR message_queue.next_retry_at <= NOW()
      )
    ORDER BY message_queue.priority DESC, message_queue.scheduled_for ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    message_queue.id,
    message_queue.phone,
    message_queue.message,
    message_queue.media_url,
    message_queue.campaign_id,
    message_queue.recipient_id;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar lote de mensajes
CREATE OR REPLACE FUNCTION get_batch_from_queue(user_id_param UUID, batch_size_param INTEGER)
RETURNS TABLE (
  id UUID,
  phone VARCHAR(20),
  message TEXT,
  media_url TEXT,
  campaign_id UUID,
  recipient_id UUID
) AS $$
BEGIN
  RETURN QUERY
  UPDATE message_queue
  SET 
    status = 'processing',
    processing_started_at = NOW()
  WHERE message_queue.id IN (
    SELECT message_queue.id
    FROM message_queue
    WHERE message_queue.user_id = user_id_param
      AND message_queue.status = 'pending'
      AND message_queue.scheduled_for <= NOW()
      AND (
        message_queue.next_retry_at IS NULL 
        OR message_queue.next_retry_at <= NOW()
      )
    ORDER BY message_queue.priority DESC, message_queue.scheduled_for ASC
    LIMIT batch_size_param
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    message_queue.id,
    message_queue.phone,
    message_queue.message,
    message_queue.media_url,
    message_queue.campaign_id,
    message_queue.recipient_id;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar mensaje como enviado
CREATE OR REPLACE FUNCTION mark_message_sent(
  message_id_param UUID,
  whatsapp_message_id VARCHAR(255)
)
RETURNS void AS $$
BEGIN
  UPDATE message_queue
  SET 
    status = 'sent',
    completed_at = NOW(),
    message_id = whatsapp_message_id
  WHERE id = message_id_param;
  
  -- Actualizar recipient si existe
  UPDATE campaign_recipients
  SET 
    status = 'sent',
    sent_at = NOW(),
    message_id = whatsapp_message_id
  WHERE id = (SELECT recipient_id FROM message_queue WHERE id = message_id_param);
END;
$$ LANGUAGE plpgsql;

-- Función para marcar mensaje como fallido y programar retry
CREATE OR REPLACE FUNCTION mark_message_failed(
  message_id_param UUID,
  error_message_param TEXT
)
RETURNS void AS $$
DECLARE
  current_retry_count INTEGER;
  max_retries INTEGER;
  should_retry BOOLEAN;
BEGIN
  SELECT retry_count, message_queue.max_retries INTO current_retry_count, max_retries
  FROM message_queue
  WHERE id = message_id_param;
  
  should_retry := current_retry_count < max_retries;
  
  IF should_retry THEN
    -- Programar retry con backoff exponencial
    UPDATE message_queue
    SET 
      status = 'pending',
      retry_count = retry_count + 1,
      next_retry_at = NOW() + (POWER(2, retry_count) || ' minutes')::INTERVAL,
      error_message = error_message_param
    WHERE id = message_id_param;
  ELSE
    -- Marcar como fallido permanentemente
    UPDATE message_queue
    SET 
      status = 'failed',
      completed_at = NOW(),
      error_message = error_message_param
    WHERE id = message_id_param;
    
    -- Actualizar recipient
    UPDATE campaign_recipients
    SET 
      status = 'failed',
      failed_at = NOW(),
      error_message = error_message_param
    WHERE id = (SELECT recipient_id FROM message_queue WHERE id = message_id_param);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar timestamps
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own campaigns"
  ON campaigns FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own campaign recipients"
  ON campaign_recipients FOR ALL
  USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own message queue"
  ON message_queue FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own templates"
  ON message_templates FOR ALL
  USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE campaigns IS 'Campañas de envío masivo de mensajes';
COMMENT ON TABLE campaign_recipients IS 'Destinatarios de cada campaña';
COMMENT ON TABLE message_queue IS 'Cola de mensajes para procesar con rate limiting';
COMMENT ON TABLE processing_batches IS 'Lotes de procesamiento para seguimiento';
COMMENT ON TABLE message_templates IS 'Plantillas reutilizables de mensajes';

