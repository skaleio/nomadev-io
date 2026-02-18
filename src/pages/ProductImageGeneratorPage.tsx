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
  Image, 
  Download, 
  RefreshCw, 
  Settings, 
  Camera,
  Wand2,
  Sparkles,
  ArrowLeft,
  Eye,
  Share2,
  Heart,
  Copy,
  Upload,
  X,
  AlertCircle,
  Lightbulb,
  Trash2
} from "lucide-react";
import { OpenAIService, getOpenAIConfig, saveOpenAIConfig } from "@/lib/openai-api";
import { DalleService, getDalleConfig, type ImageGenerationRequest } from "@/lib/dalle-api";

export default function ProductImageGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('professional');
  const [background, setBackground] = useState('white');
  const [lighting, setLighting] = useState('studio');
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [openaiConfig, setOpenaiConfig] = useState(getOpenAIConfig());
  const [error, setError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempModel, setTempModel] = useState('gpt-3.5-turbo');
  const [showClearModal, setShowClearModal] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const styles = [
    { value: 'professional', label: 'Profesional', description: 'Estilo limpio y corporativo' },
    { value: 'minimalist', label: 'Minimalista', description: 'Diseño simple y elegante' },
    { value: 'luxury', label: 'Lujo', description: 'Aspecto premium y sofisticado' },
    { value: 'casual', label: 'Casual', description: 'Estilo relajado y amigable' },
    { value: 'vintage', label: 'Vintage', description: 'Estilo retro y nostálgico' },
    { value: 'modern', label: 'Moderno', description: 'Diseño contemporáneo' }
  ];

  const backgrounds = [
    { value: 'white', label: 'Blanco', description: 'Fondo blanco limpio' },
    { value: 'transparent', label: 'Transparente', description: 'Sin fondo' },
    { value: 'gradient', label: 'Gradiente', description: 'Fondo con gradiente' },
    { value: 'texture', label: 'Textura', description: 'Fondo con textura' },
    { value: 'lifestyle', label: 'Lifestyle', description: 'Ambiente realista' }
  ];

  const lightingOptions = [
    { value: 'studio', label: 'Estudio', description: 'Iluminación profesional' },
    { value: 'natural', label: 'Natural', description: 'Luz natural' },
    { value: 'dramatic', label: 'Dramática', description: 'Contraste alto' },
    { value: 'soft', label: 'Suave', description: 'Iluminación suave' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Verificar si DALL-E está configurado
    const dalleConfig = getDalleConfig();
    if (!dalleConfig) {
      setError('OpenAI no está configurado. Por favor, configura tu API key para generar imágenes reales.');
      setShowConfigModal(true);
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const dalleService = new DalleService(dalleConfig);
      
      const request: ImageGenerationRequest = {
        prompt: prompt,
        style: style,
        background: background,
        lighting: lighting,
        referenceImage: referenceImage || undefined,
        size: '1024x1024',
        quality: 'standard',
        n: 4
      };
      
      const response = await dalleService.generateImages(request);
      
      // Convertir respuesta de DALL-E al formato esperado
      const newImages = response.images.map((img, i) => ({
        id: Date.now() + i,
        url: img.url,
        prompt: prompt,
        style: style,
        background: background,
        lighting: lighting,
        hasReference: !!referenceImage,
        referenceImage: referenceImage?.name || null,
        revisedPrompt: img.revised_prompt,
        createdAt: new Date()
      }));
      
      setGeneratedImages(prev => [...newImages, ...prev]);
    } catch (error) {
      console.error('Error generating images:', error);
      setError(error instanceof Error ? error.message : 'Error al generar imágenes. Verifica tu API key de OpenAI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (image: any) => {
    // Simular descarga
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `product-image-${image.id}.jpg`;
    link.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 10MB');
        return;
      }

      setReferenceImage(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setReferenceImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview(null);
  };

  // Función para generar prompt mejorado con IA
  const generateEnhancedPrompt = async () => {
    if (!prompt.trim()) {
      setError('Por favor, escribe una descripción básica del producto primero');
      return;
    }

    if (!openaiConfig) {
      setError('OpenAI no está configurado. Por favor, configura tu API key.');
      setShowConfigModal(true);
      return;
    }

    setIsGeneratingPrompt(true);
    setError(null);

    try {
      const openaiService = new OpenAIService(openaiConfig);
      
      const enhancedPromptRequest = {
        contentType: 'product-description',
        tone: 'professional',
        targetAudience: 'general',
        productInfo: prompt,
        keywords: `${style}, ${background}, ${lighting}`
      };

      const response = await openaiService.generateCopywriting(enhancedPromptRequest);
      
      // Extraer solo la descripción mejorada del contenido generado
      const enhancedDescription = response.content;
      setPrompt(enhancedDescription);
      
    } catch (error) {
      console.error('Error generating enhanced prompt:', error);
      setError(error instanceof Error ? error.message : 'Error al generar descripción mejorada');
    } finally {
      setIsGeneratingPrompt(false);
    }
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
    setGeneratedImages([]);
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
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                  <Image className="w-6 h-6 text-white" />
                </div>
                Generador de Imágenes de Productos
              </h1>
              <p className="text-muted-foreground">
                Crea imágenes profesionales de productos usando IA
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
            {generatedImages.length > 0 && (
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
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="prompt">Descripción del Producto</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateEnhancedPrompt}
                      disabled={!prompt.trim() || isGeneratingPrompt || !openaiConfig}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950"
                    >
                      {isGeneratingPrompt ? (
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
                    id="prompt"
                    placeholder="Describe el producto que quieres generar... Ej: Camiseta de algodón azul marino, logo en el pecho, modelo casual..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                  {openaiConfig && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Escribe una descripción básica y usa "Mejorar con IA" para obtener una descripción más detallada y profesional
                    </p>
                  )}
                </div>

                {/* Sección de Imagen de Referencia */}
                <div>
                  <Label>Imagen de Referencia (Opcional)</Label>
                  <div className="mt-2">
                    {!referenceImagePreview ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="reference-upload"
                        />
                        <label
                          htmlFor="reference-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="w-8 h-8 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Subir imagen de referencia</p>
                            <p className="text-xs text-gray-500">PNG, JPG hasta 10MB</p>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={referenceImagePreview}
                          alt="Reference preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={removeReferenceImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="mt-2 text-xs text-gray-500">
                          Imagen de referencia cargada
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="style">Estilo</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div>
                            <div className="font-medium">{s.label}</div>
                            <div className="text-xs text-muted-foreground">{s.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="background">Fondo</Label>
                  <Select value={background} onValueChange={setBackground}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backgrounds.map((bg) => (
                        <SelectItem key={bg.value} value={bg.value}>
                          <div>
                            <div className="font-medium">{bg.label}</div>
                            <div className="text-xs text-muted-foreground">{bg.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="lighting">Iluminación</Label>
                  <Select value={lighting} onValueChange={setLighting}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lightingOptions.map((light) => (
                        <SelectItem key={light.value} value={light.value}>
                          <div>
                            <div className="font-medium">{light.label}</div>
                            <div className="text-xs text-muted-foreground">{light.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generando con DALL-E...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generar Imágenes con IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
                {generatedImages.length === 0 ? (
                  <Card className="h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Camera className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay imágenes generadas</h3>
                        <p className="text-muted-foreground">
                          Configura los parámetros y genera tu primera imagen
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {generatedImages.map((image) => (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="aspect-square relative group">
                          <img 
                            src={image.url} 
                            alt="Generated product"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setSelectedImage(image)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleDownload(image)}>
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
                              <p className="font-medium truncate">{image.prompt}</p>
                              <p className="text-muted-foreground text-xs">
                                {image.style} • {image.background}
                                {image.hasReference && (
                                  <span className="ml-2 text-blue-500">• Con referencia</span>
                                )}
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
        {selectedImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Vista Previa</h3>
                <Button variant="ghost" onClick={() => setSelectedImage(null)}>
                  ×
                </Button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img 
                      src={selectedImage.url} 
                      alt="Preview"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Detalles</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Prompt original:</strong> {selectedImage.prompt}</div>
                        {selectedImage.revisedPrompt && (
                          <div><strong>Prompt optimizado por IA:</strong> {selectedImage.revisedPrompt}</div>
                        )}
                        <div><strong>Estilo:</strong> {selectedImage.style}</div>
                        <div><strong>Fondo:</strong> {selectedImage.background}</div>
                        <div><strong>Iluminación:</strong> {selectedImage.lighting}</div>
                        {selectedImage.hasReference && (
                          <div><strong>Imagen de referencia:</strong> {selectedImage.referenceImage}</div>
                        )}
                        <div><strong>Generado:</strong> {selectedImage.createdAt.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleDownload(selectedImage)} className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                      <Button variant="outline">
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
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
                          Se eliminarán permanentemente <span className="font-semibold">{generatedImages.length} imagen{generatedImages.length !== 1 ? 'es' : ''}</span> generada{generatedImages.length !== 1 ? 's' : ''}. 
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


