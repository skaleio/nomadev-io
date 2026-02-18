import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Key, 
  Globe, 
  Settings, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Database,
  MessageSquare,
  ShoppingBag
} from 'lucide-react';
import { 
  getEnvConfig, 
  getMissingRequiredEnvVars,
  areRequiredEnvVarsConfigured,
  type EnvConfig 
} from '@/lib/env-config';
import { EnvVarsSetupModal } from '@/components/settings/EnvVarsSetupModal';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  isCompleted: boolean;
  isRequired: boolean;
  action?: () => void;
}

export function OnboardingWizard({ isOpen, onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [envConfig, setEnvConfig] = useState<EnvConfig>(getEnvConfig());
  const [showEnvSetupModal, setShowEnvSetupModal] = useState(false);

  // Actualizar configuración cuando cambie
  useEffect(() => {
    if (isOpen) {
      setEnvConfig(getEnvConfig());
    }
  }, [isOpen]);

  // Definir pasos del onboarding
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '¡Bienvenido a NOMADEV.IO!',
      description: 'Te guiaremos a través de la configuración inicial para que puedas aprovechar al máximo todas las funcionalidades.',
      icon: Sparkles,
      isCompleted: true,
      isRequired: false
    },
    {
      id: 'env-vars',
      title: 'Configurar Variables de Entorno',
      description: 'Configura las variables necesarias para conectar con Supabase, Evolution API y Shopify.',
      icon: Key,
      isCompleted: areRequiredEnvVarsConfigured(),
      isRequired: true,
      action: () => setShowEnvSetupModal(true)
    },
    {
      id: 'database',
      title: 'Configurar Base de Datos',
      description: 'La aplicación se conectará automáticamente a Supabase una vez configuradas las variables.',
      icon: Database,
      isCompleted: envConfig.configuredVars.some(v => v.name === 'VITE_SUPABASE_URL'),
      isRequired: true
    },
    {
      id: 'whatsapp',
      title: 'Configurar WhatsApp',
      description: 'Conecta tu instancia de WhatsApp para habilitar la funcionalidad de mensajería.',
      icon: MessageSquare,
      isCompleted: envConfig.configuredVars.some(v => v.name === 'VITE_EVOLUTION_API_URL'),
      isRequired: false
    },
    {
      id: 'shopify',
      title: 'Conectar Shopify',
      description: 'Conecta tu tienda Shopify para sincronizar pedidos y productos automáticamente.',
      icon: ShoppingBag,
      isCompleted: envConfig.configuredVars.some(v => v.name === 'VITE_SHOPIFY_API_KEY'),
      isRequired: false
    }
  ];

  const completedSteps = steps.filter(step => step.isCompleted).length;
  const requiredStepsCompleted = steps.filter(step => step.isRequired && step.isCompleted).length;
  const totalRequiredSteps = steps.filter(step => step.isRequired).length;
  const progress = (completedSteps / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepAction = (step: OnboardingStep) => {
    if (step.action) {
      step.action();
    }
  };

  const handleEnvSetupComplete = () => {
    setEnvConfig(getEnvConfig());
    setShowEnvSetupModal(false);
  };

  const currentStepData = steps[currentStep];
  const canProceed = !currentStepData.isRequired || currentStepData.isCompleted;

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Configuración Inicial
            </DialogTitle>
            <DialogDescription>
              Configura tu aplicación paso a paso para obtener la mejor experiencia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso general</span>
                <span>{completedSteps} de {steps.length} pasos completados</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {totalRequiredSteps > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pasos requeridos</span>
                  <span>{requiredStepsCompleted} de {totalRequiredSteps} completados</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Steps List */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground mb-3">Pasos de configuración</h3>
                {steps.map((step, index) => (
                  <Card 
                    key={step.id}
                    className={`cursor-pointer transition-all ${
                      index === currentStep 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-full ${
                          step.isCompleted 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
                        }`}>
                          {step.isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <step.icon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{step.title}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {step.isRequired && (
                              <Badge variant="destructive" className="text-xs">Requerido</Badge>
                            )}
                            {step.isCompleted && (
                              <Badge variant="default" className="text-xs bg-green-600">Completado</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Current Step Content */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        currentStepData.isCompleted 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                      }`}>
                        <currentStepData.icon className="h-5 w-5" />
                      </div>
                      {currentStepData.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      {currentStepData.description}
                    </p>

                    {/* Step-specific content */}
                    {currentStepData.id === 'welcome' && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                          ¿Qué puedes hacer con NOMADEV.IO?
                        </h4>
                        <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                          <li>• Gestionar pedidos de Shopify automáticamente</li>
                          <li>• Enviar mensajes de WhatsApp con Evolution API</li>
                          <li>• Validar clientes y procesar pagos</li>
                          <li>• Analizar métricas de ventas en tiempo real</li>
                          <li>• Automatizar flujos de trabajo con N8N</li>
                        </ul>
                      </div>
                    )}

                    {currentStepData.id === 'env-vars' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800 dark:text-yellow-200">
                              Variables Requeridas
                            </span>
                          </div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            Estas variables son necesarias para el funcionamiento básico de la aplicación.
                          </p>
                        </div>
                        
                        {!currentStepData.isCompleted && (
                          <Button 
                            onClick={() => handleStepAction(currentStepData)}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Configurar Variables de Entorno
                          </Button>
                        )}
                      </div>
                    )}

                    {currentStepData.id === 'database' && (
                      <div className="space-y-4">
                        {currentStepData.isCompleted ? (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-800 dark:text-green-200">
                                Base de Datos Configurada
                              </span>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Las variables de Supabase están configuradas correctamente.
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-800 dark:text-red-200">
                                Base de Datos No Configurada
                              </span>
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              Configura las variables de Supabase en el paso anterior.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStepData.id === 'whatsapp' && (
                      <div className="space-y-4">
                        {currentStepData.isCompleted ? (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-800 dark:text-green-200">
                                WhatsApp Configurado
                              </span>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              WhatsApp está configurado y listo para enviar mensajes.
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                WhatsApp No Configurado
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Puedes configurar WhatsApp más tarde desde la página de configuración.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStepData.id === 'shopify' && (
                      <div className="space-y-4">
                        {currentStepData.isCompleted ? (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-800 dark:text-green-200">
                                Shopify Conectado
                              </span>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Tu tienda Shopify está conectada y sincronizada.
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-2 mb-2">
                              <ShoppingBag className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                Shopify No Conectado
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Puedes conectar tu tienda Shopify más tarde desde el dashboard.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                
                <Button variant="outline" onClick={onSkip}>
                  Omitir Configuración
                </Button>
              </div>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === steps.length - 1 ? 'Completar' : 'Siguiente'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuración de variables de entorno */}
      <EnvVarsSetupModal
        isOpen={showEnvSetupModal}
        onClose={() => setShowEnvSetupModal(false)}
        onComplete={handleEnvSetupComplete}
      />
    </>
  );
}
