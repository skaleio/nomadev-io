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
  TrendingUp, 
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
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingDown
} from "lucide-react";

export default function PriceOptimizerPage() {
  const [productName, setProductName] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [category, setCategory] = useState('electronics');
  const [targetMargin, setTargetMargin] = useState('30');
  const [competitorPrices, setCompetitorPrices] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const categories = [
    { value: 'electronics', label: 'Electrónicos', description: 'Dispositivos y tecnología' },
    { value: 'fashion', label: 'Moda', description: 'Ropa y accesorios' },
    { value: 'home', label: 'Hogar', description: 'Muebles y decoración' },
    { value: 'beauty', label: 'Belleza', description: 'Cosméticos y cuidado personal' },
    { value: 'sports', label: 'Deportes', description: 'Equipamiento deportivo' },
    { value: 'books', label: 'Libros', description: 'Libros y material educativo' },
    { value: 'toys', label: 'Juguetes', description: 'Juguetes y entretenimiento' },
    { value: 'automotive', label: 'Automotriz', description: 'Repuestos y accesorios' }
  ];

  const handleAnalyze = async () => {
    if (!productName.trim() || !currentPrice.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simular análisis de precios
    setTimeout(() => {
      const currentPriceNum = parseFloat(currentPrice);
      const targetMarginNum = parseFloat(targetMargin);
      
      // Generar resultados simulados
      const results = {
        id: Date.now(),
        productName: productName,
        currentPrice: currentPriceNum,
        category: category,
        targetMargin: targetMarginNum,
        recommendations: [
          {
            type: 'optimal',
            price: currentPriceNum * 1.15,
            confidence: 85,
            reasoning: 'Precio óptimo basado en análisis de mercado y competencia',
            impact: 'Aumento de 15% en margen de beneficio'
          },
          {
            type: 'competitive',
            price: currentPriceNum * 0.95,
            confidence: 70,
            reasoning: 'Precio competitivo para ganar market share',
            impact: 'Reducción de 5% para competir directamente'
          },
          {
            type: 'premium',
            price: currentPriceNum * 1.25,
            confidence: 60,
            reasoning: 'Posicionamiento premium en el mercado',
            impact: 'Aumento de 25% para segmento premium'
          }
        ],
        marketAnalysis: {
          averagePrice: currentPriceNum * 1.1,
          priceRange: {
            min: currentPriceNum * 0.8,
            max: currentPriceNum * 1.3
          },
          demand: 'Alta',
          competition: 'Media'
        },
        createdAt: new Date()
      };
      
      setAnalysisResults(prev => [results, ...prev]);
      setIsAnalyzing(false);
    }, 3000);
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'optimal': return <Target className="w-5 h-5 text-green-500" />;
      case 'competitive': return <TrendingDown className="w-5 h-5 text-blue-500" />;
      case 'premium': return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'optimal': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'competitive': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'premium': return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20';
    }
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
                <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Optimizador de Precios
              </h1>
              <p className="text-muted-foreground">
                Encuentra el precio óptimo basado en análisis de mercado y competencia
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
                  Configuración del Análisis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="product-name">Nombre del Producto</Label>
                  <Input
                    id="product-name"
                    placeholder="Ej: iPhone 15 Pro Max"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="current-price">Precio Actual ($)</Label>
                  <Input
                    id="current-price"
                    type="number"
                    placeholder="999.99"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div>
                            <div className="font-medium">{cat.label}</div>
                            <div className="text-xs text-muted-foreground">{cat.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target-margin">Margen Objetivo (%)</Label>
                  <Input
                    id="target-margin"
                    type="number"
                    placeholder="30"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="competitor-prices">Precios de Competencia (opcional)</Label>
                  <Textarea
                    id="competitor-prices"
                    placeholder="Competidor 1: $899&#10;Competidor 2: $1099&#10;Competidor 3: $799"
                    value={competitorPrices}
                    onChange={(e) => setCompetitorPrices(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={handleAnalyze}
                  disabled={!productName.trim() || !currentPrice.trim() || isAnalyzing}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Analizar Precios
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis">Análisis</TabsTrigger>
                <TabsTrigger value="market">Mercado</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                {analysisResults.length === 0 ? (
                  <Card className="h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold">No hay análisis realizados</h3>
                        <p className="text-muted-foreground">
                          Configura los parámetros y realiza tu primer análisis de precios
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {analysisResults.map((result) => (
                      <Card key={result.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{result.productName}</CardTitle>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">Precio actual: ${result.currentPrice}</Badge>
                                <Badge variant="outline">{result.category}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedResult(result)}>
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
                            {result.recommendations.map((rec: any, index: number) => (
                              <div key={index} className={`border rounded-lg p-4 ${getRecommendationColor(rec.type)}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {getRecommendationIcon(rec.type)}
                                  <span className="font-semibold">${rec.price.toFixed(2)}</span>
                                  <Badge variant="outline" className="ml-auto">
                                    {rec.confidence}% confianza
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{rec.reasoning}</p>
                                <p className="text-xs font-medium">{rec.impact}</p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">${result.marketAnalysis.averagePrice.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">Precio Promedio</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{result.marketAnalysis.demand}</div>
                              <div className="text-xs text-muted-foreground">Demanda</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">{result.marketAnalysis.competition}</div>
                              <div className="text-xs text-muted-foreground">Competencia</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                ${result.marketAnalysis.priceRange.min.toFixed(0)}-${result.marketAnalysis.priceRange.max.toFixed(0)}
                              </div>
                              <div className="text-xs text-muted-foreground">Rango de Precios</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="market" className="space-y-4">
                <Card className="h-96 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">Análisis de Mercado</h3>
                      <p className="text-muted-foreground">
                        Próximamente: Gráficos detallados de tendencias de mercado
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card className="h-96 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">Historial de Análisis</h3>
                      <p className="text-muted-foreground">
                        Próximamente: Historial completo de análisis de precios
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Modal de Vista Previa */}
        {selectedResult && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Análisis Detallado: {selectedResult.productName}</h3>
                <Button variant="ghost" onClick={() => setSelectedResult(null)}>
                  ×
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedResult.recommendations.map((rec: any, index: number) => (
                      <div key={index} className={`border rounded-lg p-4 ${getRecommendationColor(rec.type)}`}>
                        <div className="flex items-center gap-2 mb-3">
                          {getRecommendationIcon(rec.type)}
                          <span className="text-xl font-bold">${rec.price.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Confianza: </span>
                            <span className="text-sm">{rec.confidence}%</span>
                          </div>
                          <p className="text-sm">{rec.reasoning}</p>
                          <p className="text-xs font-medium text-muted-foreground">{rec.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Análisis de Mercado</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-lg font-bold">${selectedResult.marketAnalysis.averagePrice.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Precio Promedio del Mercado</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{selectedResult.marketAnalysis.demand}</div>
                        <div className="text-sm text-muted-foreground">Nivel de Demanda</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{selectedResult.marketAnalysis.competition}</div>
                        <div className="text-sm text-muted-foreground">Intensidad Competitiva</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">
                          ${selectedResult.marketAnalysis.priceRange.min.toFixed(0)} - ${selectedResult.marketAnalysis.priceRange.max.toFixed(0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Rango de Precios</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Análisis
                    </Button>
                    <Button variant="outline">
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Recomendaciones
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


