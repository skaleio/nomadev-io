-- ============================================
-- NOMADEV - ESQUEMA COMPLETO DE BASE DE DATOS
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- ============================================
-- TABLA: agents (Agentes de IA)
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'chatbot', -- chatbot, automation, analytics, integration, custom
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, paused, error
  
  -- Configuración del agente
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Configuración de IA
  ai_model VARCHAR(100) DEFAULT 'gpt-4-turbo-preview', -- gpt-4-turbo-preview, gpt-3.5-turbo, claude-3, etc
  ai_temperature DECIMAL(3,2) DEFAULT 0.7,
  ai_max_tokens INTEGER DEFAULT 2000,
  ai_system_prompt TEXT,
  ai_context TEXT, -- Contexto adicional para el agente
  
  -- Configuración de personalidad
  personality JSONB DEFAULT '{
    "tone": "professional",
    "language": "es",
    "style": "friendly"
  }'::jsonb,
  
  -- Integraciones
  whatsapp_phone_id VARCHAR(255),
  whatsapp_business_account_id VARCHAR(255),
  whatsapp_access_token TEXT,
  whatsapp_webhook_verify_token VARCHAR(255),
  
  -- Configuración de CRM
  crm_enabled BOOLEAN DEFAULT false,
  crm_config JSONB DEFAULT '{}'::jsonb,
  
  -- Workflows asociados
  workflow_id UUID,
  
  -- Métricas
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_response_time INTEGER DEFAULT 0, -- en milisegundos
  
  -- Tags y categorización
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Índices para agents
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_tags ON agents USING GIN(tags);
CREATE INDEX idx_agents_created_at ON agents(created_at DESC);

-- ============================================
-- TABLA: conversations (Conversaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información del contacto
  contact_phone VARCHAR(50),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  
  -- WhatsApp específico
  whatsapp_conversation_id VARCHAR(255) UNIQUE,
  
  -- Estado de la conversación
  status VARCHAR(50) DEFAULT 'active', -- active, closed, archived, waiting
  
  -- Contexto de la conversación
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Información del lead
  lead_id UUID,
  lead_stage VARCHAR(50), -- new, contacted, qualified, proposal, negotiation, won, lost
  lead_score INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
  
);

-- Índices para conversations
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_whatsapp_id ON conversations(whatsapp_conversation_id);
CREATE INDEX idx_conversations_lead_stage ON conversations(lead_stage);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- ============================================
-- TABLA: messages (Mensajes)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Contenido del mensaje
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, audio, video, document, location
  
  -- Dirección del mensaje
  direction VARCHAR(20) NOT NULL, -- inbound (del cliente), outbound (del agente)
  
  -- WhatsApp específico
  whatsapp_message_id VARCHAR(255) UNIQUE,
  whatsapp_status VARCHAR(50), -- sent, delivered, read, failed
  
  -- Información del remitente
  sender_phone VARCHAR(50),
  sender_name VARCHAR(255),
  
  -- Metadata del mensaje
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- IA - Si fue generado por IA
  ai_generated BOOLEAN DEFAULT false,
  ai_model VARCHAR(100),
  ai_tokens_used INTEGER,
  ai_confidence DECIMAL(5,2),
  
  -- Adjuntos
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
  
);

-- Índices para messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_agent_id ON messages(agent_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_whatsapp_id ON messages(whatsapp_message_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- TABLA: workflows (Flujos de trabajo)
-- ============================================
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Configuración del workflow
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  connections JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Estado
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, archived
  
  -- Trigger
  trigger_type VARCHAR(100), -- webhook, schedule, event, manual
  trigger_config JSONB DEFAULT '{}'::jsonb,
  
  -- Ejecuciones
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_executed_at TIMESTAMPTZ
  
);

-- Índices para workflows
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);

-- ============================================
-- TABLA: workflow_executions (Ejecuciones de workflows)
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  
  -- Estado de la ejecución
  status VARCHAR(50) DEFAULT 'running', -- running, completed, failed, cancelled
  
  -- Datos de entrada y salida
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  
  -- Logs de ejecución
  logs JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  
  -- Métricas
  duration_ms INTEGER,
  nodes_executed INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
  
);

-- Índices para workflow_executions
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at DESC);

-- ============================================
-- TABLA: leads (Clientes potenciales)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- Información del lead
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(255),
  
  -- Estado del lead
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, proposal, negotiation, won, lost
  score INTEGER DEFAULT 0, -- 0-100
  
  -- Información comercial
  estimated_value DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'USD',
  probability INTEGER DEFAULT 0, -- 0-100
  
  -- Fuente del lead
  source VARCHAR(100), -- whatsapp, website, referral, campaign, etc
  campaign VARCHAR(255),
  
  -- Notas y contexto
  notes TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Tags
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Asignación
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
  
);

-- Índices para leads
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_agent_id ON leads(agent_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- ============================================
-- TABLA: lead_activities (Actividades de leads)
-- ============================================
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de actividad
  activity_type VARCHAR(100) NOT NULL, -- call, email, meeting, note, status_change, etc
  
  -- Contenido
  title VARCHAR(255),
  description TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
  
);

-- Índices para lead_activities
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- ============================================
-- TABLA: ai_training_data (Datos de entrenamiento)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Datos de entrenamiento
  input_text TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  
  -- Contexto
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  category VARCHAR(100),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  
);

-- Índices para ai_training_data
CREATE INDEX idx_ai_training_data_agent_id ON ai_training_data(agent_id);
CREATE INDEX idx_ai_training_data_category ON ai_training_data(category);
CREATE INDEX idx_ai_training_data_tags ON ai_training_data USING GIN(tags);

-- ============================================
-- TABLA: analytics_events (Eventos de analítica)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Tipo de evento
  event_type VARCHAR(100) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  
  -- Datos del evento
  properties JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
  
);

-- Índices para analytics_events
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_agent_id ON analytics_events(agent_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- ============================================
-- TABLA: integrations (Integraciones)
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de integración
  integration_type VARCHAR(100) NOT NULL, -- whatsapp, shopify, zapier, hubspot, etc
  
  -- Nombre y descripción
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Configuración
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  credentials JSONB DEFAULT '{}'::jsonb, -- Encriptado
  
  -- Estado
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, error
  is_connected BOOLEAN DEFAULT false,
  
  -- Metadata
  last_sync_at TIMESTAMPTZ,
  sync_frequency VARCHAR(50), -- realtime, hourly, daily, manual
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  
);

-- Índices para integrations
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_type ON integrations(integration_type);
CREATE INDEX idx_integrations_status ON integrations(status);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar métricas del agente
CREATE OR REPLACE FUNCTION update_agent_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Actualizar total de mensajes
    UPDATE agents 
    SET total_messages = total_messages + 1,
        last_active_at = NOW()
    WHERE id = NEW.agent_id;
    
    -- Actualizar total de conversaciones si es el primer mensaje
    IF (SELECT COUNT(*) FROM messages WHERE conversation_id = NEW.conversation_id) = 1 THEN
      UPDATE agents 
      SET total_conversations = total_conversations + 1
      WHERE id = NEW.agent_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar métricas
CREATE TRIGGER update_agent_metrics_trigger
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_agent_metrics();

-- Función para actualizar last_message_at en conversaciones
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar last_message_at
CREATE TRIGGER update_conversation_last_message_trigger
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Políticas para agents
CREATE POLICY "Users can view their own agents" ON agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents" ON agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents" ON agents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents" ON agents
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para messages
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Políticas para workflows
CREATE POLICY "Users can view their own workflows" ON workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflows" ON workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows" ON workflows
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows" ON workflows
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para leads
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para integrations
CREATE POLICY "Users can view their own integrations" ON integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations" ON integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" ON integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" ON integrations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de agentes con estadísticas
CREATE OR REPLACE VIEW agents_with_stats AS
SELECT 
  a.*,
  COUNT(DISTINCT c.id) as active_conversations,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'won' THEN l.id END) as converted_leads
FROM agents a
LEFT JOIN conversations c ON a.id = c.agent_id AND c.status = 'active'
LEFT JOIN leads l ON a.id = l.agent_id
GROUP BY a.id;

-- Vista de conversaciones con último mensaje
CREATE OR REPLACE VIEW conversations_with_last_message AS
SELECT 
  c.*,
  m.content as last_message_content,
  m.created_at as last_message_time,
  m.direction as last_message_direction
FROM conversations c
LEFT JOIN LATERAL (
  SELECT * FROM messages 
  WHERE conversation_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) m ON true;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE agents IS 'Agentes de IA configurables para diferentes propósitos';
COMMENT ON TABLE conversations IS 'Conversaciones entre agentes y contactos';
COMMENT ON TABLE messages IS 'Mensajes individuales dentro de conversaciones';
COMMENT ON TABLE workflows IS 'Flujos de trabajo automatizados';
COMMENT ON TABLE leads IS 'Clientes potenciales y su información';
COMMENT ON TABLE integrations IS 'Integraciones con servicios externos';

