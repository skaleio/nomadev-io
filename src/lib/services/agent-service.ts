/**
 * Servicio de Gestión de Agentes de IA
 * Maneja toda la lógica de creación, actualización y gestión de agentes
 */

import { supabase } from '@/integrations/supabase/client';

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'chatbot' | 'automation' | 'analytics' | 'integration' | 'custom';
  status: 'draft' | 'active' | 'paused' | 'error';
  config: Record<string, any>;
  
  // Configuración de IA
  ai_model: string;
  ai_temperature: number;
  ai_max_tokens: number;
  ai_system_prompt?: string;
  ai_context?: string;
  
  // Personalidad
  personality: {
    tone: string;
    language: string;
    style: string;
  };
  
  // Integraciones WhatsApp
  whatsapp_phone_id?: string;
  whatsapp_business_account_id?: string;
  whatsapp_access_token?: string;
  whatsapp_webhook_verify_token?: string;
  
  // CRM
  crm_enabled: boolean;
  crm_config: Record<string, any>;
  
  // Workflow
  workflow_id?: string;
  
  // Métricas
  total_conversations: number;
  total_messages: number;
  success_rate: number;
  avg_response_time: number;
  
  // Tags
  tags: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_active_at?: string;
}

export interface CreateAgentInput {
  name: string;
  description?: string;
  type: Agent['type'];
  ai_model?: string;
  ai_temperature?: number;
  ai_max_tokens?: number;
  ai_system_prompt?: string;
  ai_context?: string;
  personality?: Agent['personality'];
  tags?: string[];
  config?: Record<string, any>;
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  status?: Agent['status'];
  whatsapp_phone_id?: string;
  whatsapp_business_account_id?: string;
  whatsapp_access_token?: string;
  crm_enabled?: boolean;
  crm_config?: Record<string, any>;
  workflow_id?: string;
}

class AgentService {
  /**
   * Obtener todos los agentes del usuario
   */
  async getAgents(userId: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      throw new Error('Error al obtener los agentes');
    }

    return data as Agent[];
  }

  /**
   * Obtener un agente específico
   */
  async getAgent(agentId: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching agent:', error);
      throw new Error('Error al obtener el agente');
    }

    return data as Agent;
  }

  /**
   * Crear un nuevo agente
   */
  async createAgent(userId: string, input: CreateAgentInput): Promise<Agent> {
    const agentData = {
      user_id: userId,
      name: input.name,
      description: input.description,
      type: input.type,
      status: 'draft' as const,
      config: input.config || {},
      ai_model: input.ai_model || 'gpt-4-turbo-preview',
      ai_temperature: input.ai_temperature ?? 0.7,
      ai_max_tokens: input.ai_max_tokens ?? 2000,
      ai_system_prompt: input.ai_system_prompt,
      ai_context: input.ai_context,
      personality: input.personality || {
        tone: 'professional',
        language: 'es',
        style: 'friendly'
      },
      tags: input.tags || [],
      crm_enabled: false,
      crm_config: {},
      total_conversations: 0,
      total_messages: 0,
      success_rate: 0,
      avg_response_time: 0
    };

    const { data, error } = await supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      throw new Error('Error al crear el agente');
    }

    return data as Agent;
  }

  /**
   * Actualizar un agente
   */
  async updateAgent(agentId: string, input: UpdateAgentInput): Promise<Agent> {
    const updateData: any = {};

    // Solo incluir campos que fueron proporcionados
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.ai_model !== undefined) updateData.ai_model = input.ai_model;
    if (input.ai_temperature !== undefined) updateData.ai_temperature = input.ai_temperature;
    if (input.ai_max_tokens !== undefined) updateData.ai_max_tokens = input.ai_max_tokens;
    if (input.ai_system_prompt !== undefined) updateData.ai_system_prompt = input.ai_system_prompt;
    if (input.ai_context !== undefined) updateData.ai_context = input.ai_context;
    if (input.personality !== undefined) updateData.personality = input.personality;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.config !== undefined) updateData.config = input.config;
    if (input.whatsapp_phone_id !== undefined) updateData.whatsapp_phone_id = input.whatsapp_phone_id;
    if (input.whatsapp_business_account_id !== undefined) updateData.whatsapp_business_account_id = input.whatsapp_business_account_id;
    if (input.whatsapp_access_token !== undefined) updateData.whatsapp_access_token = input.whatsapp_access_token;
    if (input.crm_enabled !== undefined) updateData.crm_enabled = input.crm_enabled;
    if (input.crm_config !== undefined) updateData.crm_config = input.crm_config;
    if (input.workflow_id !== undefined) updateData.workflow_id = input.workflow_id;

    const { data, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent:', error);
      throw new Error('Error al actualizar el agente');
    }

    return data as Agent;
  }

  /**
   * Eliminar un agente
   */
  async deleteAgent(agentId: string): Promise<void> {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (error) {
      console.error('Error deleting agent:', error);
      throw new Error('Error al eliminar el agente');
    }
  }

  /**
   * Activar un agente
   */
  async activateAgent(agentId: string): Promise<Agent> {
    return this.updateAgent(agentId, { status: 'active' });
  }

  /**
   * Pausar un agente
   */
  async pauseAgent(agentId: string): Promise<Agent> {
    return this.updateAgent(agentId, { status: 'paused' });
  }

  /**
   * Duplicar un agente
   */
  async duplicateAgent(agentId: string, userId: string): Promise<Agent> {
    const originalAgent = await this.getAgent(agentId);
    
    if (!originalAgent) {
      throw new Error('Agente no encontrado');
    }

    const duplicatedAgent: CreateAgentInput = {
      name: `${originalAgent.name} (Copia)`,
      description: originalAgent.description,
      type: originalAgent.type,
      ai_model: originalAgent.ai_model,
      ai_temperature: originalAgent.ai_temperature,
      ai_max_tokens: originalAgent.ai_max_tokens,
      ai_system_prompt: originalAgent.ai_system_prompt,
      ai_context: originalAgent.ai_context,
      personality: originalAgent.personality,
      tags: originalAgent.tags,
      config: originalAgent.config
    };

    return this.createAgent(userId, duplicatedAgent);
  }

  /**
   * Obtener estadísticas del agente
   */
  async getAgentStats(agentId: string): Promise<{
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    totalLeads: number;
    convertedLeads: number;
    avgResponseTime: number;
    successRate: number;
  }> {
    // Obtener conversaciones totales y activas
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('agent_id', agentId);

    if (convError) {
      console.error('Error fetching conversations:', convError);
      throw new Error('Error al obtener estadísticas');
    }

    const totalConversations = conversations?.length || 0;
    const activeConversations = conversations?.filter(c => c.status === 'active').length || 0;

    // Obtener total de mensajes
    const { count: totalMessages, error: msgError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId);

    if (msgError) {
      console.error('Error fetching messages count:', msgError);
    }

    // Obtener leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status')
      .eq('agent_id', agentId);

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
    }

    const totalLeads = leads?.length || 0;
    const convertedLeads = leads?.filter(l => l.status === 'won').length || 0;

    // Obtener datos del agente para métricas
    const agent = await this.getAgent(agentId);

    return {
      totalConversations,
      activeConversations,
      totalMessages: totalMessages || 0,
      totalLeads,
      convertedLeads,
      avgResponseTime: agent?.avg_response_time || 0,
      successRate: agent?.success_rate || 0
    };
  }

  /**
   * Conectar WhatsApp al agente
   */
  async connectWhatsApp(
    agentId: string,
    config: {
      phone_id: string;
      business_account_id: string;
      access_token: string;
      webhook_verify_token?: string;
    }
  ): Promise<Agent> {
    return this.updateAgent(agentId, {
      whatsapp_phone_id: config.phone_id,
      whatsapp_business_account_id: config.business_account_id,
      whatsapp_access_token: config.access_token,
      whatsapp_webhook_verify_token: config.webhook_verify_token || this.generateWebhookToken()
    });
  }

  /**
   * Generar token de verificación de webhook
   */
  private generateWebhookToken(): string {
    return `whatsapp_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Obtener agentes por tipo
   */
  async getAgentsByType(userId: string, type: Agent['type']): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents by type:', error);
      throw new Error('Error al obtener los agentes');
    }

    return data as Agent[];
  }

  /**
   * Buscar agentes
   */
  async searchAgents(userId: string, query: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching agents:', error);
      throw new Error('Error al buscar agentes');
    }

    return data as Agent[];
  }
}

export const agentService = new AgentService();

