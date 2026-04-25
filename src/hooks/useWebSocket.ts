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

export const useWebSocket = (url: string | null | undefined, options: UseWebSocketOptions = {}) => {
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

  const connect = (wsUrl: string) => {
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
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
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = (event) => {
        setError('Error de conexión WebSocket');
        onError?.(event);
      };

      ws.onclose = () => {
        setIsConnected(false);
        onClose?.();

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => connect(wsUrl), reconnectInterval);
        } else {
          setError('No se pudo reconectar al WebSocket');
        }
      };
    } catch {
      setError('Error al crear conexión WebSocket');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
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
    if (!url) {
      // URL vacía/null → no intentamos conectar (evita spam si no hay backend).
      disconnect();
      return;
    }
    connect(url);
    return () => disconnect();
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


