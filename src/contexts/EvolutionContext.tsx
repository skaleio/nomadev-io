import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { useEvolutionWebSocket } from '../hooks/useEvolutionWebSocket';
import { useAuth } from './AuthContext';

interface EvolutionMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  type: 'text' | 'audio' | 'image' | 'document';
  status?: 'sent' | 'delivered' | 'read';
}

interface EvolutionContextType {
  isConnected: boolean;
  error: string | null;
  lastMessage: EvolutionMessage | null;
  messages: EvolutionMessage[];
  sendMessage: (to: string, message: string, type?: 'text' | 'audio' | 'image' | 'document') => boolean;
  sendTyping: (to: string, isTyping: boolean) => boolean;
  markAsRead: (messageId: string) => boolean;
  joinInstance: (instanceName: string) => void;
  leaveInstance: () => void;
  currentInstance: string | null;
  setCurrentInstance: (instance: string | null) => void;
  connectionStatus?: 'disconnected' | 'connecting' | 'connected' | 'error';
}

const EvolutionContext = createContext<EvolutionContextType | undefined>(undefined);

interface EvolutionProviderProps {
  children: ReactNode;
}

export const EvolutionProvider: React.FC<EvolutionProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<EvolutionMessage[]>([]);
  const [currentInstance, setCurrentInstance] = useState<string | null>(null);
  
  // URL de Evolution API desde variables de entorno
  const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'wss://api.evolution.com';
  
  const {
    isConnected,
    error,
    lastMessage,
    sendMessage: wsSendMessage,
    sendTyping: wsSendTyping,
    markAsRead: wsMarkAsRead,
    joinInstance: wsJoinInstance,
    leaveInstance: wsLeaveInstance,
    connectionStatus,
  } = useEvolutionWebSocket(currentInstance || '', {
    onMessage: (message: EvolutionMessage) => {
      console.log('Mensaje Evolution API recibido:', message);
      
      // Agregar mensaje a la lista
      setMessages(prev => {
        // Evitar duplicados
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) return prev;
        
        return [...prev, message].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    },
    onError: (error) => {
      console.error('Error Evolution API:', error);
    },
    onConnect: () => {
      console.log('Conectado a Evolution API');
    },
    onDisconnect: () => {
      console.log('Desconectado de Evolution API');
    },
  });

  // Conectar a la instancia cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user && !currentInstance) {
      // Aquí podrías obtener la instancia del usuario desde la base de datos
      // Por ahora usamos una instancia por defecto
      const defaultInstance = 'rdrgz'; // Instancia de tu automatización n8n
      setCurrentInstance(defaultInstance);
    }
  }, [isAuthenticated, user, currentInstance]);

  const sendMessage = (to: string, message: string, type: 'text' | 'audio' | 'image' | 'document' = 'text'): boolean => {
    if (!isConnected || !currentInstance) {
      console.error('No conectado a Evolution API o sin instancia');
      return false;
    }

    const success = wsSendMessage(to, message, type);
    
    if (success) {
      // Agregar mensaje enviado a la lista local
      const sentMessage: EvolutionMessage = {
        id: Date.now().toString(),
        from: currentInstance,
        to,
        message,
        timestamp: new Date().toISOString(),
        type,
        status: 'sent'
      };
      
      setMessages(prev => [...prev, sentMessage]);
    }
    
    return success;
  };

  const sendTyping = (to: string, isTyping: boolean): boolean => {
    if (!isConnected || !currentInstance) {
      return false;
    }
    return wsSendTyping(to, isTyping);
  };

  const markAsRead = (messageId: string): boolean => {
    if (!isConnected) {
      return false;
    }
    return wsMarkAsRead(messageId);
  };

  const joinInstance = (instanceName: string) => {
    setCurrentInstance(instanceName);
    wsJoinInstance(instanceName);
  };

  const leaveInstance = () => {
    wsLeaveInstance();
    setCurrentInstance(null);
  };

  const value: EvolutionContextType = {
    isConnected,
    error,
    lastMessage,
    messages,
    sendMessage,
    sendTyping,
    markAsRead,
    joinInstance,
    leaveInstance,
    currentInstance,
    setCurrentInstance,
    connectionStatus,
  };

  return (
    <EvolutionContext.Provider value={value}>
      {children}
    </EvolutionContext.Provider>
  );
};

export const useEvolution = (): EvolutionContextType => {
  const context = useContext(EvolutionContext);
  if (context === undefined) {
    throw new Error('useEvolution debe ser usado dentro de un EvolutionProvider');
  }
  return context;
};
