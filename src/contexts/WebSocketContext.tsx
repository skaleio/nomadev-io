import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '@/features/auth/context/AuthContext';

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
  // Solo conectamos si el usuario está autenticado y hay una URL explícita configurada.
  // Si VITE_WS_URL no está definido, el WS queda deshabilitado (evita el spam de errores
  // contra ws://localhost:3001 cuando no hay backend corriendo).
  const envWsUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
  const wsUrl = isAuthenticated && envWsUrl ? envWsUrl : null;

  const {
    isConnected,
    error,
    lastMessage,
    joinUserRoom,
    joinConversation,
    leaveConversation,
    sendTypingStart: wsSendTypingStart,
    sendTypingStop: wsSendTypingStop,
  } = useWebSocket(wsUrl);

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


