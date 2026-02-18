import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket conectado');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Error de conexión WebSocket');
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('WebSocket desconectado');
        setIsConnected(false);
        onClose?.();
        
        // Intentar reconectar si no se alcanzó el máximo de intentos
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Intentando reconectar... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setError('No se pudo reconectar al WebSocket');
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Error al crear conexión WebSocket');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  const joinUserRoom = (userId: string) => {
    sendMessage({
      type: 'join-user-room',
      userId,
    });
  };

  const joinConversation = (conversationId: string) => {
    sendMessage({
      type: 'join-conversation',
      conversationId,
    });
  };

  const leaveConversation = (conversationId: string) => {
    sendMessage({
      type: 'leave-conversation',
      conversationId,
    });
  };

  const sendTypingStart = (conversationId: string, userId: string) => {
    sendMessage({
      type: 'typing-start',
      conversationId,
      userId,
    });
  };

  const sendTypingStop = (conversationId: string, userId: string) => {
    sendMessage({
      type: 'typing-stop',
      conversationId,
      userId,
    });
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    isConnected,
    error,
    lastMessage,
    sendMessage,
    joinUserRoom,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
    connect,
    disconnect,
  };
};


