/**
 * Servicio de Gestión de Conversaciones y Mensajes
 * Maneja toda la lógica de conversaciones, mensajes y chat
 */

import { supabase } from '@/integrations/supabase/client';
import { aiService, ConversationContext } from './ai-service';
import { Agent, agentService } from './agent-service';

export interface Conversation {
  id: string;
  agent_id: string;
  user_id: string;
  contact_phone?: string;
  contact_name?: string;
  contact_email?: string;
  whatsapp_conversation_id?: string;
  status: 'active' | 'closed' | 'archived' | 'waiting';
  context: Record<string, any>;
  lead_id?: string;
  lead_stage?: string;
  lead_score: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  closed_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  agent_id: string;
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location';
  direction: 'inbound' | 'outbound';
  whatsapp_message_id?: string;
  whatsapp_status?: 'sent' | 'delivered' | 'read' | 'failed';
  sender_phone?: string;
  sender_name?: string;
  metadata: Record<string, any>;
  ai_generated: boolean;
  ai_model?: string;
  ai_tokens_used?: number;
  ai_confidence?: number;
  attachments: any[];
  created_at: string;
  delivered_at?: string;
  read_at?: string;
}

export interface CreateConversationInput {
  agent_id: string;
  contact_phone?: string;
  contact_name?: string;
  contact_email?: string;
  whatsapp_conversation_id?: string;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateMessageInput {
  conversation_id: string;
  content: string;
  message_type?: Message['message_type'];
  direction: 'inbound' | 'outbound';
  sender_phone?: string;
  sender_name?: string;
  whatsapp_message_id?: string;
  metadata?: Record<string, any>;
  attachments?: any[];
}

class ConversationService {
  /**
   * Obtener conversaciones del agente
   */
  async getConversations(agentId: string, status?: Conversation['status']): Promise<Conversation[]> {
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('agent_id', agentId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      throw new Error('Error al obtener conversaciones');
    }

    return data as Conversation[];
  }

  /**
   * Obtener una conversación específica
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching conversation:', error);
      throw new Error('Error al obtener conversación');
    }

    return data as Conversation;
  }

  /**
   * Crear una nueva conversación
   */
  async createConversation(userId: string, input: CreateConversationInput): Promise<Conversation> {
    const conversationData = {
      user_id: userId,
      agent_id: input.agent_id,
      contact_phone: input.contact_phone,
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      whatsapp_conversation_id: input.whatsapp_conversation_id,
      status: 'active' as const,
      context: input.context || {},
      metadata: input.metadata || {},
      lead_score: 0
    };

    const { data, error } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Error al crear conversación');
    }

    return data as Conversation;
  }

  /**
   * Obtener o crear conversación por WhatsApp ID
   */
  async getOrCreateConversationByWhatsApp(
    userId: string,
    agentId: string,
    whatsappConversationId: string,
    contactPhone: string,
    contactName?: string
  ): Promise<Conversation> {
    // Buscar conversación existente
    const { data: existing, error: searchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('whatsapp_conversation_id', whatsappConversationId)
      .single();

    if (existing && !searchError) {
      return existing as Conversation;
    }

    // Crear nueva conversación
    return this.createConversation(userId, {
      agent_id: agentId,
      whatsapp_conversation_id: whatsappConversationId,
      contact_phone: contactPhone,
      contact_name: contactName
    });
  }

  /**
   * Actualizar conversación
   */
  async updateConversation(
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      throw new Error('Error al actualizar conversación');
    }

    return data as Conversation;
  }

  /**
   * Cerrar conversación
   */
  async closeConversation(conversationId: string): Promise<Conversation> {
    return this.updateConversation(conversationId, {
      status: 'closed',
      closed_at: new Date().toISOString()
    });
  }

  /**
   * Archivar conversación
   */
  async archiveConversation(conversationId: string): Promise<Conversation> {
    return this.updateConversation(conversationId, {
      status: 'archived'
    });
  }

  /**
   * Obtener mensajes de una conversación
   */
  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Error al obtener mensajes');
    }

    return data as Message[];
  }

  /**
   * Crear un mensaje
   */
  async createMessage(agentId: string, input: CreateMessageInput): Promise<Message> {
    const messageData = {
      conversation_id: input.conversation_id,
      agent_id: agentId,
      content: input.content,
      message_type: input.message_type || 'text',
      direction: input.direction,
      sender_phone: input.sender_phone,
      sender_name: input.sender_name,
      whatsapp_message_id: input.whatsapp_message_id,
      metadata: input.metadata || {},
      ai_generated: false,
      attachments: input.attachments || []
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      throw new Error('Error al crear mensaje');
    }

    return data as Message;
  }

  /**
   * Procesar mensaje entrante y generar respuesta con IA
   */
  async processIncomingMessage(
    conversationId: string,
    messageContent: string,
    senderInfo: { phone?: string; name?: string }
  ): Promise<{ incomingMessage: Message; aiResponse?: Message }> {
    // Obtener conversación
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversación no encontrada');
    }

    // Obtener agente
    const agent = await agentService.getAgent(conversation.agent_id);
    if (!agent) {
      throw new Error('Agente no encontrado');
    }

    // Crear mensaje entrante
    const incomingMessage = await this.createMessage(agent.id, {
      conversation_id: conversationId,
      content: messageContent,
      direction: 'inbound',
      sender_phone: senderInfo.phone,
      sender_name: senderInfo.name
    });

    // Si el agente está activo, generar respuesta automática
    if (agent.status === 'active') {
      try {
        // Obtener historial de mensajes
        const previousMessages = await this.getMessages(conversationId, 10);
        
        // Construir contexto
        const context: ConversationContext = {
          conversationId: conversationId,
          contactName: conversation.contact_name,
          contactPhone: conversation.contact_phone,
          previousMessages: previousMessages.map(m => ({
            role: m.direction === 'inbound' ? 'user' : 'assistant',
            content: m.content,
            timestamp: m.created_at
          })),
          customContext: conversation.context
        };

        // Generar respuesta con IA
        const aiResponse = await aiService.generateResponse(agent, messageContent, context);

        // Crear mensaje de respuesta
        const responseMessage = await this.createMessage(agent.id, {
          conversation_id: conversationId,
          content: aiResponse.content,
          direction: 'outbound',
          metadata: {
            ai_generated: true,
            ai_model: aiResponse.model,
            ai_tokens_used: aiResponse.tokens_used,
            ai_confidence: aiResponse.confidence
          }
        });

        // Actualizar el mensaje con los datos de IA
        const { data: updatedMessage } = await supabase
          .from('messages')
          .update({
            ai_generated: true,
            ai_model: aiResponse.model,
            ai_tokens_used: aiResponse.tokens_used,
            ai_confidence: aiResponse.confidence
          })
          .eq('id', responseMessage.id)
          .select()
          .single();

        return {
          incomingMessage,
          aiResponse: updatedMessage as Message
        };
      } catch (error) {
        console.error('Error generating AI response:', error);
        // Retornar solo el mensaje entrante si falla la IA
        return { incomingMessage };
      }
    }

    return { incomingMessage };
  }

  /**
   * Enviar mensaje manual (no generado por IA)
   */
  async sendManualMessage(
    conversationId: string,
    agentId: string,
    content: string
  ): Promise<Message> {
    return this.createMessage(agentId, {
      conversation_id: conversationId,
      content: content,
      direction: 'outbound'
    });
  }

  /**
   * Marcar mensaje como leído
   */
  async markMessageAsRead(messageId: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update({
        read_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Error al marcar mensaje como leído');
    }

    return data as Message;
  }

  /**
   * Actualizar estado de mensaje de WhatsApp
   */
  async updateWhatsAppMessageStatus(
    whatsappMessageId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed'
  ): Promise<void> {
    const updates: any = {
      whatsapp_status: status
    };

    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    } else if (status === 'read') {
      updates.read_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('messages')
      .update(updates)
      .eq('whatsapp_message_id', whatsappMessageId);

    if (error) {
      console.error('Error updating WhatsApp message status:', error);
    }
  }

  /**
   * Buscar conversaciones
   */
  async searchConversations(
    userId: string,
    query: string
  ): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .or(`contact_name.ilike.%${query}%,contact_phone.ilike.%${query}%,contact_email.ilike.%${query}%`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error searching conversations:', error);
      throw new Error('Error al buscar conversaciones');
    }

    return data as Conversation[];
  }

  /**
   * Obtener estadísticas de conversaciones
   */
  async getConversationStats(agentId: string): Promise<{
    total: number;
    active: number;
    closed: number;
    avgMessagesPerConversation: number;
    avgResponseTime: number;
  }> {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('agent_id', agentId);

    if (error) {
      console.error('Error fetching conversation stats:', error);
      throw new Error('Error al obtener estadísticas');
    }

    const total = conversations?.length || 0;
    const active = conversations?.filter(c => c.status === 'active').length || 0;
    const closed = conversations?.filter(c => c.status === 'closed').length || 0;

    // Calcular promedio de mensajes por conversación
    const { data: messageCount } = await supabase
      .from('messages')
      .select('conversation_id')
      .eq('agent_id', agentId);

    const avgMessagesPerConversation = total > 0 
      ? Math.round((messageCount?.length || 0) / total) 
      : 0;

    return {
      total,
      active,
      closed,
      avgMessagesPerConversation,
      avgResponseTime: 0 // TODO: Calcular tiempo de respuesta real
    };
  }

  /**
   * Obtener conversaciones recientes
   */
  async getRecentConversations(userId: string, limit: number = 10): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent conversations:', error);
      throw new Error('Error al obtener conversaciones recientes');
    }

    return data as Conversation[];
  }
}

export const conversationService = new ConversationService();

