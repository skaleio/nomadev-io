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

// API de Shopify
export const shopifyApi = {
  // Obtener tiendas conectadas
  getShops: async (): Promise<Tables<'shops'>[]> => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .order('connected_at', { ascending: false });

    if (error) throw new ApiError(error.message, 500, error);
    return data || [];
  },

  // Obtener detalles de una tienda
  getShop: async (shopId: string): Promise<Tables<'shops'>> => {
    const { data, error } = await supabase
      .from('shops')
      .select(`
        *,
        orders(count),
        products(count),
        customers(count)
      `)
      .eq('id', shopId)
      .single();

    if (error) throw new ApiError(error.message, 500, error);
    return data;
  },

  // Conectar nueva tienda
  connectShop: async (connectionData: {
    code: string;
    shop: string;
    state: string;
  }) => {
    return edgeFunctionRequest('shopify-connect', connectionData);
  },

  // Probar conexión de tienda
  testConnection: async (shopId: string) => {
    // Implementar lógica de prueba de conexión
    return { connected: true };
  },

  // Desconectar tienda
  disconnectShop: async (shopId: string) => {
    const { error } = await supabase
      .from('shops')
      .update({ is_active: false })
      .eq('id', shopId);

    if (error) throw new ApiError(error.message, 500, error);
    return { success: true };
  },

  // Obtener pedidos
  getOrders: async (shopId: string, params?: {
    limit?: number;
    sinceId?: string;
  }): Promise<Tables<'orders'>[]> => {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) throw new ApiError(error.message, 500, error);
    return data || [];
  },

  // Obtener pedido específico
  getOrder: async (shopId: string, orderId: string): Promise<Tables<'orders'>> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('shop_id', shopId)
      .single();

    if (error) throw new ApiError(error.message, 500, error);
    return data;
  },

  // Obtener productos
  getProducts: async (shopId: string, limit = 50): Promise<Tables<'products'>[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(error.message, 500, error);
    return data || [];
  },

  // Obtener clientes
  getCustomers: async (shopId: string, limit = 50): Promise<Tables<'customers'>[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shopId)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(error.message, 500, error);
    return data || [];
  },

  // Obtener analytics
  getAnalytics: async (shopId: string) => {
    const { data: ordersByStatus, error: statusError } = await supabase
      .from('orders')
      .select('status')
      .eq('shop_id', shopId);

    if (statusError) throw new ApiError(statusError.message, 500, statusError);

    const { count: totalOrders, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);

    if (countError) throw new ApiError(countError.message, 500, countError);

    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total_price')
      .eq('shop_id', shopId);

    if (revenueError) throw new ApiError(revenueError.message, 500, revenueError);

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_price, 0) || 0;

    // Agrupar por estado
    const ordersByStatusGrouped = ordersByStatus?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      totalOrders: totalOrders || 0,
      totalRevenue,
      ordersByStatus: Object.entries(ordersByStatusGrouped).map(([status, count]) => ({
        status,
        count
      }))
    };
  },
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
    // Verificar si hay configuración de Evolution API
    return { 
      connected: true, 
      service: 'Evolution API',
      status: 'active'
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
