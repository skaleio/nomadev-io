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
  Palette, 
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
  Type,
  Image,
  Layers,
  Brush,
  Target,
  Users
} from "lucide-react";

export default function BrandIdentityPage() {
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('technology');
  const [targetAudience, setTargetAudience] = useState('young-professionals');
  const [brandValues, setBrandValues] = useState('');
  const [brandPersonality, setBrandPersonality] = useState('modern');
  const [generatedIdentities, setGeneratedIdentities] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIdentity, setSelectedIdentity] = useState<any>(null);

  const industries = [
    { value: 'technology', label: 'Tecnología', description: 'Software, hardware, apps' },
    { value: 'fashion', label: 'Moda', description: 'Ropa, accesorios, estilo' },
    { value: 'food', label: 'Alimentación', description: 'Restaurantes, productos gourmet' },
    { value: 'health', label: 'Salud', description: 'Medicina, wellness, fitness' },
    { value: 'finance', label: 'Finanzas', description: 'Bancos, inversiones, seguros' },
    { value: 'education', label: 'Educación', description: 'Escuelas, cursos, libros' },
    { value: 'beauty', label: 'Belleza', description: 'Cosméticos, cuidado personal' },
    { value: 'automotive', label: 'Automotriz', description: 'Coches, repuestos, servicios' }
  ];

  const audiences = [
    { value: 'young-professionals', label: 'Jóvenes Profesionales', description: '25-35 años, urbanos' },
    { value: 'millennials', label: 'Millennials', description: '25-40 años, digitales' },
    { value: 'gen-z', label: 'Generación Z', description: '18-25 años, nativos digitales' },
    { value: 'families', label: 'Familias', description: 'Padres con hijos' },
    { value: 'seniors', label: 'Adultos Mayores', description: '50+ años, tradicionales' },
    { value: 'luxury', label: 'Segmento Premium', description: 'Alto poder adquisitivo' }
  ];

  const personalities = [
    { value: 'modern', label: 'Moderno', description: 'Innovador y contemporáneo' },
    { value: 'classic', label: 'Clásico', description: 'Tradicional y confiable' },
    { value: 'playful', label: 'Divertido', description: 'Alegre y desenfadado' },
    { value: 'sophisticated', label: 'Sofisticado', description: 'Elegante y refinado' },
    { value: 'bold', label: 'Audaz', description: 'Atrevido y disruptivo' },
    { value: 'friendly', label: 'Amigable', description: 'Cercano y accesible' }
  ];

  const handleGenerate = async () => {
    if (!brandName.trim()) return;
    
    setIsGenerating(true);
    
    // Simular generación de identidad de marca
    setTimeout(() => {
      const industryData = industries.find(i => i.value === industry);
      const audienceData = audiences.find(a => a.value === targetAudience);
      const personalityData = personalities.find(p => p.value === brandPersonality);
      
      const newIdentity = {
        id: Date.now(),
        brandName: brandName,
        industry: industry,
        industryLabel: industryData?.label || industry,
        targetAudience: targetAudience,
        audienceLabel: audienceData?.label || targetAudience,
        brandPersonality: brandPersonality,
        personalityLabel: personalityData?.label || brandPersonality,
        brandValues: brandValues,
        colorPalette: generateColorPalette(industry, brandPersonality),
        typography: generateTypography(brandPersonality),
        logoConcepts: generateLogoConcepts(brandName, industry),
        brandGuidelines: generateBrandGuidelines(brandName, industry, brandPersonality),
        createdAt: new Date()
      };
      
      setGeneratedIdentities(prev => [newIdentity, ...prev]);
      setIsGenerating(false);
    }, 3000);
  };

  const generateColorPalette = (industry: string, personality: string) => {
    const palettes = {
      'technology-modern': {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#06B6D4',
        neutral: '#6B7280',
        background: '#F8FAFC'
      },
      'fashion-playful': {
        primary: '#EC4899',
        secondary: '#BE185D',
        accent: '#F59E0B',
        neutral: '#374151',
        background: '#FEF3C7'
      },
      'health-friendly': {
        primary: '#10B981',
        secondary: '#059669',
        accent: '#34D399',
        neutral: '#4B5563',
        background: '#ECFDF5'
      }
    };
    
    return palettes[`${industry}-${personality}` as keyof typeof palettes] || palettes['technology-modern'];
  };

  const generateTypography = (personality: string) => {
    const typography = {
      modern: {
        primary: 'Inter',
        secondary: 'Roboto',
        accent: 'Poppins',
        description: 'Tipografías modernas y limpias'
      },
      classic: {
        primary: 'Times New Roman',
        secondary: 'Georgia',
        accent: 'Playfair Display',
        description: 'Tipografías clásicas y serif'
      },
      playful: {
        primary: 'Comic Sans MS',
        secondary: 'Nunito',
        accent: 'Fredoka One',
        description: 'Tipografías divertidas y redondeadas'
      }
    };
    
    return typography[personality as keyof typeof typography] || typography.modern;
  };

  const generateLogoConcepts = (brandName: string, industry: string) => {
    return [
      {
        id: 1,
        name: 'Minimalista',
        description: 'Logo simple y limpio',
        concept: 'Enfoque en tipografía con icono minimalista'
      },
      {
        id: 2,
        name: 'Geométrico',
        description: 'Formas geométricas modernas',
        concept: 'Uso de formas básicas para crear identidad'
      },
      {
        id: 3,
        name: 'Ilustrativo',
        description: 'Logo con ilustración personalizada',
        concept: 'Dibujo único que representa la marca'
      }
    ];
  };

  const generateBrandGuidelines = (brandName: string, industry: string, personality: string) => {
    return {
      voice: `La voz de ${brandName} debe ser ${personality === 'modern' ? 'innovadora y contemporánea' : personality === 'classic' ? 'confiable y tradicional' : 'divertida y accesible'}.`,
      tone: personality === 'modern' ? 'Profesional pero accesible' : personality === 'playful' ? 'Divertido y energético' : 'Serio y confiable',
      messaging: `Los mensajes deben reflejar los valores de ${brandName} y conectar con ${audiences.find(a => a.value === targetAudience)?.label || 'la audiencia objetivo'}.`,
      applications: [
        'Tarjetas de presentación',
        'Papelería corporativa',
        'Sitio web',
        'Redes sociales',
        'Material publicitario'
      ]
    };
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
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                Asistente de Identidad de Marca
              </h1>
              <p className="text-muted-foreground">
                Desarrolla y refina la identidad visual de tu marca
              </p>
            </div>
          </div>
          <Badge className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
            <Sparkles className="w-3 h-3 mr-1" />
            Beta
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Configuración */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Información de la Marca
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="brand-name">Nombre de la Marca</Label>
                  <Input
                    id="brand-name"
                    placeholder="Ej: TechFlow"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
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
                  <Label htmlFor="personality">Personalidad de Marca</Label>
                  <Select value={brandPersonality} onValueChange={setBrandPersonality}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {personalities.map((personality) => (
                        <SelectItem key={personality.value} value={personality.value}>
                          <div>
                            <div className="font-medium">{personality.label}</div>
                            <div className="text-xs text-muted-foreground">{personality.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="values">Valores de la Marca</Label>
                  <Textarea
                    id="values"
                    placeholder="Describe los valores, misión y visión de tu marca..."
                    value={brandValues}
                    onChange={(e) => setBrandValues(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={!brandName.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generar Identidad
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="identity">Identidad</TabsTrigger>
                <TabsTrigger value="colors">Colores</TabsTrigger>
                <TabsTrigger value="typography">Tipografía</TabsTrigger>
                <TabsTrigger value="guidelines">Guías</TabsTrigger>
              </TabsList>

              <TabsContent value="identity" className="space-y-4">
                {generatedIdentities.length === 0 ? (
                  <Card className="h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Palette className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay identidades generadas</h3>
                        <p className="text-muted-foreground">
                          Configura la información de tu marca y genera tu identidad
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {generatedIdentities.map((identity) => (
                      <Card key={identity.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{identity.brandName}</CardTitle>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{identity.industryLabel}</Badge>
                                <Badge variant="outline">{identity.audienceLabel}</Badge>
                                <Badge variant="outline">{identity.personalityLabel}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedIdentity(identity)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {identity.logoConcepts.map((concept: any) => (
                              <div key={concept.id} className="border rounded-lg p-4">
                                <h4 className="font-semibold mb-2">{concept.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">{concept.description}</p>
                                <p className="text-xs">{concept.concept}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="colors" className="space-y-4">
                {generatedIdentities.length > 0 ? (
                  <div className="space-y-4">
                    {generatedIdentities.map((identity) => (
                      <Card key={identity.id}>
                        <CardHeader>
                          <CardTitle>Paleta de Colores - {identity.brandName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {Object.entries(identity.colorPalette).map(([key, color]) => (
                              <div key={key} className="text-center">
                                <div 
                                  className="w-full h-20 rounded-lg mb-2 border"
                                  style={{ backgroundColor: color as string }}
                                />
                                <div className="text-sm font-medium capitalize">{key}</div>
                                <div className="text-xs text-muted-foreground">{color}</div>
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
                      <Brush className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay paletas de colores</h3>
                        <p className="text-muted-foreground">
                          Genera una identidad de marca para ver las paletas de colores
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="typography" className="space-y-4">
                {generatedIdentities.length > 0 ? (
                  <div className="space-y-4">
                    {generatedIdentities.map((identity) => (
                      <Card key={identity.id}>
                        <CardHeader>
                          <CardTitle>Tipografía - {identity.brandName}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Primaria</h4>
                              <div className="text-2xl font-bold" style={{ fontFamily: identity.typography.primary }}>
                                {identity.typography.primary}
                              </div>
                              <p className="text-sm text-muted-foreground">Para títulos y encabezados</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Secundaria</h4>
                              <div className="text-lg" style={{ fontFamily: identity.typography.secondary }}>
                                {identity.typography.secondary}
                              </div>
                              <p className="text-sm text-muted-foreground">Para texto del cuerpo</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Acento</h4>
                              <div className="text-xl font-semibold" style={{ fontFamily: identity.typography.accent }}>
                                {identity.typography.accent}
                              </div>
                              <p className="text-sm text-muted-foreground">Para elementos destacados</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{identity.typography.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Type className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay tipografías</h3>
                        <p className="text-muted-foreground">
                          Genera una identidad de marca para ver las recomendaciones tipográficas
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="guidelines" className="space-y-4">
                {generatedIdentities.length > 0 ? (
                  <div className="space-y-4">
                    {generatedIdentities.map((identity) => (
                      <Card key={identity.id}>
                        <CardHeader>
                          <CardTitle>Guías de Marca - {identity.brandName}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Voz de Marca</h4>
                            <p className="text-sm">{identity.brandGuidelines.voice}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Tono</h4>
                            <p className="text-sm">{identity.brandGuidelines.tone}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Mensajería</h4>
                            <p className="text-sm">{identity.brandGuidelines.messaging}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Aplicaciones</h4>
                            <ul className="text-sm space-y-1">
                              {identity.brandGuidelines.applications.map((app: string, index: number) => (
                                <li key={index} className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-primary rounded-full" />
                                  {app}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Layers className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay guías de marca</h3>
                        <p className="text-muted-foreground">
                          Genera una identidad de marca para ver las guías completas
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Modal de Vista Previa */}
        {selectedIdentity && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Identidad Completa: {selectedIdentity.brandName}</h3>
                <Button variant="ghost" onClick={() => setSelectedIdentity(null)}>
                  ×
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Paleta de Colores</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedIdentity.colorPalette).map(([key, color]) => (
                          <div key={key} className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: color as string }}
                            />
                            <div>
                              <div className="text-sm font-medium capitalize">{key}</div>
                              <div className="text-xs text-muted-foreground">{color}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Tipografía</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm font-medium">Primaria: {selectedIdentity.typography.primary}</div>
                          <div className="text-lg font-bold" style={{ fontFamily: selectedIdentity.typography.primary }}>
                            Título Principal
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Secundaria: {selectedIdentity.typography.secondary}</div>
                          <div className="text-sm" style={{ fontFamily: selectedIdentity.typography.secondary }}>
                            Texto del cuerpo
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Conceptos de Logo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedIdentity.logoConcepts.map((concept: any) => (
                        <div key={concept.id} className="border rounded-lg p-4">
                          <h5 className="font-semibold">{concept.name}</h5>
                          <p className="text-sm text-muted-foreground">{concept.description}</p>
                          <p className="text-xs mt-2">{concept.concept}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Guías
                    </Button>
                    <Button variant="outline">
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Paleta
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


