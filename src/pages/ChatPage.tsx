import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  MessageCircle, 
  Search, 
  Send, 
  Phone, 
  Mail, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

interface ChatContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'online' | 'offline' | 'away';
  lastMessage?: string;
  unread: number;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'document';
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const handleConnectWhatsApp = () => {
    // Detectar si estamos en desarrollo y usar ngrok si está disponible
    const isDevelopment = import.meta.env.DEV;
    let origin;
    
    if (isDevelopment) {
      // En desarrollo, usar la URL de ngrok si está configurada
      const ngrokUrl = import.meta.env.VITE_NGROK_URL;
      if (ngrokUrl) {
        origin = ngrokUrl.replace(/\/$/, ''); // Remover trailing slash si existe
      } else {
        // Si no hay ngrok, forzar HTTPS del origen actual
        origin = window.location.origin.replace('http://', 'https://');
      }
    } else {
      // En producción, usar el origen actual forzando HTTPS
      origin = window.location.origin.replace('http://', 'https://');
    }
    
    const redirectUri = encodeURIComponent(`${origin}/whatsapp/callback`);
    const clientId = import.meta.env.VITE_FACEBOOK_APP_ID || '2418200798594955';
    const scope = 'whatsapp_business_management,business_management,whatsapp_business_messaging';
    
    // URL de OAuth de Facebook para WhatsApp Business
    const facebookOAuthUrl = `https://www.facebook.com/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=whatsapp_connect&auth_type=rerequest`;
    
    // Abrir ventana emergente centrada
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      facebookOAuthUrl,
      'Conectar WhatsApp',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    // Monitorear cuando se cierre la ventana
    if (popup) {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // No recargar automáticamente para evitar deslogueo
          // El callback de WhatsApp manejará la actualización del estado
        }
      }, 500);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      // TODO: Implementar conexión real a Supabase cuando esté listo
      // const { data, error } = await supabase
      //   .from('chat_contacts')
      //   .select('*')
      //   .order('last_message_at', { ascending: false });
      // 
      // if (error) {
      //   console.error('Error fetching contacts:', error);
      //   setContacts([]);
      // } else {
      //   setContacts(data || []);
      // }
      
      // Por ahora, usar lista vacía hasta conectar con Shopify
      setContacts([]);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (contactId: string) => {
    try {
      // TODO: Implementar conexión real a Supabase cuando esté listo
      // const { data, error } = await supabase
      //   .from('chat_messages')
      //   .select('*')
      //   .eq('contact_id', contactId)
      //   .order('created_at', { ascending: true });
      // 
      // if (error) {
      //   console.error('Error fetching messages:', error);
      //   setMessages([]);
      // } else {
      //   setMessages(data || []);
      // }
      
      // Por ahora, usar lista vacía hasta conectar con Shopify
      setMessages([]);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    try {
      // TODO: Implementar envío real de mensaje
      // const { error } = await supabase
      //   .from('chat_messages')
      //   .insert({
      //     contact_id: selectedContact.id,
      //     sender: 'agent',
      //     message: newMessage,
      //     type: 'text'
      //   });
      // 
      // if (error) {
      //   console.error('Error sending message:', error);
      //   return;
      // }
      
      // Por ahora, solo limpiar el input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'away': return 'bg-warning';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'En línea';
      case 'away': return 'Ausente';
      case 'offline': return 'Desconectado';
      default: return 'Desconectado';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Chat en Vivo</h1>
            <p className="text-muted-foreground mt-1">Gestiona las conversaciones con tus clientes</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadContacts}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Conversaciones Activas</p>
                  <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Clientes En Línea</p>
                  <p className="text-2xl font-bold text-success">0</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Mensajes Sin Leer</p>
                  <p className="text-2xl font-bold text-warning">0</p>
                </div>
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Tiempo Promedio</p>
                  <p className="text-2xl font-bold text-info">0 min</p>
                </div>
                <Clock className="w-8 h-8 text-info" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Lista de Contactos */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversaciones ({filteredContacts.length})
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar conversaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Cargando...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No hay conversaciones</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm
                      ? 'No se encontraron conversaciones con los filtros aplicados'
                      : 'Conecta tu número de WhatsApp Business para ver las conversaciones aquí'
                    }
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={handleConnectWhatsApp}
                      className="font-semibold py-3 px-6"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Conectar WhatsApp
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedContact?.id === contact.id
                            ? 'bg-muted border-l-4 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedContact(contact);
                          loadMessages(contact.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(contact.status)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-foreground font-medium truncate">{contact.name}</p>
                              {contact.unread > 0 && (
                                <Badge className="bg-primary text-primary-foreground text-xs">
                                  {contact.unread}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm truncate">
                              {contact.lastMessage || 'Sin mensajes'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{getStatusText(contact.status)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Área de Chat */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border h-full flex flex-col">
              {selectedContact ? (
                <>
                  <CardHeader className="border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(selectedContact.status)}`} />
                      </div>
                      <div>
                        <h3 className="text-foreground font-semibold">{selectedContact.name}</h3>
                        <p className="text-muted-foreground text-sm">{getStatusText(selectedContact.status)}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col p-0">
                    <ScrollArea className="flex-1 p-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No hay mensajes en esta conversación</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  message.sender === 'agent'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground'
                                }`}
                              >
                                <p className="text-sm">{message.message}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {formatTime(message.timestamp)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    <div className="border-t border-border p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Escribe un mensaje..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Selecciona una conversación</h3>
                    <p className="text-muted-foreground">Elige una conversación de la lista para comenzar a chatear</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}