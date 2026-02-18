import React, { useState } from 'react';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
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
  Layout,
  Palette,
  Type,
  Smartphone,
  Monitor,
  Tablet,
  Code,
  Image,
  ShoppingCart
} from "lucide-react";

export default function WebsiteBuilderPage() {
  const [websiteName, setWebsiteName] = useState('');
  const [businessType, setBusinessType] = useState('ecommerce');
  const [targetAudience, setTargetAudience] = useState('general');
  const [colorScheme, setColorScheme] = useState('modern');
  const [layoutStyle, setLayoutStyle] = useState('clean');
  const [features, setFeatures] = useState<string[]>([]);
  const [generatedWebsites, setGeneratedWebsites] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<any>(null);

  const businessTypes = [
    { value: 'ecommerce', label: 'E-commerce', description: 'Tienda online', icon: ShoppingCart },
    { value: 'portfolio', label: 'Portfolio', description: 'Mostrar trabajos', icon: Image },
    { value: 'blog', label: 'Blog', description: 'Contenido y artículos', icon: Type },
    { value: 'corporate', label: 'Corporativo', description: 'Empresa y servicios', icon: Monitor },
    { value: 'restaurant', label: 'Restaurante', description: 'Menú y reservas', icon: Palette },
    { value: 'fitness', label: 'Fitness', description: 'Gimnasio y entrenamientos', icon: Layout }
  ];

  const audiences = [
    { value: 'general', label: 'General', description: 'Público amplio' },
    { value: 'young-adults', label: 'Jóvenes Adultos', description: '18-35 años' },
    { value: 'professionals', label: 'Profesionales', description: 'Ejecutivos y empresarios' },
    { value: 'families', label: 'Familias', description: 'Padres con hijos' },
    { value: 'seniors', label: 'Adultos Mayores', description: '50+ años' },
    { value: 'luxury', label: 'Segmento Premium', description: 'Alto poder adquisitivo' }
  ];

  const colorSchemes = [
    { value: 'modern', label: 'Moderno', description: 'Azules y grises', colors: ['#3B82F6', '#1E40AF', '#6B7280'] },
    { value: 'warm', label: 'Cálido', description: 'Naranjas y rojos', colors: ['#F59E0B', '#EF4444', '#F97316'] },
    { value: 'nature', label: 'Natural', description: 'Verdes y marrones', colors: ['#10B981', '#059669', '#84CC16'] },
    { value: 'elegant', label: 'Elegante', description: 'Negros y dorados', colors: ['#1F2937', '#F59E0B', '#6B7280'] },
    { value: 'vibrant', label: 'Vibrante', description: 'Colores llamativos', colors: ['#EC4899', '#8B5CF6', '#06B6D4'] }
  ];

  const layoutStyles = [
    { value: 'clean', label: 'Limpio', description: 'Diseño minimalista' },
    { value: 'bold', label: 'Audaz', description: 'Elementos grandes y llamativos' },
    { value: 'classic', label: 'Clásico', description: 'Diseño tradicional' },
    { value: 'creative', label: 'Creativo', description: 'Diseño innovador' }
  ];

  const availableFeatures = [
    { value: 'contact-form', label: 'Formulario de Contacto', description: 'Para recibir consultas' },
    { value: 'blog', label: 'Blog', description: 'Sección de artículos' },
    { value: 'gallery', label: 'Galería', description: 'Mostrar imágenes' },
    { value: 'testimonials', label: 'Testimonios', description: 'Opiniones de clientes' },
    { value: 'newsletter', label: 'Newsletter', description: 'Suscripción por email' },
    { value: 'social-media', label: 'Redes Sociales', description: 'Enlaces a redes' },
    { value: 'seo-optimized', label: 'SEO Optimizado', description: 'Para motores de búsqueda' },
    { value: 'mobile-responsive', label: 'Responsive', description: 'Adaptable a móviles' }
  ];

  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleGenerate = async () => {
    if (!websiteName.trim()) return;
    
    setIsGenerating(true);
    
    // Simular generación de sitio web
    setTimeout(() => {
      const businessData = businessTypes.find(b => b.value === businessType);
      const audienceData = audiences.find(a => a.value === targetAudience);
      const colorData = colorSchemes.find(c => c.value === colorScheme);
      const layoutData = layoutStyles.find(l => l.value === layoutStyle);
      
      const newWebsite = {
        id: Date.now(),
        websiteName: websiteName,
        businessType: businessType,
        businessLabel: businessData?.label || businessType,
        targetAudience: targetAudience,
        audienceLabel: audienceData?.label || targetAudience,
        colorScheme: colorScheme,
        colorData: colorData,
        layoutStyle: layoutStyle,
        layoutLabel: layoutData?.label || layoutStyle,
        features: features,
        selectedFeatures: availableFeatures.filter(f => features.includes(f.value)),
        preview: generateWebsitePreview(websiteName, businessType, colorScheme, layoutStyle),
        pages: generateWebsitePages(businessType),
        createdAt: new Date()
      };
      
      setGeneratedWebsites(prev => [newWebsite, ...prev]);
      setIsGenerating(false);
    }, 4000);
  };

  const generateWebsitePreview = (name: string, type: string, colors: string, layout: string) => {
    return {
      url: `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
      title: `${name} - Sitio Web`,
      description: `Sitio web profesional para ${name}`,
      thumbnail: `https://picsum.photos/400/300?random=${Date.now()}`
    };
  };

  const generateWebsitePages = (type: string) => {
    const basePages = ['Inicio', 'Acerca de', 'Contacto'];
    
    const typePages = {
      'ecommerce': ['Productos', 'Carrito', 'Checkout', 'Mi Cuenta'],
      'portfolio': ['Portfolio', 'Servicios', 'Proceso'],
      'blog': ['Blog', 'Categorías', 'Archivo'],
      'corporate': ['Servicios', 'Equipo', 'Carreras'],
      'restaurant': ['Menú', 'Reservas', 'Ubicación'],
      'fitness': ['Clases', 'Entrenadores', 'Horarios']
    };
    
    return [...basePages, ...(typePages[type as keyof typeof typePages] || [])];
  };

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
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                Website Builder con IA
              </h1>
              <p className="text-muted-foreground">
                Construye sitios web profesionales con plantillas inteligentes
              </p>
            </div>
          </div>
          <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
            <Sparkles className="w-3 h-3 mr-1" />
            Disponible
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Configuración */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuración del Sitio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="website-name">Nombre del Sitio Web</Label>
                  <Input
                    id="website-name"
                    placeholder="Ej: Mi Tienda Online"
                    value={websiteName}
                    onChange={(e) => setWebsiteName(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="business-type">Tipo de Negocio</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
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
                  <Label htmlFor="color-scheme">Esquema de Colores</Label>
                  <Select value={colorScheme} onValueChange={setColorScheme}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorSchemes.map((scheme) => (
                        <SelectItem key={scheme.value} value={scheme.value}>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {scheme.colors.map((color, index) => (
                                <div 
                                  key={index}
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <div>
                              <div className="font-medium">{scheme.label}</div>
                              <div className="text-xs text-muted-foreground">{scheme.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="layout-style">Estilo de Diseño</Label>
                  <Select value={layoutStyle} onValueChange={setLayoutStyle}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {layoutStyles.map((style) => (
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
                  <Label>Características</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {availableFeatures.map((feature) => (
                      <div key={feature.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={feature.value}
                          checked={features.includes(feature.value)}
                          onChange={() => handleFeatureToggle(feature.value)}
                          className="rounded"
                        />
                        <label htmlFor={feature.value} className="text-sm">
                          <div className="font-medium">{feature.label}</div>
                          <div className="text-xs text-muted-foreground">{feature.description}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={!websiteName.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generar Sitio Web
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="preview">Vista Previa</TabsTrigger>
                <TabsTrigger value="pages">Páginas</TabsTrigger>
                <TabsTrigger value="features">Características</TabsTrigger>
                <TabsTrigger value="customize">Personalizar</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                {generatedWebsites.length === 0 ? (
                  <Card className="h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Globe className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay sitios web generados</h3>
                        <p className="text-muted-foreground">
                          Configura los parámetros y genera tu primer sitio web
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {generatedWebsites.map((website) => (
                      <Card key={website.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{website.websiteName}</CardTitle>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{website.businessLabel}</Badge>
                                <Badge variant="outline">{website.audienceLabel}</Badge>
                                <Badge variant="outline">{website.layoutLabel}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedWebsite(website)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <img 
                                src={website.preview.thumbnail} 
                                alt="Website preview"
                                className="w-full h-48 object-cover rounded-lg border"
                              />
                            </div>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold">URL: {website.preview.url}</h4>
                                <p className="text-sm text-muted-foreground">{website.preview.description}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Esquema de Colores</h4>
                                <div className="flex gap-2">
                                  {website.colorData.colors.map((color: string, index: number) => (
                                    <div 
                                      key={index}
                                      className="w-8 h-8 rounded border"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm">
                                  <Monitor className="w-4 h-4 mr-1" />
                                  Desktop
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Tablet className="w-4 h-4 mr-1" />
                                  Tablet
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Smartphone className="w-4 h-4 mr-1" />
                                  Mobile
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pages" className="space-y-4">
                {generatedWebsites.length > 0 ? (
                  <div className="space-y-4">
                    {generatedWebsites.map((website) => (
                      <Card key={website.id}>
                        <CardHeader>
                          <CardTitle>Páginas - {website.websiteName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {website.pages.map((page: string, index: number) => (
                              <div key={index} className="border rounded-lg p-3 text-center">
                                <div className="font-medium">{page}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {index === 0 ? 'Página principal' : 'Página secundaria'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Layout className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay páginas</h3>
                        <p className="text-muted-foreground">
                          Genera un sitio web para ver las páginas incluidas
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                {generatedWebsites.length > 0 ? (
                  <div className="space-y-4">
                    {generatedWebsites.map((website) => (
                      <Card key={website.id}>
                        <CardHeader>
                          <CardTitle>Características - {website.websiteName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {website.selectedFeatures.map((feature: any) => (
                              <div key={feature.value} className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <div>
                                  <div className="font-medium">{feature.label}</div>
                                  <div className="text-sm text-muted-foreground">{feature.description}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Code className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay características</h3>
                        <p className="text-muted-foreground">
                          Genera un sitio web para ver las características incluidas
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="customize" className="space-y-4">
                <Card className="h-96 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Palette className="w-16 h-16 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">Editor Personalizado</h3>
                      <p className="text-muted-foreground">
                        Próximamente: Editor visual para personalizar tu sitio web
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Modal de Vista Previa */}
        {selectedWebsite && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Vista Previa: {selectedWebsite.websiteName}</h3>
                <Button variant="ghost" onClick={() => setSelectedWebsite(null)}>
                  ×
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <img 
                        src={selectedWebsite.preview.thumbnail} 
                        alt="Website preview"
                        className="w-full rounded-lg border"
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold">Información del Sitio</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>URL:</strong> {selectedWebsite.preview.url}</div>
                          <div><strong>Tipo:</strong> {selectedWebsite.businessLabel}</div>
                          <div><strong>Audiencia:</strong> {selectedWebsite.audienceLabel}</div>
                          <div><strong>Estilo:</strong> {selectedWebsite.layoutLabel}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Esquema de Colores</h4>
                        <div className="flex gap-2">
                          {selectedWebsite.colorData.colors.map((color: string, index: number) => (
                            <div key={index} className="text-center">
                              <div 
                                className="w-12 h-12 rounded border mb-1"
                                style={{ backgroundColor: color }}
                              />
                              <div className="text-xs">{color}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Páginas Incluidas</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedWebsite.pages.map((page: string, index: number) => (
                          <div key={index} className="p-2 border rounded text-sm text-center">
                            {page}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Características</h4>
                      <div className="space-y-2">
                        {selectedWebsite.selectedFeatures.map((feature: any) => (
                          <div key={feature.value} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            {feature.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Código
                    </Button>
                    <Button variant="outline">
                      <Code className="w-4 h-4 mr-2" />
                      Ver Código
                    </Button>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir
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


