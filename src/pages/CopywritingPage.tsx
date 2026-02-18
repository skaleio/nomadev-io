import React, { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PenTool, 
  Download, 
  RefreshCw, 
  Settings, 
  Copy,
  Wand2,
  Sparkles,
  ArrowLeft,
  Eye,
  Share2,
  Heart,
  Mail,
  Megaphone,
  Hash,
  AlertCircle,
  Trash2,
  Lightbulb
} from "lucide-react";
import { OpenAIService, getOpenAIConfig, saveOpenAIConfig, type CopywritingRequest } from "@/lib/openai-api";

export default function CopywritingPage() {
  const [contentType, setContentType] = useState('product-description');
  const [tone, setTone] = useState('professional');
  const [targetAudience, setTargetAudience] = useState('general');
  const [productInfo, setProductInfo] = useState('');
  const [keywords, setKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [openaiConfig, setOpenaiConfig] = useState(() => {
    // Intentar obtener configuración del localStorage
    const config = getOpenAIConfig();
    if (config) {
      return config;
    }
    
    // Si no hay configuración, usar variable de entorno (nunca hardcodear API keys)
    const providedApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (providedApiKey) {
      const defaultConfig = {
        apiKey: providedApiKey,
        model: 'gpt-4'
      };
      saveOpenAIConfig(defaultConfig);
      return defaultConfig;
    }
    
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempModel, setTempModel] = useState('gpt-3.5-turbo');
  const [showClearModal, setShowClearModal] = useState(false);

  const contentTypes = [
    { 
      value: 'product-description', 
      label: 'Descripción de Producto', 
      description: 'Descripciones atractivas para catálogos',
      icon: PenTool
    },
    { 
      value: 'email-marketing', 
      label: 'Email Marketing', 
      description: 'Emails promocionales y newsletters',
      icon: Mail
    },
    { 
      value: 'ad-copy', 
      label: 'Anuncio Publicitario', 
      description: 'Copy para Google Ads, Facebook, etc.',
      icon: Megaphone
    },
    { 
      value: 'social-media', 
      label: 'Redes Sociales', 
      description: 'Posts para Instagram, Facebook, Twitter',
      icon: Hash
    },
    { 
      value: 'landing-page', 
      label: 'Landing Page', 
      description: 'Contenido para páginas de aterrizaje',
      icon: PenTool
    },
    { 
      value: 'product-title', 
      label: 'Títulos de Producto', 
      description: 'Títulos optimizados para SEO',
      icon: Hash
    }
  ];

  const tones = [
    { value: 'professional', label: 'Profesional', description: 'Formal y confiable' },
    { value: 'friendly', label: 'Amigable', description: 'Cercano y accesible' },
    { value: 'persuasive', label: 'Persuasivo', description: 'Convincente y directo' },
    { value: 'urgent', label: 'Urgente', description: 'Crea sensación de escasez' },
    { value: 'luxury', label: 'Lujo', description: 'Exclusivo y premium' },
    { value: 'casual', label: 'Casual', description: 'Relajado y natural' }
  ];

  const audiences = [
    { value: 'general', label: 'General', description: 'Público amplio' },
    { value: 'young-adults', label: 'Jóvenes Adultos', description: '18-35 años' },
    { value: 'professionals', label: 'Profesionales', description: 'Ejecutivos y empresarios' },
    { value: 'parents', label: 'Padres', description: 'Familias con hijos' },
    { value: 'seniors', label: 'Adultos Mayores', description: '50+ años' },
    { value: 'tech-savvy', label: 'Tech-Savvy', description: 'Amantes de la tecnología' }
  ];

  const handleGenerate = async () => {
    if (!productInfo.trim()) return;
    
    // Verificar si OpenAI está configurado
    if (!openaiConfig) {
      setError('OpenAI no está configurado. Por favor, configura tu API key en Configuración.');
      setShowConfigModal(true);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const openaiService = new OpenAIService(openaiConfig);
      
      const request: CopywritingRequest = {
        contentType,
        tone,
        targetAudience,
        productInfo,
        keywords: keywords || undefined,
      };
      
      const response = await openaiService.generateCopywriting(request);
      
      const contentTypeData = contentTypes.find(ct => ct.value === contentType);
      const toneData = tones.find(t => t.value === tone);
      const audienceData = audiences.find(a => a.value === targetAudience);
      
      // Crear título dinámico basado en el tipo de contenido y producto
      const getProductName = (text: string) => {
        // Extraer las primeras palabras significativas del producto
        const words = text.split(' ').filter(word => word.length > 2);
        return words.slice(0, 3).join(' ');
      };
      
      const productName = getProductName(productInfo);
      const dynamicTitle = `${contentTypeData?.label || contentType} - ${productName}`;
      
      const newContent = {
        id: Date.now(),
        type: contentType,
        typeLabel: contentTypeData?.label || contentType,
        dynamicTitle: dynamicTitle,
        tone: tone,
        toneLabel: toneData?.label || tone,
        audience: targetAudience,
        audienceLabel: audienceData?.label || targetAudience,
        productInfo: productInfo,
        keywords: keywords,
        content: response.content,
        metadata: response.metadata,
        createdAt: new Date()
      };
      
      setGeneratedContent(prev => [newContent, ...prev]);
    } catch (error) {
      console.error('Error generating content:', error);
      setError(error instanceof Error ? error.message : 'Error al generar contenido');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprovePrompt = async () => {
    if (!productInfo.trim()) {
      setError('Por favor, describe tu producto primero');
      return;
    }

    // Verificar si OpenAI está configurado
    if (!openaiConfig) {
      setError('OpenAI no está configurado. Por favor, configura tu API key en Configuración.');
      setShowConfigModal(true);
      return;
    }

    setIsGeneratingPrompt(true);
    setError(null);

    try {
      const openaiService = new OpenAIService(openaiConfig);
      
      const improvementPrompt = `Mejora y expande la siguiente descripción de producto para hacerla más atractiva y persuasiva para copywriting. Mantén la información original pero hazla más detallada, convincente y orientada a ventas:

Producto original: "${productInfo}"

Por favor, proporciona una versión mejorada que incluya:
- Características más detalladas
- Beneficios claros para el cliente
- Elementos persuasivos
- Lenguaje más atractivo

Responde solo con la descripción mejorada, sin explicaciones adicionales.`;

      const request: CopywritingRequest = {
        contentType: 'product-description',
        tone: 'persuasive',
        targetAudience: 'general',
        productInfo: improvementPrompt,
        keywords: keywords || undefined,
      };

      const response = await openaiService.generateCopywriting(request);
      setProductInfo(response.content);
    } catch (error) {
      console.error('Error mejorando prompt:', error);
      setError(error instanceof Error ? error.message : 'Error al mejorar la descripción');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const generateSampleContent = (type: string, tone: string, productInfo: string) => {
    const samples = {
      'product-description': {
        professional: `Descubre la excelencia en cada detalle. Este producto premium combina funcionalidad y diseño para ofrecerte una experiencia única. Fabricado con los más altos estándares de calidad, garantiza durabilidad y rendimiento excepcional.`,
        friendly: `¡Te va a encantar este producto! Es perfecto para tu día a día y te va a sorprender lo práctico que es. Lo hemos diseñado pensando en ti y en todas las cosas geniales que puedes hacer con él.`,
        persuasive: `¡No te quedes sin él! Este producto es exactamente lo que necesitas para transformar tu experiencia. Miles de clientes satisfechos ya lo tienen. ¿Y tú? ¡Actúa ahora!`,
        urgent: `¡Últimas unidades disponibles! Este producto se está agotando rápidamente. No pierdas la oportunidad de tenerlo. ¡Compra ahora antes de que sea demasiado tarde!`,
        luxury: `Experimenta el lujo en su máxima expresión. Este producto exclusivo redefine los estándares de elegancia y sofisticación. Para quienes buscan solo lo mejor.`,
        casual: `Este producto es genial, la verdad. Lo usas y ya no quieres soltarlo. Es cómodo, funciona perfecto y se ve increíble. ¿Qué más puedes pedir?`
      },
      'email-marketing': {
        professional: `Estimado cliente,\n\nNos complace presentarle nuestro nuevo producto que revolucionará su experiencia. Diseñado con la más alta tecnología y pensado en sus necesidades específicas.\n\nLe invitamos a conocer más detalles en nuestro sitio web.`,
        friendly: `¡Hola!\n\nTenemos algo increíble que contarte. Este nuevo producto va a cambiar tu forma de ver las cosas. Es súper fácil de usar y te va a encantar.\n\n¡Échale un vistazo y cuéntanos qué te parece!`,
        persuasive: `¡Oferta especial solo para ti!\n\nEste producto está causando sensación y no queremos que te lo pierdas. Miles de personas ya lo están disfrutando.\n\n¡Aprovecha esta oportunidad única!`,
        urgent: `¡Últimas horas de oferta!\n\nEste producto se está agotando y no queremos que te quedes sin él. La oferta termina pronto.\n\n¡Compra ahora!`,
        luxury: `Estimado cliente VIP,\n\nTenemos el honor de presentarle nuestro producto más exclusivo. Diseñado para personas como usted que buscan la excelencia en cada detalle.\n\nDescubra el lujo redefinido.`,
        casual: `¡Qué tal!\n\nMira lo que tenemos para ti. Este producto está genial y creemos que te va a gustar mucho. Es fácil de usar y funciona de maravilla.\n\n¡Échale un ojo!`
      }
    };
    
    return samples[type as keyof typeof samples]?.[tone as keyof typeof samples.product-description] || 
           `Contenido generado para ${type} con tono ${tone} sobre: ${productInfo}`;
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleSaveConfig = async () => {
    if (!tempApiKey.trim()) {
      setError('La API key es requerida');
      return;
    }

    const config = {
      apiKey: tempApiKey,
      model: tempModel,
    };

    try {
      const openaiService = new OpenAIService(config);
      const isValid = await openaiService.validateApiKey();
      
      if (!isValid) {
        setError('API key inválida. Por favor, verifica tu clave de OpenAI.');
        return;
      }

      saveOpenAIConfig(config);
      setOpenaiConfig(config);
      setShowConfigModal(false);
      setError(null);
      setTempApiKey('');
    } catch (error) {
      setError('Error al validar la API key. Por favor, inténtalo de nuevo.');
    }
  };

  const handleOpenConfig = () => {
    setTempApiKey(openaiConfig?.apiKey || '');
    setTempModel(openaiConfig?.model || 'gpt-3.5-turbo');
    setShowConfigModal(true);
  };

  const handleClearHistory = () => {
    setGeneratedContent([]);
    setShowClearModal(false);
    setError(null);
  };

  // Verificar API key automáticamente al cargar
  useEffect(() => {
    if (openaiConfig) {
      const verifyApiKey = async () => {
        try {
          const openaiService = new OpenAIService(openaiConfig);
          const isValid = await openaiService.validateApiKey();
          if (!isValid) {
            setError('API key de OpenAI inválida. Por favor, verifica tu configuración.');
          }
        } catch (error) {
          console.error('Error verificando API key:', error);
        }
      };
      
      verifyApiKey();
    }
  }, [openaiConfig]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.back()}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                  <PenTool className="w-6 h-6 text-white" />
                </div>
                Copywriting para Ecommerce
              </h1>
              <p className="text-muted-foreground">
                Genera textos persuasivos que convierten visitantes en clientes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenConfig}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {openaiConfig ? 'Configurado' : 'Configurar OpenAI'}
            </Button>
            {generatedContent.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar Historial
              </Button>
            )}
            <Badge className={openaiConfig ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"}>
              <Sparkles className="w-3 h-3 mr-1" />
              {openaiConfig ? 'Disponible' : 'Configuración Requerida'}
            </Badge>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Configuración */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="content-type">Tipo de Contenido</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">Tono</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div>
                            <div className="font-medium">{t.label}</div>
                            <div className="text-xs text-muted-foreground">{t.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audience">Audiencia Objetivo</Label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audiences.map((audience) => (
                        <SelectItem key={audience.value} value={audience.value}>
                          <div>
                            <div className="font-medium">{audience.label}</div>
                            <div className="text-xs text-muted-foreground">{audience.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="product-info">Información del Producto</Label>
                  <div className="mt-2 space-y-2">
                    <Textarea
                      id="product-info"
                      placeholder="Describe tu producto, características, beneficios, precio, etc..."
                      value={productInfo}
                      onChange={(e) => setProductInfo(e.target.value)}
                      rows={4}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleImprovePrompt}
                      disabled={isGeneratingPrompt || !productInfo.trim()}
                      className="w-full"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {isGeneratingPrompt ? 'Mejorando...' : 'Mejorar con IA'}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="keywords">Palabras Clave (opcional)</Label>
                  <Input
                    id="keywords"
                    placeholder="palabra1, palabra2, palabra3..."
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={!productInfo.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generar Copy
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
                {generatedContent.length === 0 ? (
                  <Card className="h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <PenTool className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay contenido generado</h3>
                        <p className="text-muted-foreground">
                          Configura los parámetros y genera tu primer copy
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {generatedContent.map((content) => (
                      <Card key={content.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{content.dynamicTitle || content.typeLabel}</CardTitle>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{content.toneLabel}</Badge>
                                <Badge variant="outline">{content.audienceLabel}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedContent(content)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleCopy(content.content)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Heart className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <pre className="whitespace-pre-wrap text-sm">{content.content}</pre>
                          </div>
                          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                            <span>Generado: {content.createdAt.toLocaleString()}</span>
                            <span>{content.content.length} caracteres</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Modal de Vista Previa */}
        {selectedContent && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">{selectedContent.dynamicTitle || 'Vista Previa del Copy'}</h3>
                <Button variant="ghost" onClick={() => setSelectedContent(null)}>
                  ×
                </Button>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedContent.typeLabel}</Badge>
                    <Badge variant="outline">{selectedContent.toneLabel}</Badge>
                    <Badge variant="outline">{selectedContent.audienceLabel}</Badge>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-6">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">{selectedContent.content}</pre>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleCopy(selectedContent.content)} className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar al Portapapeles
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Configuración de OpenAI */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Configurar OpenAI</h3>
                <Button variant="ghost" onClick={() => setShowConfigModal(false)}>
                  ×
                </Button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="api-key">API Key de OpenAI</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Obtén tu API key en <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com</a>
                  </p>
                </div>
                <div>
                  <Label htmlFor="model">Modelo</Label>
                  <Select value={tempModel} onValueChange={setTempModel}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveConfig} className="flex-1">
                    Guardar Configuración
                  </Button>
                  <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación para Limpiar Historial */}
        {showClearModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-xl max-w-md w-full shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
              {/* Header con gradiente */}
              <div className="relative p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                      <Trash2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Limpiar Historial</h3>
                      <p className="text-sm text-muted-foreground">Acción destructiva</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowClearModal(false)}
                    className="h-8 w-8 p-0 hover:bg-muted/50 rounded-full"
                  >
                    <span className="sr-only">Cerrar</span>
                    ×
                  </Button>
                </div>
              </div>

              {/* Contenido principal */}
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  {/* Mensaje de advertencia */}
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/50 flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-red-900 dark:text-red-100">
                          ¿Estás completamente seguro?
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                          Se eliminarán permanentemente <span className="font-semibold">{generatedContent.length} contenido{generatedContent.length !== 1 ? 's' : ''}</span> generado{generatedContent.length !== 1 ? 's' : ''}. 
                          <br />
                          <span className="font-medium">Esta acción no se puede deshacer.</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={handleClearHistory} 
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-red-500/25 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Sí, Eliminar Todo
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowClearModal(false)}
                      className="px-6 border-2 hover:bg-muted/50 font-semibold transition-all duration-200"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


