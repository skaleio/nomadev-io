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
  Palette, 
  Download, 
  RefreshCw, 
  Settings, 
  Wand2,
  Sparkles,
  ArrowLeft,
  Eye,
  Share2,
  Heart,
  Copy,
  AlertCircle,
  Lightbulb,
  Trash2,
  Image as ImageIcon,
  Type,
  Shapes
} from "lucide-react";
import { OpenAIService, getOpenAIConfig, saveOpenAIConfig } from "@/lib/openai-api";

export default function LogoGeneratorPage() {
  const [storeName, setStoreName] = useState('');
  const [industry, setIndustry] = useState('general');
  const [logoStyle, setLogoStyle] = useState('modern');
  const [preferredColors, setPreferredColors] = useState('');
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [generatedLogos, setGeneratedLogos] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<any>(null);
  const [openaiConfig, setOpenaiConfig] = useState(getOpenAIConfig());
  const [error, setError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempModel, setTempModel] = useState('gpt-3.5-turbo');
  const [showClearModal, setShowClearModal] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const industries = [
    { value: 'general', label: 'General', description: 'Negocio general' },
    { value: 'fashion', label: 'Moda', description: 'Ropa y accesorios' },
    { value: 'food', label: 'Alimentación', description: 'Restaurantes y comida' },
    { value: 'tech', label: 'Tecnología', description: 'Software y hardware' },
    { value: 'health', label: 'Salud', description: 'Medicina y bienestar' },
    { value: 'beauty', label: 'Belleza', description: 'Cosméticos y cuidado' },
    { value: 'sports', label: 'Deportes', description: 'Fitness y deportes' },
    { value: 'education', label: 'Educación', description: 'Escuelas y cursos' },
    { value: 'finance', label: 'Finanzas', description: 'Bancos y seguros' },
    { value: 'real-estate', label: 'Inmobiliaria', description: 'Propiedades' }
  ];

  const logoStyles = [
    { value: 'modern', label: 'Moderno', description: 'Diseño contemporáneo y limpio' },
    { value: 'classic', label: 'Clásico', description: 'Estilo tradicional y elegante' },
    { value: 'minimalist', label: 'Minimalista', description: 'Simple y esencial' },
    { value: 'playful', label: 'Divertido', description: 'Colorido y amigable' },
    { value: 'luxury', label: 'Lujo', description: 'Premium y sofisticado' },
    { value: 'vintage', label: 'Vintage', description: 'Estilo retro y nostálgico' },
    { value: 'corporate', label: 'Corporativo', description: 'Profesional y serio' },
    { value: 'creative', label: 'Creativo', description: 'Artístico y único' }
  ];

  const handleGenerate = async () => {
    if (!storeName.trim()) {
      setError('Por favor, ingresa el nombre de tu tienda');
      return;
    }

    if (!openaiConfig) {
      setError('OpenAI no está configurado. Por favor, configura tu API key.');
      setShowConfigModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const openaiService = new OpenAIService(openaiConfig);
      
      // Generar descripción detallada del logo
      const logoDescription = await generateLogoDescription();
      
      // Simular generación de logos (en una implementación real, esto sería con DALL-E o un servicio de diseño)
      setTimeout(() => {
        const industryData = industries.find(i => i.value === industry);
        const styleData = logoStyles.find(s => s.value === logoStyle);
        
        const newLogos = Array.from({ length: 4 }, (_, i) => ({
          id: Date.now() + i,
          url: `https://picsum.photos/400/400?random=${Date.now() + i}`, // Placeholder - en producción sería DALL-E
          storeName: storeName,
          industry: industry,
          industryLabel: industryData?.label || industry,
          logoStyle: logoStyle,
          styleLabel: styleData?.label || logoStyle,
          preferredColors: preferredColors,
          description: logoDescription,
          createdAt: new Date()
        }));
        
        setGeneratedLogos(prev => [...newLogos, ...prev]);
        setIsGenerating(false);
      }, 3000);
    } catch (error) {
      console.error('Error generating logos:', error);
      setError(error instanceof Error ? error.message : 'Error al generar logos');
      setIsGenerating(false);
    }
  };

  const generateLogoDescription = async (): Promise<string> => {
    if (!openaiConfig) return '';

    try {
      const openaiService = new OpenAIService(openaiConfig);
      
      const request = {
        contentType: 'product-description',
        tone: 'professional',
        targetAudience: 'general',
        productInfo: `Logo para tienda: ${storeName}. Industria: ${industry}. Estilo: ${logoStyle}. Colores preferidos: ${preferredColors || 'sin preferencia'}. ${additionalDescription}`,
        keywords: `${industry}, ${logoStyle}, logo design, branding`
      };

      const response = await openaiService.generateCopywriting(request);
      return response.content;
    } catch (error) {
      console.error('Error generating description:', error);
      return '';
    }
  };

  const generateEnhancedDescription = async () => {
    if (!storeName.trim()) {
      setError('Por favor, ingresa el nombre de tu tienda primero');
      return;
    }

    if (!openaiConfig) {
      setError('OpenAI no está configurado. Por favor, configura tu API key.');
      setShowConfigModal(true);
      return;
    }

    setIsGeneratingDescription(true);
    setError(null);

    try {
      const openaiService = new OpenAIService(openaiConfig);
      
      const request = {
        contentType: 'product-description',
        tone: 'professional',
        targetAudience: 'general',
        productInfo: `Necesito una descripción detallada para generar un logo para mi tienda "${storeName}" en la industria ${industry} con estilo ${logoStyle}. ${preferredColors ? `Colores preferidos: ${preferredColors}.` : ''} ${additionalDescription}`,
        keywords: `logo design, branding, ${industry}, ${logoStyle}`
      };

      const response = await openaiService.generateCopywriting(request);
      setAdditionalDescription(response.content);
    } catch (error) {
      console.error('Error generating enhanced description:', error);
      setError(error instanceof Error ? error.message : 'Error al generar descripción mejorada');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleDownload = (logo: any) => {
    // Simular descarga
    const link = document.createElement('a');
    link.href = logo.url;
    link.download = `logo-${logo.storeName}-${logo.id}.png`;
    link.click();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Funciones para manejar configuración de OpenAI
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
    setGeneratedLogos([]);
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
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                Generador de Logo para Tiendas
              </h1>
              <p className="text-muted-foreground">
                Crea logos profesionales y únicos para tu tienda con IA
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
            {generatedLogos.length > 0 && (
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
                  Configuración del Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="store-name">Nombre de la Tienda *</Label>
                  <Input
                    id="store-name"
                    placeholder="Ej: Mi Tienda Online"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industria</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          <div>
                            <div className="font-medium">{ind.label}</div>
                            <div className="text-xs text-muted-foreground">{ind.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="logo-style">Estilo del Logo</Label>
                  <Select value={logoStyle} onValueChange={setLogoStyle}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {logoStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div>
                            <div className="font-medium">{style.label}</div>
                            <div className="text-xs text-muted-foreground">{style.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="colors">Colores Preferidos (opcional)</Label>
                  <Input
                    id="colors"
                    placeholder="Ej: Azul, Blanco, Negro"
                    value={preferredColors}
                    onChange={(e) => setPreferredColors(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="description">Descripción Adicional</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateEnhancedDescription}
                      disabled={!storeName.trim() || isGeneratingDescription || !openaiConfig}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950"
                    >
                      {isGeneratingDescription ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Mejorando...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-3 h-3" />
                          Mejorar con IA
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Describe elementos específicos que quieres en tu logo, valores de marca, etc..."
                    value={additionalDescription}
                    onChange={(e) => setAdditionalDescription(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                  {openaiConfig && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Deja en blanco o usa "Mejorar con IA" para obtener una descripción profesional
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={!storeName.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generando Logos...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generar Logos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
                {generatedLogos.length === 0 ? (
                  <Card className="h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Palette className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay logos generados</h3>
                        <p className="text-muted-foreground">
                          Configura los parámetros y genera tu primer logo
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {generatedLogos.map((logo) => (
                      <Card key={logo.id} className="overflow-hidden">
                        <div className="aspect-square relative group">
                          <img 
                            src={logo.url} 
                            alt={`Logo para ${logo.storeName}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setSelectedLogo(logo)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleDownload(logo)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <p className="font-medium truncate">{logo.storeName}</p>
                              <p className="text-muted-foreground text-xs">
                                {logo.industryLabel} • {logo.styleLabel}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost">
                              <Heart className="w-4 h-4" />
                            </Button>
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
        {selectedLogo && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Vista Previa del Logo</h3>
                <Button variant="ghost" onClick={() => setSelectedLogo(null)}>
                  ×
                </Button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img 
                      src={selectedLogo.url} 
                      alt="Preview"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Detalles del Logo</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Tienda:</strong> {selectedLogo.storeName}</div>
                        <div><strong>Industria:</strong> {selectedLogo.industryLabel}</div>
                        <div><strong>Estilo:</strong> {selectedLogo.styleLabel}</div>
                        {selectedLogo.preferredColors && (
                          <div><strong>Colores:</strong> {selectedLogo.preferredColors}</div>
                        )}
                        <div><strong>Generado:</strong> {selectedLogo.createdAt.toLocaleString()}</div>
                      </div>
                    </div>
                    {selectedLogo.description && (
                      <div>
                        <h4 className="font-medium mb-2">Descripción</h4>
                        <p className="text-sm text-muted-foreground">{selectedLogo.description}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={() => handleDownload(selectedLogo)} className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                      <Button variant="outline" onClick={() => handleCopy(selectedLogo.description)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Descripción
                      </Button>
                    </div>
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
                          Se eliminarán permanentemente <span className="font-semibold">{generatedLogos.length} logo{generatedLogos.length !== 1 ? 's' : ''}</span> generado{generatedLogos.length !== 1 ? 's' : ''}. 
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
