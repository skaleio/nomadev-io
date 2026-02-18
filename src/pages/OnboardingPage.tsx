import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import RippleGrid from '@/components/RippleGrid';
import { 
  CheckCircle, 
  Store, 
  MessageSquare, 
  Zap, 
  ArrowRight,
  ChevronRight,
  ShoppingBag,
  User,
  Sparkles
} from 'lucide-react';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "¡Bienvenido a NOMADEV!",
      description: "Estás a punto de transformar tu e-commerce",
      icon: Sparkles,
      color: "emerald"
    },
    {
      id: 2,
      title: "Conecta tu Tienda Shopify",
      description: "Sincroniza productos, pedidos y clientes",
      icon: Store,
      color: "blue"
    },
    {
      id: 3,
      title: "Configura WhatsApp",
      description: "Automatiza tus conversaciones de ventas",
      icon: MessageSquare,
      color: "green"
    },
    {
      id: 4,
      title: "¡Todo Listo!",
      description: "Comienza a vender en automático",
      icon: Zap,
      color: "yellow"
    }
  ];

  const features = [
    { 
      icon: ShoppingBag, 
      text: "Sincronización automática de productos",
      description: "Conecta tu tienda Shopify y sincroniza productos, variantes e inventario automáticamente"
    },
    { 
      icon: MessageSquare, 
      text: "Validación de pedidos por WhatsApp",
      description: "Confirma pedidos directamente por WhatsApp con tus clientes en tiempo real"
    },
    { 
      icon: Zap, 
      text: "Notificaciones en tiempo real",
      description: "Recibe alertas instantáneas de nuevos pedidos, mensajes y actualizaciones"
    },
    { 
      icon: CheckCircle, 
      text: "Dashboard con métricas completas",
      description: "Analiza el rendimiento de tus ventas con métricas detalladas y reportes"
    }
  ];

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleConnectShopify = () => {
    navigate('/shopify/connect');
  };

  const currentStepData = steps[currentStep - 1];
  const progress = (currentStep / steps.length) * 100;
  const StepIcon = currentStepData.icon;

  return (
    <div className="relative min-h-screen overflow-auto">
      {/* RippleGrid Background */}
      <div className="fixed inset-0 z-0">
        <RippleGrid
          enableRainbow={false}
          gridColor="#10b981"
          rippleIntensity={0.08}
          gridSize={8}
          gridThickness={12}
          mouseInteraction={true}
          mouseInteractionRadius={1.5}
          opacity={0.6}
          glowIntensity={0.15}
          fadeDistance={1.3}
          vignetteStrength={1.8}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8 pt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2">
                <span className="text-sm font-semibold text-emerald-400">
                  Paso {currentStep} de {steps.length}
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSkip}
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600"
            >
              Saltar
            </Button>
          </div>
          
          {/* Custom Progress Steps */}
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {/* Step Circle */}
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    currentStep > step.id
                      ? 'bg-emerald-500 border-emerald-500' // Completed
                      : currentStep === step.id
                      ? 'bg-emerald-500 border-emerald-500' // Current
                      : 'bg-gray-800 border-gray-600' // Pending
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <span className={`text-sm font-semibold ${
                        currentStep === step.id ? 'text-white' : 'text-gray-400'
                      }`}>
                        {step.id}
                      </span>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      currentStep >= step.id ? 'text-emerald-400' : 'text-gray-500'
                    }`}>
                      {step.title.split(' ')[0]}
                    </span>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 transition-all duration-300 ${
                    currentStep > step.id
                      ? 'bg-emerald-500' // Completed line
                      : 'bg-gray-600' // Pending line
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <Card className="bg-black border border-emerald-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <CardHeader className="text-center pb-6 pt-8 relative">
            <CardTitle className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              {currentStepData.title}
            </CardTitle>
            <CardDescription className="text-gray-300 text-xl font-medium">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Hola {user?.firstName || 'Usuario'} 👋
                  </h3>
                  <p className="text-gray-300 mb-6">
                    NOMADEV es la plataforma que automatiza tus ventas conectando Shopify con WhatsApp. 
                    En solo 3 pasos estarás vendiendo en automático.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {features.map((feature, index) => (
                    <div 
                      key={index}
                      className="group flex items-start space-x-6 p-8 rounded-2xl bg-black border border-gray-800 hover:border-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/10"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-2xl border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 group-hover:border-emerald-500/50 transition-all duration-300">
                          <feature.icon className="w-8 h-8 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-100 transition-colors duration-300">
                          {feature.text}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {feature.description || "Funcionalidad avanzada para optimizar tu negocio"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-6">
                  <Button 
                    onClick={() => setCurrentStep(2)}
                    className="relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-6 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center">
                      Comenzar
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Connect Shopify */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-slate-600/30 border border-slate-500/30 px-4 py-2 rounded-full mb-4">
                    <Store className="w-5 h-5 text-slate-300" />
                    <span className="text-slate-200 font-medium">Integración Principal</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Conecta tu Tienda Shopify
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Necesitamos acceso a tu tienda Shopify para sincronizar productos, 
                    pedidos y clientes automáticamente.
                  </p>
                </div>

                <div className="bg-black border border-gray-700/50 rounded-xl p-6 space-y-4">
                  <h4 className="font-semibold text-white mb-4 text-lg">¿Qué vamos a sincronizar?</h4>
                  
                  <div className="space-y-4">
                    {[
                      { label: "Productos y variantes", sublabel: "Para mostrarlos en WhatsApp" },
                      { label: "Pedidos en tiempo real", sublabel: "Para validación automática" },
                      { label: "Inventario actualizado", sublabel: "Stock en tiempo real" },
                      { label: "Datos de clientes", sublabel: "Para personalizar mensajes" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start space-x-4 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-800/70 transition-colors duration-200">
                        <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-semibold text-base">{item.label}</p>
                          <p className="text-sm text-gray-300 mt-1">{item.sublabel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-400 text-sm">💡</span>
                    </div>
                    <p className="text-sm text-yellow-200">
                      <strong>Tip:</strong> Necesitarás ser administrador de tu tienda Shopify 
                      para autorizar esta conexión.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800/50 hover:text-white hover:border-gray-500 px-6 py-3 transition-all duration-200"
                  >
                    Atrás
                  </Button>
                  <Button 
                    onClick={handleConnectShopify}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 transform hover:scale-105"
                  >
                    <Store className="mr-2 w-4 h-4" />
                    Conectar Shopify
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>

                <div className="text-center">
                  <button 
                    onClick={() => setCurrentStep(3)}
                    className="text-sm text-gray-400 hover:text-gray-300 underline"
                  >
                    Lo haré más tarde
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Configure WhatsApp */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-green-500/20 px-4 py-2 rounded-full mb-4">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                    <span className="text-green-300 font-medium">Automatización de Ventas</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Configura WhatsApp Business
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Conecta tu número de WhatsApp para automatizar las conversaciones de ventas.
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-sm text-yellow-200">
                    <strong>⏳ Próximamente:</strong> Esta funcionalidad estará disponible muy pronto. 
                    Por ahora puedes empezar a usar el dashboard con tu tienda Shopify conectada.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Atrás
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(4)}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-6 text-lg font-semibold"
                  >
                    Continuar
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    ¡Todo Listo! 🎉
                  </h3>
                  <p className="text-gray-300 mb-6 text-lg">
                    Tu cuenta está configurada. Ahora puedes empezar a usar NOMADEV.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: Store, title: "Ver Dashboard", desc: "Métricas y analytics" },
                    { icon: ShoppingBag, title: "Gestionar Pedidos", desc: "Validación automática" },
                    { icon: MessageSquare, title: "Chat en Vivo", desc: "Conversaciones WhatsApp" }
                  ].map((item, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <item.icon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg p-6">
                  <h4 className="font-semibold text-white mb-2">💡 Próximos pasos recomendados:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center space-x-2">
                      <ChevronRight className="w-4 h-4 text-emerald-500" />
                      <span>Explora el dashboard y familiarízate con las métricas</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <ChevronRight className="w-4 h-4 text-emerald-500" />
                      <span>Revisa tus productos sincronizados</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <ChevronRight className="w-4 h-4 text-emerald-500" />
                      <span>Configura notificaciones y alertas</span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-6 text-lg font-semibold rounded-lg"
                  >
                    Ir al Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

