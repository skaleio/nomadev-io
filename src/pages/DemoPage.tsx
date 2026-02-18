import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Phone,
  MapPin,
  Package,
  CreditCard,
  Bot,
  User,
  Send,
  Loader2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  type?: 'order' | 'validation' | 'confirmation';
}

interface OrderData {
  id: string;
  customer: string;
  phone: string;
  products: string[];
  total: number;
  address: string;
  status: 'pending' | 'validating' | 'confirmed' | 'shipped';
}

const DemoPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const demoSteps = [
    {
      title: "Cliente realiza pedido en Shopify",
      description: "María González compra productos en tu tienda",
      duration: 2000
    },
    {
      title: "Sistema detecta nuevo pedido",
      description: "NOMADEV.IO recibe la notificación automáticamente",
      duration: 1500
    },
    {
      title: "Envío automático de WhatsApp",
      description: "Se envía mensaje de confirmación al cliente",
      duration: 2000
    },
    {
      title: "Cliente responde y valida",
      description: "María confirma sus datos y productos",
      duration: 3000
    },
    {
      title: "Pedido confirmado y listo",
      description: "Sistema actualiza estado y prepara envío",
      duration: 2000
    }
  ];

  const chatFlow = [
    {
      sender: 'bot' as const,
      text: '¡Hola María! 👋 Hemos recibido tu pedido #ORD-001. ¿Podrías confirmar que estos son los productos correctos?',
      type: 'order' as const,
      delay: 1000
    },
    {
      sender: 'user' as const,
      text: 'Sí, esos son los productos que pedí. ¿Cuándo llegará mi pedido?',
      delay: 2000
    },
    {
      sender: 'bot' as const,
      text: 'Perfecto! 🎉 Tu pedido será enviado mañana y llegará en 2-3 días hábiles. ¿Podrías confirmar tu dirección de entrega?',
      type: 'validation' as const,
      delay: 1500
    },
    {
      sender: 'user' as const,
      text: 'Sí, mi dirección es correcta: Av. Providencia 1234, Santiago',
      delay: 2000
    },
    {
      sender: 'bot' as const,
      text: '¡Excelente! ✅ Tu pedido ha sido confirmado y está listo para envío. Te enviaremos el número de seguimiento por WhatsApp. ¡Gracias por elegirnos!',
      type: 'confirmation' as const,
      delay: 1500
    }
  ];

  const sampleOrder: OrderData = {
    id: 'ORD-001',
    customer: 'María González',
    phone: '+56912345678',
    products: ['Camiseta Premium', 'Pantalón Deportivo', 'Zapatillas Running'],
    total: 89900,
    address: 'Av. Providencia 1234, Santiago',
    status: 'pending'
  };

  useEffect(() => {
    if (isPlaying && currentStep < demoSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, demoSteps[currentStep].duration);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep]);

  useEffect(() => {
    if (isPlaying && currentStep >= 2) {
      // Iniciar flujo de chat cuando llegamos al paso 3
      startChatFlow();
    }
  }, [currentStep]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startChatFlow = async () => {
    setOrderData(sampleOrder);
    
    for (let i = 0; i < chatFlow.length; i++) {
      const message = chatFlow[i];
      
      // Mostrar indicador de escritura para mensajes del bot
      if (message.sender === 'bot') {
        setIsTyping(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsTyping(false);
      }
      
      // Agregar mensaje
      setMessages(prev => [...prev, {
        id: `msg-${i}`,
        text: message.text,
        sender: message.sender,
        timestamp: new Date(),
        type: message.type
      }]);
      
      // Actualizar estado del pedido
      if (message.type === 'validation') {
        setOrderData(prev => prev ? { ...prev, status: 'validating' } : null);
      } else if (message.type === 'confirmation') {
        setOrderData(prev => prev ? { ...prev, status: 'confirmed' } : null);
      }
      
      await new Promise(resolve => setTimeout(resolve, message.delay));
    }
  };

  const startDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setMessages([]);
    setOrderData(null);
    setIsTyping(false);
  };

  const pauseDemo = () => {
    setIsPlaying(false);
  };

  const resetDemo = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setMessages([]);
    setOrderData(null);
    setIsTyping(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'validating': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'validating': return 'Validando';
      case 'confirmed': return 'Confirmado';
      case 'shipped': return 'Enviado';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/70 backdrop-blur-md sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-emerald-600 tracking-wide">
              NOMADEV.IO
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg">
                Comenzar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Demo Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
            Demo Interactivo
          </h1>
          <p className="text-xl text-gray-700 mb-6 max-w-2xl mx-auto">
            Ve cómo NOMADEV.IO automatiza la validación de pedidos y reduce las devoluciones
          </p>
          
          {/* Demo Controls */}
          <div className="flex justify-center space-x-4 mb-8">
            <Button
              onClick={startDemo}
              disabled={isPlaying}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Demo
            </Button>
            <Button
              onClick={pauseDemo}
              disabled={!isPlaying}
              variant="outline"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
            <Button
              onClick={resetDemo}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Demo Steps */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-emerald-600" />
                  Flujo de Validación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all duration-500 ${
                        index === currentStep
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : index < currentStep
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          index < currentStep
                            ? 'bg-green-500 text-white'
                            : index === currentStep
                            ? 'bg-emerald-500 text-white animate-pulse'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index < currentStep ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{step.title}</h3>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            {orderData && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Información del Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Pedido:</span>
                      <span className="font-mono text-sm">{orderData.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Cliente:</span>
                      <span>{orderData.customer}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Teléfono:</span>
                      <span className="font-mono text-sm">{orderData.phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-emerald-600">${orderData.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Estado:</span>
                      <Badge className={getStatusColor(orderData.status)}>
                        {getStatusText(orderData.status)}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium block mb-2">Productos:</span>
                      <ul className="space-y-1">
                        {orderData.products.map((product, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                            {product}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium block mb-2">Dirección:</span>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {orderData.address}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Chat Simulation */}
          <div className="space-y-6">
            <Card className="shadow-lg h-[500px] flex flex-col">
              <CardHeader className="border-b bg-green-50">
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                  WhatsApp Business
                  <Badge className="ml-2 bg-green-100 text-green-800">Conectado</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 bg-gray-50">
                {/* Chat Messages */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px]">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[85%] ${
                        message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className={message.sender === 'bot' ? 'bg-green-500' : 'bg-blue-500'}>
                            {message.sender === 'bot' ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`rounded-2xl p-3 shadow-sm ${
                          message.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.text}</p>
                          {message.type && (
                            <div className={`mt-2 pt-2 ${
                              message.sender === 'user' ? 'border-blue-400' : 'border-gray-200'
                            } border-t`}>
                              {message.type === 'order' && (
                                <div className="flex items-center text-xs text-emerald-600">
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  Pedido detectado
                                </div>
                              )}
                              {message.type === 'validation' && (
                                <div className="flex items-center text-xs text-blue-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Validación requerida
                                </div>
                              )}
                              {message.type === 'confirmation' && (
                                <div className="flex items-center text-xs text-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Pedido confirmado
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start mb-3">
                      <div className="flex items-start space-x-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-green-500">
                            <Bot className="h-4 w-4 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-white rounded-2xl rounded-bl-md p-3 shadow-sm border border-gray-200">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Scroll anchor */}
                  <div ref={chatEndRef} />
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-center">¿Por qué elegir NOMADEV.IO?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">-85%</div>
                    <div className="text-sm text-gray-600">Menos devoluciones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">+300%</div>
                    <div className="text-sm text-gray-600">Aumento en ventas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">98%</div>
                    <div className="text-sm text-gray-600">Satisfacción</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">24/7</div>
                    <div className="text-sm text-gray-600">Automatización</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <h2 className="text-3xl font-bold mb-4">¿Listo para automatizar tu negocio?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a miles de emprendedores que ya están usando NOMADEV.IO
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-lg px-8 py-6 shadow-xl">
                Comenzar Gratis Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
