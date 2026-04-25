/**
 * API Client para conectar con Supabase
 * Configuración centralizada para todas las llamadas a la API
 */

import { supabase } from '../integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';

// Tipos para las respuestas de la API
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Clase para manejar errores de API
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Función para hacer requests a Edge Functions
const edgeFunctionRequest = async <T>(
  functionName: string,
  body?: any
): Promise<T> => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body
    });

    if (error) {
      throw new ApiError(error.message, 500, error);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Error de conexión', 0, error);
  }
};

// API de Autenticación (ahora manejada por Supabase Auth en el contexto)
export const authApi = {
  // Estas funciones ahora están en AuthContext
  // Solo mantenemos la interfaz para compatibilidad
};

// API de WhatsApp
export const whatsappApi = {
  // Enviar mensaje de texto
  sendTextMessage: async (messageData: {
    phoneNumber: string;
    message: string;
    orderId?: string;
    shopId?: string;
  }) => {
    return edgeFunctionRequest('whatsapp-send', messageData);
  },

  // Enviar mensaje con media
  sendMediaMessage: async (messageData: {
    phoneNumber: string;
    mediaUrl: string;
    mediaType: 'image' | 'document' | 'audio' | 'video';
    caption?: string;
    orderId?: string;
    shopId?: string;
  }) => {
    // Por ahora solo soportamos texto, se puede extender
    return edgeFunctionRequest('whatsapp-send', {
      phoneNumber: messageData.phoneNumber,
      message: messageData.caption || `[${messageData.mediaType.toUpperCase()}]`,
      orderId: messageData.orderId,
      shopId: messageData.shopId
    });
  },

  // Obtener conversaciones
  getConversations: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<Tables<'conversations'>[]> => {
    let query = supabase
      .from('conversations')
      .select('*')
      .order('last_message', { ascending: false, nullsFirst: false });

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) throw new ApiError(error.message, 500, error);
    return data || [];
  },

  // Obtener conversación específica
  getConversation: async (conversationId: string): Promise<Tables<'conversations'>> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw new ApiError(error.message, 500, error);
    return data;
  },

  // Obtener mensajes de una conversación
  getConversationMessages: async (conversationId: string, limit = 50): Promise<Tables<'messages'>[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new ApiError(error.message, 500, error);
    return data || [];
  },

  // Crear conversación
  createConversation: async (conversationData: {
    shopId: string;
    phoneNumber: string;
    orderId?: string;
  }): Promise<Tables<'conversations'>> => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        shop_id: conversationData.shopId,
        phone_number: conversationData.phoneNumber,
        order_id: conversationData.orderId,
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (error) throw new ApiError(error.message, 500, error);
    return data;
  },

  // Archivar conversación
  archiveConversation: async (conversationId: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'ARCHIVED' })
      .eq('id', conversationId);

    if (error) throw new ApiError(error.message, 500, error);
    return { success: true };
  },

  // Obtener estado de conversación
  getConversationStatus: async (phoneNumber: string): Promise<Tables<'conversations'> | null> => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('status', 'ACTIVE')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new ApiError(error.message, 500, error);
    }
    return data;
  },

  // Obtener estado del servicio
  getStatus: async () => {
    return { 
      connected: false, 
      service: 'WhatsApp (API Meta próximamente)',
      status: 'pending'
    };
  },
};

// API de Webhooks
export const webhookApi = {
  // Obtener logs de webhooks
  getWebhookLogs: async (params?: {
    page?: number;
    limit?: number;
    source?: string;
    event?: string;
    status?: string;
  }): Promise<Tables<'webhook_logs'>[]> => {
    let query = supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.source) {
      query = query.eq('source', params.source);
    }
    if (params?.event) {
      query = query.eq('event', params.event);
    }
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) throw new ApiError(error.message, 500, error);
    return data || [];
  },
};

export { ApiError };
export type { ApiResponse };
