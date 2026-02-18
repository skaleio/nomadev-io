import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  ArrowLeft,
  DollarSign,
  Users,
  BarChart3,
  Activity,
  CheckCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  }
];

const categories = [
  { id: 'all', name: 'Todas las Herramientas', icon: Sparkles },
  { id: 'content', name: 'Contenido', icon: FileText },
  { id: 'visual', name: 'Visual', icon: Image },
  { id: 'analytics', name: 'Analytics', icon: TrendingUp },
  { id: 'automation', name: 'Automatización', icon: Zap }
];

const StudioIADemo = () => {
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
      'website-builder': '/website-builder'
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
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="fixed top-0 right-0 left-64 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-30">
        <div className="flex items-center h-full px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/interactive-demo')}
              className="text-muted-foreground hover:text-foreground"
              title="Volver al Demo"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div
              className="text-2xl font-black text-emerald-600 transition-all duration-300 cursor-pointer tracking-wider uppercase animate-bounce"
              style={{
                fontFamily: "'Orbitron', 'Arial Black', sans-serif",
                fontWeight: 900,
                letterSpacing: '0.15em',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                transform: 'skew(-3deg)',
                display: 'inline-block',
                filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))',
                animation: 'bounce 2s infinite, glow 3s ease-in-out infinite alternate'
              }}
            >
              NOMADEV.IO
            </div>
          </div>

          <div className="flex items-center gap-3 w-80 justify-end">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Demo:</span>
              <span className="font-medium">Studio IA</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 ml-64 min-h-screen">
        <div className="p-6">
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
                    <Sparkles className="h-8 w-8 text-emerald-500" />
                    Studio IA
                  </h1>
                  <p className="text-muted-foreground">Herramientas de Inteligencia Artificial para potenciar tu ecommerce</p>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Demo Interactivo
                </Badge>
              </div>
            </div>

            {/* Filtros de Categorías */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 ${
                      selectedCategory === category.id 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>

            {/* Grid de Herramientas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <Card 
                    key={tool.id} 
                    className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/40 rounded-xl hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/15 transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => handleToolClick(tool)}
                  >
                    {/* Efecto de brillo sutil */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-emerald-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <CardContent className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.color} bg-opacity-20`}>
                          <IconComponent className={`h-6 w-6 ${tool.color.includes('purple') ? 'text-purple-500' : 
                            tool.color.includes('blue') ? 'text-blue-500' : 
                            tool.color.includes('green') ? 'text-green-500' : 
                            tool.color.includes('yellow') ? 'text-yellow-500' : 
                            tool.color.includes('red') ? 'text-red-500' : 
                            tool.color.includes('indigo') ? 'text-indigo-500' : 
                            tool.color.includes('rose') ? 'text-rose-500' : 
                            tool.color.includes('cyan') ? 'text-cyan-500' : 'text-gray-500'}`} />
                        </div>
                        {getStatusBadge(tool.status)}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-200 mb-2 group-hover:text-emerald-300 transition-colors">
                        {tool.title}
                      </h3>
                      
                      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                        {tool.description}
                      </p>
                      
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wide">Características:</h4>
                        <div className="flex flex-wrap gap-1">
                          {tool.features.slice(0, 3).map((feature, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs border-gray-600 text-gray-400 bg-gray-800/50"
                            >
                              {feature}
                            </Badge>
                          ))}
                          {tool.features.length > 3 && (
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400 bg-gray-800/50">
                              +{tool.features.length - 3} más
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center text-emerald-400 text-sm font-medium group-hover:text-emerald-300 transition-colors">
                        {tool.status === 'available' ? 'Usar herramienta' : 'Próximamente'}
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Estadísticas de IA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-emerald-500 mb-2">95%</div>
                  <p className="text-muted-foreground">Reducción en tiempo de creación</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-2">300%</div>
                  <p className="text-muted-foreground">Aumento en conversiones</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-2">24/7</div>
                  <p className="text-muted-foreground">Disponibilidad de herramientas</p>
                </CardContent>
              </Card>
            </div>

            {/* Información del Demo */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Sparkles className="h-5 w-5 text-emerald-500 mr-2" />
                  Demo Interactivo - Studio IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Esta es una demostración del Studio IA de NOMADEV.IO. 
                    Descubre cómo la Inteligencia Artificial puede revolucionar tu ecommerce.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-500/10 rounded-lg">
                      <h3 className="font-semibold text-emerald-400 mb-2">Herramientas Disponibles</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Generador de Imágenes de Productos</li>
                        <li>• Copywriting para Ecommerce</li>
                        <li>• Optimizador SEO</li>
                        <li>• Website Builder con IA</li>
                        <li>• Asistente de Identidad de Marca</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg">
                      <h3 className="font-semibold text-blue-400 mb-2">Beneficios Clave</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 95% reducción en tiempo de creación</li>
                        <li>• 300% aumento en conversiones</li>
                        <li>• Herramientas disponibles 24/7</li>
                        <li>• Integración completa con ecommerce</li>
                        <li>• Optimización automática de contenido</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => navigate('/interactive-demo')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver al Demo Principal
                    </Button>
                    <Button 
                      onClick={() => navigate('/studio-ia')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Ver Studio IA Real
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudioIADemo;