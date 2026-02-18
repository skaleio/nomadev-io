import React, { useState, useEffect } from 'react';
import { WhatsAppChat } from '@/components/chat/WhatsAppChat';
import { useEvolution } from '@/contexts/EvolutionContext';
import { useEvolutionChat } from '@/hooks/useEvolutionChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

export const WhatsAppChatPage: React.FC = () => {
  const {
    isConnected,
    error,
    connectionStatus,
    currentInstance,
    setCurrentInstance,
    sendMessage: evolutionSendMessage,
    sendTyping,
    messages: evolutionMessages
  } = useEvolution();

  const {
    conversations,
    selectedChat,
    setSelectedChat,
    metrics,
    loading,
    error: chatError,
    sendMessage: chatSendMessage,
    loadConversations,
    checkConnection
  } = useEvolutionChat();

  const [selectedContact, setSelectedContact] = useState<any>(null);

  // Inicializar instancia por defecto
  useEffect(() => {
    if (!currentInstance) {
      const defaultInstance = 'SKALETEST'; // Tu instancia de Evolution API
      setCurrentInstance(defaultInstance);
    }
  }, [currentInstance, setCurrentInstance]);

  // Convertir conversaciones a formato de contactos para WhatsAppChat
  const contacts = conversations.map(conv => ({
    id: conv.id,
    name: conv.name,
    phone: conv.phone,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name)}&background=random`,
    lastMessage: conv.lastMessage,
    time: conv.time,
    unread: conv.unread,
    isOnline: conv.isOnline,
    status: conv.status
  }));

  // Convertir mensajes de Evolution a formato de chat
  const chatMessages = selectedContact ?
    (selectedChat?.messages || []).map(msg => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender,
      time: msg.time,
      timestamp: msg.timestamp,
      status: 'delivered' as const,
      type: 'text' as const
    })) : [];

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact);

    // Buscar la conversación correspondiente
    const conversation = conversations.find(conv => conv.id === contact.id);
    if (conversation) {
      setSelectedChat(conversation);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedContact) return;

    try {
      // Enviar a través del hook de Evolution chat
      await chatSendMessage(selectedContact.id, text);

      // También enviar a través del contexto Evolution para WebSocket
      const phoneNumber = selectedContact.phone.replace(/\D/g, ''); // Solo números
      evolutionSendMessage(phoneNumber, text);

    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const handleTypingStart = () => {
    if (selectedContact) {
      sendTyping(selectedContact.phone, true);
    }
  };

  const handleTypingStop = () => {
    if (selectedContact) {
      sendTyping(selectedContact.phone, false);
    }
  };

  const handleRefresh = () => {
    loadConversations();
    checkConnection();
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Error';
      case 'disconnected':
      default:
        return 'Desconectado';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'disconnected':
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Cargando conversaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <MessageCircle className="mr-3 text-green-600" />
              Chat WhatsApp
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona todas tus conversaciones de WhatsApp desde aquí
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>

            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getConnectionStatusColor()}`}>
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {getConnectionStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Chats Activos</p>
                  <p className="text-2xl font-bold">{metrics.activeChats}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold">{metrics.pendingChats}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Tiempo Promedio</p>
                  <p className="text-2xl font-bold">{metrics.averageResponseTime}min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Resueltos Hoy</p>
                  <p className="text-2xl font-bold">{metrics.resolvedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertas de estado */}
      {(error || chatError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || chatError}
          </AlertDescription>
        </Alert>
      )}

      {!isConnected && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            No hay conexión con Evolution API. Las funciones de chat están limitadas.
          </AlertDescription>
        </Alert>
      )}

      {/* Chat Interface */}
      <Card>
        <CardContent className="p-0">
          <WhatsAppChat
            contacts={contacts}
            messages={chatMessages}
            selectedContact={selectedContact}
            onSelectContact={handleSelectContact}
            onSendMessage={handleSendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            isConnected={isConnected}
            connectionStatus={getConnectionStatusText()}
          />
        </CardContent>
      </Card>

      {/* Footer info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Instancia: <Badge variant="outline">{currentInstance || 'No configurada'}</Badge>
          {' • '}
          Total de conversaciones: <span className="font-semibold">{conversations.length}</span>
        </p>
      </div>
    </div>
  );
};