/**
 * Hook para gestión de conversaciones y mensajes
 */

import { useState, useEffect } from 'react';
import { 
  conversationService, 
  Conversation, 
  Message, 
  CreateConversationInput,
  CreateMessageInput 
} from '@/lib/services/conversation-service';
import { toast } from 'sonner';

export function useConversations(agentId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar conversaciones
  const loadConversations = async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await conversationService.getConversations(agentId);
      setConversations(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar conversaciones');
    } finally {
      setLoading(false);
    }
  };

  // Crear conversación
  const createConversation = async (
    userId: string,
    input: CreateConversationInput
  ): Promise<Conversation | null> => {
    try {
      const newConv = await conversationService.createConversation(userId, input);
      setConversations(prev => [newConv, ...prev]);
      return newConv;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Cerrar conversación
  const closeConversation = async (conversationId: string): Promise<boolean> => {
    try {
      const updated = await conversationService.closeConversation(conversationId);
      setConversations(prev => prev.map(c => c.id === conversationId ? updated : c));
      toast.success('Conversación cerrada');
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  // Archivar conversación
  const archiveConversation = async (conversationId: string): Promise<boolean> => {
    try {
      const updated = await conversationService.archiveConversation(conversationId);
      setConversations(prev => prev.map(c => c.id === conversationId ? updated : c));
      toast.success('Conversación archivada');
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    }
  };

  useEffect(() => {
    loadConversations();
  }, [agentId]);

  return {
    conversations,
    loading,
    error,
    loadConversations,
    createConversation,
    closeConversation,
    archiveConversation
  };
}

export function useConversation(conversationId: string | undefined) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar conversación y mensajes
  const loadConversation = async () => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [convData, messagesData] = await Promise.all([
        conversationService.getConversation(conversationId),
        conversationService.getMessages(conversationId)
      ]);

      setConversation(convData);
      setMessages(messagesData);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar conversación');
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensaje
  const sendMessage = async (
    agentId: string,
    content: string
  ): Promise<Message | null> => {
    if (!conversationId) return null;

    try {
      const newMessage = await conversationService.sendManualMessage(
        conversationId,
        agentId,
        content
      );
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err: any) {
      toast.error(err.message);
      return null;
    }
  };

  // Agregar mensaje (para actualizaciones en tiempo real)
  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  return {
    conversation,
    messages,
    loading,
    error,
    loadConversation,
    sendMessage,
    addMessage
  };
}

