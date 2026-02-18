import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Image, 
  PenTool, 
  Video, 
  FileText, 
  Palette, 
  Zap, 
  Brain,
  Camera,
  Wand2,
  Lightbulb,
  Target,
  TrendingUp,
  ArrowRight,
  Settings,
  Plus,
  MessageSquare,
  Zap as ZapIcon,
  Globe,
  Layout,
  Bot,
  Cpu
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AITool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'content' | 'visual' | 'analytics' | 'automation';
  status: 'available' | 'coming_soon' | 'beta';
  features: string[];
  color: string;
}

const aiTools: AITool[] = [
  {
    id: 'product-images',
    title: 'Generador de Imágenes de Productos',
    description: 'Crea imágenes profesionales de productos usando IA. Genera fondos, estilos y composiciones perfectas para tu catálogo.',
    icon: Image,
    category: 'visual',
    status: 'available',
    features: ['Fondos automáticos', 'Múltiples estilos', 'Resolución HD', 'Batch processing'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'copywriting',
    title: 'Copywriting para Ecommerce',
    description: 'Genera textos persuasivos para productos, descripciones, emails y campañas publicitarias que convierten.',
    icon: PenTool,
    category: 'content',
    status: 'available',
    features: ['Descripciones de productos', 'Emails marketing', 'Ads copy', 'SEO optimized'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'video-scripts',
    title: 'Scripts para Videos de Productos',
    description: 'Crea guiones profesionales para videos promocionales, reviews y contenido social de tus productos.',
    icon: Video,
    category: 'content',
    status: 'coming_soon',
    features: ['Scripts personalizados', 'Múltiples formatos', 'Call-to-actions', 'Storytelling'],
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'brand-identity',
    title: 'Asistente de Identidad de Marca',
    description: 'Desarrolla y refina la identidad visual de tu marca con sugerencias de colores, tipografías y estilos.',
    icon: Palette,
    category: 'visual',
    status: 'beta',
    features: ['Paleta de colores', 'Tipografías', 'Logo concepts', 'Brand guidelines'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'seo-optimizer',
    title: 'Optimizador SEO',
    description: 'Mejora el SEO de tus productos y páginas con sugerencias de keywords, meta descriptions y contenido optimizado.',
    icon: Target,
    category: 'analytics',
    status: 'available',
    features: ['Keyword research', 'Meta optimization', 'Content suggestions', 'Competitor analysis'],
    color: 'from-yellow-500 to-amber-500'
  },
  {
    id: 'customer-insights',
    title: 'Análisis de Sentimientos',
    description: 'Analiza reviews, comentarios y feedback de clientes para entender mejor las necesidades del mercado.',
    icon: Brain,
    category: 'analytics',
    status: 'coming_soon',
    features: ['Sentiment analysis', 'Trend detection', 'Customer feedback', 'Market insights'],
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'pricing-optimizer',
    title: 'Optimizador de Precios',
    description: 'Encuentra el precio óptimo para tus productos basado en análisis de mercado y competencia.',
    icon: TrendingUp,
    category: 'analytics',
    status: 'beta',
    features: ['Market analysis', 'Competitor pricing', 'Demand forecasting', 'Profit optimization'],
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'chatbot-builder',
    title: 'Constructor de Chatbots',
    description: 'Crea chatbots inteligentes para atención al cliente, ventas y soporte automatizado.',
    icon: MessageSquare,
    category: 'automation',
    status: 'coming_soon',
    features: ['Natural conversations', 'Multi-language', 'Integration ready', 'Analytics included'],
    color: 'from-rose-500 to-pink-500'
  },
  {
    id: 'website-builder',
    title: 'Website Builder con IA',
    description: 'Construye sitios web profesionales para tu ecommerce con plantillas inteligentes y diseño automático optimizado para conversiones.',
    icon: Globe,
    category: 'visual',
    status: 'available',
    features: ['Plantillas inteligentes', 'Diseño responsive', 'SEO automático', 'Optimización de conversiones', 'Integración con ecommerce'],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'logo-generator',
    title: 'Generador de Logos para Tiendas',
    description: 'Crea logos profesionales y únicos para tu tienda online usando IA. Genera múltiples opciones basadas en tu industria y preferencias de marca.',
    icon: Wand2,
    category: 'visual',
    status: 'available',
    features: ['Múltiples estilos', 'Personalización completa', 'Formatos vectoriales', 'Brand guidelines', 'Variaciones automáticas'],
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 'agent-builder',
    title: 'Constructor de Agentes',
    description: 'Crea agentes de IA personalizados para automatizar tareas específicas de tu ecommerce. Configura comportamientos, integraciones y flujos de trabajo inteligentes.',
    icon: Bot,
    category: 'automation',
    status: 'available',
    features: ['Agentes personalizados', 'Flujos de trabajo', 'Integraciones API', 'Aprendizaje automático', 'Automatización inteligente'],
    color: 'from-indigo-500 to-blue-500'
  }
];

const categories = [
  { id: 'all', name: 'Todas las Herramientas', icon: Sparkles },
  { id: 'content', name: 'Contenido', icon: FileText },
  { id: 'visual', name: 'Visual', icon: Image },
  { id: 'analytics', name: 'Analytics', icon: TrendingUp },
  { id: 'automation', name: 'Automatización', icon: Zap }
];

export default function StudioIAPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);
  const [showConfiguration, setShowConfiguration] = useState(false);

  const handleToolClick = (tool: AITool) => {
    // Mapear las herramientas a sus rutas correspondientes
    const toolRoutes: { [key: string]: string } = {
      'product-images': '/product-image-generator',
      'copywriting': '/copywriting',
      'pricing-optimizer': '/price-optimizer',
      'brand-identity': '/brand-identity',
      'website-builder': '/website-builder',
      'logo-generator': '/logo-generator',
      'agent-builder': '/agents'
    };

    const route = toolRoutes[tool.id];
    if (route) {
      navigate(route);
    } else {
      // Para herramientas que no tienen página aún, mostrar el modal
      setSelectedTool(tool);
    }
  };

  const filteredTools = selectedCategory === 'all' 
    ? aiTools 
    : aiTools.filter(tool => tool.category === selectedCategory);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/40">Disponible</Badge>;
      case 'beta':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40">Beta</Badge>;
      case 'coming_soon':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40">Próximamente</Badge>;
      default:
        return null;
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.icon : Sparkles;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 bg-clip-text text-transparent font-sans font-bold tracking-tight">
                Studio IA
              </span>
            </h1>
            <p className="text-muted-foreground">
              Herramientas de Inteligencia Artificial para potenciar tu ecommerce
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowConfiguration(true)}
            >
              <Settings className="w-4 h-4" />
              Configuración
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/40 text-blue-300 hover:from-blue-500/30 hover:to-cyan-500/30"
              onClick={() => setShowQuickActions(true)}
            >
              <ZapIcon className="w-4 h-4" />
              Acción Rápida
            </Button>
            <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Herramienta
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Herramientas Disponibles</p>
                  <p className="text-2xl font-bold text-green-400">5</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Desarrollo</p>
                  <p className="text-2xl font-bold text-yellow-400">3</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-full">
                  <Lightbulb className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Beta</p>
                  <p className="text-2xl font-bold text-blue-400">2</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Brain className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usos Este Mes</p>
                  <p className="text-2xl font-bold text-purple-400">1,247</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 ${
                      selectedCategory === category.id 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card 
                key={tool.id} 
                className="glass-card hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => handleToolClick(tool)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.color} bg-opacity-20`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {getStatusBadge(tool.status)}
                  </div>
                  <CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
                    {tool.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    {tool.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {tool.features.slice(0, 2).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 bg-purple-400 rounded-full" />
                        {feature}
                      </div>
                    ))}
                    {tool.features.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{tool.features.length - 2} más características
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {(() => {
                        const Icon = getCategoryIcon(tool.category);
                        return <Icon className="w-3 h-3" />;
                      })()}
                      {categories.find(cat => cat.id === tool.category)?.name}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="group-hover:bg-purple-500/20 group-hover:text-purple-400"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Modal de Acciones Rápidas */}
        <Dialog open={showQuickActions} onOpenChange={setShowQuickActions}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ZapIcon className="w-5 h-5 text-blue-400" />
                Acciones Rápidas
              </DialogTitle>
              <DialogDescription>
                Selecciona una acción rápida para comenzar inmediatamente
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Selección de Acción */}
              {!selectedQuickAction && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center gap-3 hover:bg-blue-500/10 hover:border-blue-500/40"
                    onClick={() => setSelectedQuickAction('generate-image')}
                  >
                    <Camera className="w-8 h-8 text-blue-400" />
                    <span className="font-medium">Generar Imagen</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center gap-3 hover:bg-green-500/10 hover:border-green-500/40"
                    onClick={() => setSelectedQuickAction('write-copy')}
                  >
                    <PenTool className="w-8 h-8 text-green-400" />
                    <span className="font-medium">Escribir Copy</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center gap-3 hover:bg-orange-500/10 hover:border-orange-500/40"
                    onClick={() => setSelectedQuickAction('optimize-seo')}
                  >
                    <Target className="w-8 h-8 text-orange-400" />
                    <span className="font-medium">Optimizar SEO</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center gap-3 hover:bg-violet-500/10 hover:border-violet-500/40"
                    onClick={() => setSelectedQuickAction('generate-logo')}
                  >
                    <Wand2 className="w-8 h-8 text-violet-400" />
                    <span className="font-medium">Generar Logo</span>
                  </Button>
                </div>
              )}

              {/* Dashboard de la Acción Seleccionada */}
              {selectedQuickAction && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {selectedQuickAction === 'generate-image' && 'Generador de Imágenes'}
                      {selectedQuickAction === 'write-copy' && 'Copywriting para Ecommerce'}
                      {selectedQuickAction === 'optimize-seo' && 'Optimizador SEO'}
                      {selectedQuickAction === 'generate-logo' && 'Generador de Logos para Tiendas'}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedQuickAction(null)}
                    >
                      ← Volver
                    </Button>
                  </div>

                  {/* Contenido específico según la acción */}
                  {selectedQuickAction === 'generate-image' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Descripción del producto</label>
                          <textarea 
                            className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white"
                            placeholder="Describe el producto que quieres generar..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Estilo</label>
                          <select className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white">
                            <option>Profesional</option>
                            <option>Minimalista</option>
                            <option>Lujo</option>
                            <option>Casual</option>
                          </select>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                        <Camera className="w-4 h-4 mr-2" />
                        Generar Imagen
                      </Button>
                    </div>
                  )}

                  {selectedQuickAction === 'write-copy' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Tipo de contenido</label>
                          <select className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white">
                            <option>Descripción de producto</option>
                            <option>Email marketing</option>
                            <option>Anuncio publicitario</option>
                            <option>Post en redes sociales</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Tono</label>
                          <select className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white">
                            <option>Profesional</option>
                            <option>Amigable</option>
                            <option>Persuasivo</option>
                            <option>Urgente</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Información del producto</label>
                        <textarea 
                          className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white"
                          placeholder="Describe tu producto, características, beneficios..."
                          rows={3}
                        />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                        <PenTool className="w-4 h-4 mr-2" />
                        Generar Copy
                      </Button>
                    </div>
                  )}

                  {selectedQuickAction === 'optimize-seo' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">URL o página</label>
                          <input 
                            type="text"
                            className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white"
                            placeholder="https://tu-tienda.com/producto"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Palabra clave principal</label>
                          <input 
                            type="text"
                            className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white"
                            placeholder="ej: zapatillas deportivas"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Descripción actual</label>
                        <textarea 
                          className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white"
                          placeholder="Pega aquí el contenido actual que quieres optimizar..."
                          rows={3}
                        />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                        <Target className="w-4 h-4 mr-2" />
                        Optimizar SEO
                      </Button>
                    </div>
                  )}

                  {selectedQuickAction === 'generate-logo' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Nombre de la tienda</label>
                          <input 
                            type="text"
                            className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white"
                            placeholder="ej: Mi Tienda Online"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Industria</label>
                          <select className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white">
                            <option>Moda y Ropa</option>
                            <option>Electrónicos</option>
                            <option>Hogar y Jardín</option>
                            <option>Salud y Belleza</option>
                            <option>Deportes</option>
                            <option>Alimentación</option>
                            <option>Otro</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Estilo de logo</label>
                          <select className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white">
                            <option>Minimalista</option>
                            <option>Moderno</option>
                            <option>Clásico</option>
                            <option>Creativo</option>
                            <option>Elegante</option>
                            <option>Casual</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Colores preferidos</label>
                          <div className="flex gap-2">
                            <input type="color" className="w-12 h-10 p-1 border rounded bg-gray-800/50 border-gray-600" defaultValue="#3B82F6" />
                            <input type="color" className="w-12 h-10 p-1 border rounded bg-gray-800/50 border-gray-600" defaultValue="#10B981" />
                            <input type="color" className="w-12 h-10 p-1 border rounded bg-gray-800/50 border-gray-600" defaultValue="#F59E0B" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Descripción adicional</label>
                        <textarea 
                          className="w-full p-3 border rounded-lg bg-gray-800/50 border-gray-600 text-white"
                          placeholder="Describe el tipo de logo que tienes en mente, elementos específicos, etc..."
                          rows={3}
                        />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generar Logo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Configuración */}
        <Dialog open={showConfiguration} onOpenChange={setShowConfiguration}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Configuración de Studio IA
              </DialogTitle>
              <DialogDescription>
                Personaliza las herramientas de IA según tus necesidades y preferencias
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="tools">Herramientas</TabsTrigger>
                <TabsTrigger value="api">API Keys</TabsTrigger>
                <TabsTrigger value="preferences">Preferencias</TabsTrigger>
              </TabsList>
              
              {/* Pestaña General */}
              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Configuración General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-save">Guardado Automático</Label>
                          <p className="text-sm text-muted-foreground">Guarda automáticamente tu trabajo</p>
                        </div>
                        <Switch id="auto-save" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="notifications">Notificaciones</Label>
                          <p className="text-sm text-muted-foreground">Recibe notificaciones de progreso</p>
                        </div>
                        <Switch id="notifications" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="dark-mode">Modo Oscuro</Label>
                          <p className="text-sm text-muted-foreground">Usar tema oscuro por defecto</p>
                        </div>
                        <Switch id="dark-mode" defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Límites y Cuotas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="daily-limit">Límite Diario de Generaciones</Label>
                        <Select defaultValue="100">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">50 generaciones</SelectItem>
                            <SelectItem value="100">100 generaciones</SelectItem>
                            <SelectItem value="200">200 generaciones</SelectItem>
                            <SelectItem value="unlimited">Ilimitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="quality">Calidad por Defecto</Label>
                        <Select defaultValue="high">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Estándar</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Pestaña Herramientas */}
              <TabsContent value="tools" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuración de Herramientas</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Activa o desactiva herramientas específicas y configura sus parámetros
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {aiTools.map((tool) => (
                      <div key={tool.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${tool.color}`}>
                              <tool.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium">{tool.title}</h3>
                              <p className="text-sm text-muted-foreground">{tool.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={tool.status === 'available' ? 'default' : tool.status === 'beta' ? 'secondary' : 'outline'}>
                              {tool.status === 'available' ? 'Disponible' : tool.status === 'beta' ? 'Beta' : 'Próximamente'}
                            </Badge>
                            <Switch defaultChecked={tool.status === 'available'} disabled={tool.status === 'coming_soon'} />
                          </div>
                        </div>
                        
                        {tool.status === 'available' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                            <div>
                              <Label htmlFor={`${tool.id}-quality`}>Calidad de Salida</Label>
                              <Select defaultValue="high">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Estándar</SelectItem>
                                  <SelectItem value="high">Alta</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`${tool.id}-style`}>Estilo por Defecto</Label>
                              <Input 
                                id={`${tool.id}-style`}
                                placeholder="Estilo personalizado..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Pestaña API Keys */}
              <TabsContent value="api" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">OpenAI API</CardTitle>
                      <p className="text-sm text-muted-foreground">Para herramientas de texto y análisis</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="openai-key">API Key</Label>
                        <Input 
                          id="openai-key"
                          type="password"
                          placeholder="sk-..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="openai-model">Modelo</Label>
                        <Select defaultValue="gpt-4">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">DALL-E API</CardTitle>
                      <p className="text-sm text-muted-foreground">Para generación de imágenes</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="dalle-key">API Key</Label>
                        <Input 
                          id="dalle-key"
                          type="password"
                          placeholder="sk-..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="dalle-size">Tamaño por Defecto</Label>
                        <Select defaultValue="1024x1024">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="256x256">256x256</SelectItem>
                            <SelectItem value="512x512">512x512</SelectItem>
                            <SelectItem value="1024x1024">1024x1024</SelectItem>
                            <SelectItem value="1792x1024">1792x1024</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Anthropic Claude</CardTitle>
                      <p className="text-sm text-muted-foreground">Para análisis avanzado y copywriting</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="claude-key">API Key</Label>
                        <Input 
                          id="claude-key"
                          type="password"
                          placeholder="sk-ant-..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Google Analytics</CardTitle>
                      <p className="text-sm text-muted-foreground">Para análisis de rendimiento</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="ga-key">API Key</Label>
                        <Input 
                          id="ga-key"
                          type="password"
                          placeholder="AIza..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="ga-property">Property ID</Label>
                        <Input 
                          id="ga-property"
                          placeholder="123456789"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Pestaña Preferencias */}
              <TabsContent value="preferences" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preferencias de Idioma</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="language">Idioma Principal</Label>
                        <Select defaultValue="es">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="pt">Português</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="tone">Tono por Defecto</Label>
                        <Select defaultValue="professional">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Profesional</SelectItem>
                            <SelectItem value="friendly">Amigable</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preferencias de Marca</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="brand-name">Nombre de Marca</Label>
                        <Input 
                          id="brand-name"
                          placeholder="Tu marca..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="brand-description">Descripción de Marca</Label>
                        <Textarea 
                          id="brand-description"
                          placeholder="Describe tu marca, valores, público objetivo..."
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="brand-colors">Colores de Marca</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="color"
                            className="w-12 h-10 p-1 border rounded"
                            defaultValue="#3B82F6"
                          />
                          <Input 
                            type="color"
                            className="w-12 h-10 p-1 border rounded"
                            defaultValue="#10B981"
                          />
                          <Input 
                            type="color"
                            className="w-12 h-10 p-1 border rounded"
                            defaultValue="#F59E0B"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowConfiguration(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowConfiguration(false)}>
                Guardar Configuración
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
