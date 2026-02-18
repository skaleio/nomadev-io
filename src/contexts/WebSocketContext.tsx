import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  error: string | null;
  lastMessage: any;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
  
  const {
    isConnected,
    error,
    lastMessage,
    joinUserRoom,
    joinConversation,
    leaveConversation,
    sendTypingStart: wsSendTypingStart,
    sendTypingStop: wsSendTypingStop,
  } = useWebSocket(wsUrl, {
    onMessage: (message) => {
      console.log('Mensaje WebSocket recibido:', message);
      // Aquí puedes manejar diferentes tipos de mensajes
      // Por ejemplo, actualizar el estado de conversaciones, etc.
    },
    onError: (error) => {
      console.error('Error WebSocket:', error);
    },
    onOpen: () => {
      console.log('WebSocket conectado');
    },
    onClose: () => {
      console.log('WebSocket desconectado');
    },
  });

  // Unirse a la sala del usuario cuando se autentica
  useEffect(() => {
    if (isAuthenticated && user && isConnected) {
      joinUserRoom(user.id);
    }
  }, [isAuthenticated, user, isConnected, joinUserRoom]);

  const sendTypingStart = (conversationId: string) => {
    if (user) {
      wsSendTypingStart(conversationId, user.id);
    }
  };

  const sendTypingStop = (conversationId: string) => {
    if (user) {
      wsSendTypingStop(conversationId, user.id);
    }
  };

  const value: WebSocketContextType = {
    isConnected,
    error,
    lastMessage,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext debe ser usado dentro de un WebSocketProvider');
  }
  return context;
};


