import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface EvolutionWebSocketOptions {
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface EvolutionMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  type: 'text' | 'audio' | 'image' | 'document';
  status?: 'sent' | 'delivered' | 'read';
  messageType?: string;
  pushName?: string;
}

interface EvolutionWebSocketReturn {
  isConnected: boolean;
  error: string | null;
  lastMessage: EvolutionMessage | null;
  sendMessage: (to: string, message: string, type?: 'text' | 'audio' | 'image' | 'document') => boolean;
  sendTyping: (to: string, isTyping: boolean) => boolean;
  markAsRead: (messageId: string) => boolean;
  joinInstance: (instanceName: string) => void;
  leaveInstance: () => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export const useEvolutionWebSocket = (
  instanceName: string,
  options: EvolutionWebSocketOptions = {}
): EvolutionWebSocketReturn => {
  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<EvolutionMessage | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentInstanceRef = useRef<string | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      // Conectar a nuestro servidor WebSocket local
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3002';

      console.log('🔄 Conectando a WebSocket Server:', wsUrl);
      setConnectionStatus('connecting');

      const socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: reconnectInterval,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Conectado al WebSocket Server');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();

        // Auto-join a la instancia si está definida
        if (instanceName && instanceName !== currentInstanceRef.current) {
          socket.emit('join_instance', { instanceName });
          currentInstanceRef.current = instanceName;
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Desconectado del WebSocket Server:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();
      });

      socket.on('connect_error', (err) => {
        console.error('💥 Error de conexión WebSocket:', err);
        setConnectionStatus('error');
        setError('Error de conexión con WebSocket Server');
        onError?.(err);
      });

      // Eventos del servidor Evolution API
      socket.on('evolution_connected', (data) => {
        console.log('🤖 Conectado a Evolution API:', data);
      });

      socket.on('evolution_disconnected', (data) => {
        console.log('❌ Desconectado de Evolution API:', data);
      });

      socket.on('evolution_error', (data) => {
        console.error('💥 Error Evolution API:', data);
        setError(`Error Evolution API: ${data.error}`);
        onError?.(data);
      });

      // Mensajes de Evolution API
      socket.on('evolution_message', (data) => {
        console.log('📨 Mensaje Evolution API:', data);

        const messageData = data.data;
        const evolutionMessage: EvolutionMessage = {
          id: messageData.key?.id || messageData.id || Date.now().toString(),
          from: messageData.key?.remoteJid || messageData.from || '',
          to: messageData.key?.participant || messageData.to || '',
          message: messageData.message?.conversation ||
                  messageData.message?.extendedTextMessage?.text ||
                  messageData.message ||
                  'Mensaje multimedia',
          timestamp: data.timestamp || new Date().toISOString(),
          type: messageData.message?.conversation ? 'text' :
                messageData.message?.audioMessage ? 'audio' :
                messageData.message?.imageMessage ? 'image' :
                messageData.message?.documentMessage ? 'document' : 'text',
          status: 'delivered',
          messageType: messageData.messageType,
          pushName: messageData.pushName
        };

        setLastMessage(evolutionMessage);
        onMessage?.(evolutionMessage);
      });

      // Webhooks de Evolution API
      socket.on('evolution_webhook', (data) => {
        console.log('🎣 Webhook Evolution API:', data);

        if (data.data && data.data.data) {
          const webhookData = data.data.data;

          // Procesar diferentes tipos de webhooks
          if (webhookData.key && webhookData.message) {
            const evolutionMessage: EvolutionMessage = {
              id: webhookData.key.id || Date.now().toString(),
              from: webhookData.key.remoteJid || '',
              to: webhookData.key.participant || '',
              message: webhookData.message.conversation ||
                      webhookData.message.extendedTextMessage?.text ||
                      'Mensaje multimedia',
              timestamp: new Date().toISOString(),
              type: 'text',
              status: 'delivered',
              messageType: webhookData.messageType,
              pushName: webhookData.pushName
            };

            setLastMessage(evolutionMessage);
            onMessage?.(evolutionMessage);
          }
        }
      });

      // Confirmaciones de envío
      socket.on('message_sent', (data) => {
        console.log('✅ Mensaje enviado:', data);
      });

      socket.on('message_error', (data) => {
        console.error('❌ Error enviando mensaje:', data);
        setError(`Error enviando mensaje: ${data.error}`);
      });

      // Indicadores de escritura
      socket.on('user_typing', (data) => {
        console.log('✍️ Usuario escribiendo:', data);
      });

    } catch (err) {
      console.error('💥 Error creando conexión WebSocket:', err);
      setConnectionStatus('error');
      setError('Error al crear conexión WebSocket');
      onError?.(err);
    }
  }, [instanceName, onMessage, onError, onConnect, onDisconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((to: string, message: string, type: 'text' | 'audio' | 'image' | 'document' = 'text'): boolean => {
    if (socketRef.current && isConnected && currentInstanceRef.current) {
      console.log(`💬 Enviando mensaje: ${message} -> ${to}`);

      socketRef.current.emit('send_message', {
        instanceName: currentInstanceRef.current,
        to,
        message,
        type
      });

      return true;
    } else {
      console.warn('❌ No se puede enviar mensaje - no conectado o sin instancia');
      return false;
    }
  }, [isConnected]);

  const sendTyping = useCallback((to: string, isTyping: boolean): boolean => {
    if (socketRef.current && isConnected && currentInstanceRef.current) {
      const eventName = isTyping ? 'typing_start' : 'typing_stop';

      socketRef.current.emit(eventName, {
        instanceName: currentInstanceRef.current,
        to
      });

      return true;
    }
    return false;
  }, [isConnected]);

  const markAsRead = useCallback((messageId: string): boolean => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_read', { messageId });
      return true;
    }
    return false;
  }, [isConnected]);

  const joinInstance = useCallback((newInstanceName: string) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log(`🚪 Uniéndose a instancia: ${newInstanceName}`);

      // Salir de la instancia anterior si existe
      if (currentInstanceRef.current && currentInstanceRef.current !== newInstanceName) {
        socketRef.current.emit('leave_instance', { instanceName: currentInstanceRef.current });
      }

      // Unirse a la nueva instancia
      socketRef.current.emit('join_instance', { instanceName: newInstanceName });
      currentInstanceRef.current = newInstanceName;
    }
  }, []);

  const leaveInstance = useCallback(() => {
    if (socketRef.current && socketRef.current.connected && currentInstanceRef.current) {
      console.log(`👋 Saliendo de instancia: ${currentInstanceRef.current}`);

      socketRef.current.emit('leave_instance', { instanceName: currentInstanceRef.current });
      currentInstanceRef.current = null;
    }
  }, []);

  // Conectar cuando se monta el componente
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Auto-join cuando cambia la instancia
  useEffect(() => {
    if (isConnected && instanceName && instanceName !== currentInstanceRef.current) {
      joinInstance(instanceName);
    }
  }, [isConnected, instanceName, joinInstance]);

  return {
    isConnected,
    error,
    lastMessage,
    sendMessage,
    sendTyping,
    markAsRead,
    joinInstance,
    leaveInstance,
    connectionStatus,
  };
};
