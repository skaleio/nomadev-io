import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  VideoIcon,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  Mic
} from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'customer' | 'agent';
  time: string;
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'audio' | 'image' | 'document';
}

interface ChatContact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  status: 'hot' | 'warm' | 'cold' | 'new';
}

interface WhatsAppChatProps {
  contacts: ChatContact[];
  messages: ChatMessage[];
  selectedContact: ChatContact | null;
  onSelectContact: (contact: ChatContact) => void;
  onSendMessage: (text: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  isConnected?: boolean;
  connectionStatus?: string;
}

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  contacts,
  messages,
  selectedContact,
  onSelectContact,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  isConnected = false,
  connectionStatus = 'disconnected'
}) => {
  const [messageText, setMessageText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Manejar indicador de escritura
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageText(value);

    // Indicador de typing
    if (value && !isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout para detener typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop?.();
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (messageText.trim() && selectedContact) {
      onSendMessage(messageText.trim());
      setMessageText('');

      // Detener typing
      setIsTyping(false);
      onTypingStop?.();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleCall = () => {
    if (selectedContact) {
      console.log('Iniciando llamada a:', selectedContact.name, selectedContact.phone);
      // Aquí puedes integrar con tu sistema de llamadas
      alert(`Llamando a ${selectedContact.name} (${selectedContact.phone})`);
    }
  };

  const handleVideoCall = () => {
    if (selectedContact) {
      console.log('Iniciando videollamada a:', selectedContact.name, selectedContact.phone);
      // Aquí puedes integrar con tu sistema de videollamadas
      alert(`Videollamada con ${selectedContact.name} (${selectedContact.phone})`);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-500';
      case 'warm': return 'bg-orange-500';
      case 'cold': return 'bg-gray-500';
      case 'new': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
    contact.phone.includes(searchText)
  );

  return (
    <div className="flex h-[600px] bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* Lista de contactos */}
      <div className="w-1/3 border-r border-gray-700 bg-gray-800">
        {/* Header de contactos */}
        <div className="p-4 bg-[#00a884] text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Chats</h2>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs">{connectionStatus}</span>
            </div>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar conversaciones..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/70"
            />
          </div>
        </div>

        {/* Lista de conversaciones */}
        <ScrollArea className="h-[calc(100%-120px)]">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                selectedContact?.id === contact.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-gray-600 text-gray-200">
                      {contact.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {contact.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-100 truncate">
                      {contact.name}
                    </h3>
                    <span className="text-xs text-gray-400">{contact.time}</span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-400 truncate">
                      {contact.lastMessage}
                    </p>
                    <div className="flex items-center space-x-1">
                      <Badge className={`w-2 h-2 p-0 ${getStatusColor(contact.status)}`} />
                      {contact.unread > 0 && (
                        <Badge className="bg-[#00a884] text-white text-xs px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                          {contact.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat principal */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Header del chat */}
            <div className="p-4 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" className="md:hidden text-gray-300">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>

                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedContact.avatar} />
                    <AvatarFallback className="bg-gray-600 text-gray-200">
                      {selectedContact.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="font-semibold text-gray-100">
                      {selectedContact.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {selectedContact.isOnline ? 'En línea' : 'Visto hace ' + selectedContact.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={handleVideoCall}
                    title="Videollamada"
                  >
                    <VideoIcon className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                    onClick={handleCall}
                    title="Llamar"
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                    title="Más opciones"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <ScrollArea className="flex-1 p-4 bg-gray-900">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md xl:max-w-lg px-3 py-2 rounded-lg ${
                        message.sender === 'agent'
                          ? 'bg-[#005c4b] text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div className="flex items-center justify-end space-x-1 mt-1">
                        <span className={`text-xs ${message.sender === 'agent' ? 'text-gray-300' : 'text-gray-400'}`}>
                          {message.time}
                        </span>
                        {message.sender === 'agent' && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de mensaje */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" type="button" className="text-gray-400 hover:text-white">
                  <Paperclip className="w-4 h-4" />
                </Button>

                <div className="flex-1 flex items-center bg-gray-700 rounded-full px-4 py-2">
                  <Button variant="ghost" size="sm" type="button" className="text-gray-400 hover:text-white">
                    <Smile className="w-4 h-4" />
                  </Button>

                  <Input
                    placeholder="Escribe un mensaje..."
                    value={messageText}
                    onChange={handleInputChange}
                    className="border-none bg-transparent focus-visible:ring-0 flex-1 text-gray-100 placeholder-gray-400"
                  />
                </div>

                {messageText.trim() ? (
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-[#00a884] hover:bg-[#008f72] text-white rounded-full w-10 h-10 p-0"
                    disabled={!isConnected}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-white rounded-full w-10 h-10 p-0"
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-8 opacity-20">
                <svg viewBox="0 0 303 172" className="text-gray-600">
                  <path fill="currentColor" d="M151.5 0C68.7 0 1.5 67.2 1.5 150c0 31.2 9.6 60.3 26.1 84.3L.9 300l68.4-26.7c22.8 15 50.1 23.7 79.5 23.7 82.8 0 150-67.2 150-150S234.3 0 151.5 0zm0 274.5c-26.7 0-51.9-8.4-72.6-22.8l-5.1-3-33.9 13.2 13.5-33.3-3.3-5.4c-15.9-21.3-24.3-46.5-24.3-72.6 0-68.7 55.8-124.5 124.5-124.5s124.5 55.8 124.5 124.5-55.8 124.5-124.5 124.5z"/>
                </svg>
              </div>
              <p className="text-gray-400 text-lg">Selecciona una conversación</p>
              <p className="text-gray-500 text-sm mt-2">
                Elige una conversación para empezar a chatear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
