import { useState, useEffect, useCallback } from 'react';
import { evolutionAPI, EvolutionMessage, EvolutionContact } from '@/lib/evolution-api';
import { n8nWebhook, ChatUpdateData } from '@/lib/n8n-webhook';

export interface ChatConversation {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;
  unread: number;
  status: 'hot' | 'warm' | 'cold' | 'new';
  avatar: string;
  messages: ChatMessage[];
  isOnline: boolean;
  leadScore?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'customer' | 'agent';
  time: string;
  timestamp: number;
  messageType: string;
}

export interface ChatMetrics {
  activeChats: number;
  averageResponseTime: number;
  pendingChats: number;
  resolvedToday: number;
}

export const useEvolutionChat = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);
  const [metrics, setMetrics] = useState<ChatMetrics>({
    activeChats: 0,
    averageResponseTime: 0,
    pendingChats: 0,
    resolvedToday: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar conexión con Evolution API
  const checkConnection = useCallback(async () => {
    try {
      const connected = await evolutionAPI.checkConnection();
      setIsConnected(connected);
      return connected;
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  // Cargar conversaciones desde Evolution API
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const contacts = await evolutionAPI.getContacts();
      const conversationsData: ChatConversation[] = [];

      for (const contact of contacts) {
        if (!contact.isGroup && contact.isWAContact) {
          const messages = await evolutionAPI.getMessages(contact.id, 10);
          const lastMessage = messages[messages.length - 1];
          
          if (lastMessage) {
            const conversation: ChatConversation = {
              id: contact.id,
              name: contact.pushName || contact.name || 'Usuario',
              phone: contact.id.replace('@s.whatsapp.net', ''),
              lastMessage: lastMessage.message.conversation || 
                          lastMessage.message.extendedTextMessage?.text || 
                          'Mensaje multimedia',
              time: formatTime(lastMessage.messageTimestamp),
              unread: Math.floor(Math.random() * 5), // Simular mensajes no leídos
              status: getLeadStatus(contact.id),
              avatar: contact.name?.substring(0, 2).toUpperCase() || 'U',
              messages: messages.map(msg => ({
                id: msg.key.id,
                text: msg.message.conversation || 
                      msg.message.extendedTextMessage?.text || 
                      'Mensaje multimedia',
                sender: msg.key.fromMe ? 'agent' : 'customer',
                time: formatTime(msg.messageTimestamp),
                timestamp: msg.messageTimestamp,
                messageType: msg.messageType
              })),
              isOnline: Math.random() > 0.5, // Simular estado online
              leadScore: Math.floor(Math.random() * 40) + 60 // Score entre 60-100
            };

            conversationsData.push(conversation);
          }
        }
      }

      setConversations(conversationsData);
      updateMetrics(conversationsData);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Error al cargar las conversaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar mensaje
  const sendMessage = useCallback(async (chatId: string, text: string) => {
    try {
      const phone = chatId.replace('@s.whatsapp.net', '');
      const result = await evolutionAPI.sendMessage({
        number: phone,
        text,
        options: {
          delay: 1000
        }
      });

      if (result.success) {
        // Actualizar la conversación local
        setConversations(prev => prev.map(conv => {
          if (conv.id === chatId) {
            const newMessage: ChatMessage = {
              id: result.key.id,
              text,
              sender: 'agent',
              time: formatTime(Date.now()),
              timestamp: Date.now(),
              messageType: 'conversation'
            };

            return {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: text,
              time: 'ahora'
            };
          }
          return conv;
        }));

        // Enviar actualización a N8N
        const chatUpdate: ChatUpdateData = {
          chatId,
          contactName: selectedChat?.name || 'Usuario',
          contactPhone: phone,
          lastMessage: text,
          messageCount: (selectedChat?.messages.length || 0) + 1,
          status: 'active',
          leadScore: selectedChat?.leadScore,
          isHot: selectedChat?.status === 'hot'
        };

        await n8nWebhook.sendChatUpdate(chatUpdate);
      }

      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [selectedChat]);

  // Actualizar métricas
  const updateMetrics = useCallback((conversations: ChatConversation[]) => {
    const activeChats = conversations.filter(c => c.status === 'hot' || c.status === 'warm').length;
    const pendingChats = conversations.filter(c => c.unread > 0).length;
    const resolvedToday = Math.floor(Math.random() * 50) + 100; // Simular resueltos hoy
    const averageResponseTime = 2.8; // Tiempo promedio en minutos

    setMetrics({
      activeChats,
      averageResponseTime,
      pendingChats,
      resolvedToday
    });
  }, []);

  // Formatear tiempo
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes} min`;
    if (hours < 24) return `hace ${hours} h`;
    return `hace ${days} días`;
  };

  // Obtener estado del lead basado en el ID
  const getLeadStatus = (chatId: string): 'hot' | 'warm' | 'cold' | 'new' => {
    const hash = chatId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const statuses: ('hot' | 'warm' | 'cold' | 'new')[] = ['hot', 'warm', 'cold', 'new'];
    return statuses[Math.abs(hash) % statuses.length];
  };

  // Configurar webhook
  const setupWebhook = useCallback(async () => {
    try {
      const webhookUrl = `${window.location.origin}/api/webhook/evolution`;
      await evolutionAPI.setWebhook(webhookUrl);
      console.log('Webhook configured successfully');
    } catch (error) {
      console.error('Error setting up webhook:', error);
    }
  }, []);

  // Efectos
  useEffect(() => {
    checkConnection();
    loadConversations();
    setupWebhook();

    // Polling para actualizar conversaciones cada 30 segundos
    const interval = setInterval(() => {
      if (isConnected) {
        loadConversations();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [checkConnection, loadConversations, setupWebhook, isConnected]);

  return {
    conversations,
    selectedChat,
    setSelectedChat,
    metrics,
    isConnected,
    loading,
    error,
    sendMessage,
    loadConversations,
    checkConnection
  };
};
