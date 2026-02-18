import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Key, 
  Globe, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  Eye, 
  EyeOff,
  Info,
  Settings
} from 'lucide-react';
import { 
  getEnvConfig, 
  getMissingRequiredEnvVars, 
  validateEnvVar, 
  getEnvVarInstructions,
  type EnvVariable 
} from '@/lib/env-config';
import { saveUserEnvConfig } from '@/lib/env-persistence';
import { useAuth } from '@/contexts/AuthContext';

interface EnvVarsSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface EnvVarFormData {
  [key: string]: string;
}

export function EnvVarsSetupModal({ isOpen, onClose, onComplete }: EnvVarsSetupModalProps) {
  const { user } = useAuth();
  const [envConfig, setEnvConfig] = useState(getEnvConfig());
  const [formData, setFormData] = useState<EnvVarFormData>({});
  const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const missingRequiredVars = getMissingRequiredEnvVars();
  const totalSteps = missingRequiredVars.length;

  useEffect(() => {
    if (isOpen) {
      setEnvConfig(getEnvConfig());
      setCurrentStep(0);
      setFormData({});
      setErrors({});
      setShowValues({});
    }
  }, [isOpen]);

  const handleInputChange = (varName: string, value: string) => {
    setFormData(prev => ({ ...prev, [varName]: value }));
    
    // Validar en tiempo real
    const validation = validateEnvVar(varName, value);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [varName]: validation.error || 'Error de validación' }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[varName];
        return newErrors;
      });
    }
  };

  const toggleShowValue = (varName: string) => {
    setShowValues(prev => ({ ...prev, [varName]: !prev[varName] }));
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      // Aquí podrías mostrar un toast de éxito
    } catch (err) {
      console.error('Error copiando al portapapeles:', err);
    }
  };

  const getVarIcon = (varName: string) => {
    if (varName.includes('SUPABASE')) return <Key className="h-4 w-4" />;
    if (varName.includes('EVOLUTION')) return <Globe className="h-4 w-4" />;
    if (varName.includes('SHOPIFY')) return <Settings className="h-4 w-4" />;
    return <Key className="h-4 w-4" />;
  };

  const getVarTypeColor = (type: string) => {
    switch (type) {
      case 'url': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'key': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'text': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setSaveError('Usuario no autenticado');
      return;
    }

    setIsSubmitting(true);
    setSaveError(null);
    
    try {
      // Crear variables de entorno con los valores del formulario
      const configuredVars: EnvVariable[] = missingRequiredVars.map(varDef => ({
        ...varDef,
        value: formData[varDef.name] || '',
        isConfigured: !!(formData[varDef.name] && formData[varDef.name].trim() !== '')
      }));

      // Guardar en la base de datos
      const result = await saveUserEnvConfig(user.id, configuredVars);
      
      if (!result.success) {
        setSaveError(result.error || 'Error guardando configuración');
        return;
      }
      
      // Actualizar configuración local
      setEnvConfig(getEnvConfig());
      onComplete();
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setSaveError('Error inesperado guardando configuración');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentVar = missingRequiredVars[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Variables de Entorno
          </DialogTitle>
          <DialogDescription>
            Configura las variables necesarias para que tu aplicación funcione correctamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso de configuración</span>
              <span>{currentStep + 1} de {totalSteps}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Variable */}
          {currentVar && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {getVarIcon(currentVar.name)}
                  {currentVar.name}
                  <Badge className={getVarTypeColor(currentVar.type)}>
                    {currentVar.type}
                  </Badge>
                  {currentVar.required && (
                    <Badge variant="destructive">Requerido</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={currentVar.name} className="text-sm font-medium">
                    {currentVar.description}
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id={currentVar.name}
                      type={showValues[currentVar.name] ? 'text' : 'password'}
                      placeholder={currentVar.placeholder}
                      value={formData[currentVar.name] || ''}
                      onChange={(e) => handleInputChange(currentVar.name, e.target.value)}
                      className={errors[currentVar.name] ? 'border-red-500' : ''}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShowValue(currentVar.name)}
                        className="h-6 w-6 p-0"
                      >
                        {showValues[currentVar.name] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      {formData[currentVar.name] && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(formData[currentVar.name])}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {errors[currentVar.name] && (
                    <p className="text-sm text-red-500 mt-1">{errors[currentVar.name]}</p>
                  )}
                </div>

                {/* Instructions */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {getEnvVarInstructions(currentVar.name)}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen de Configuración</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Variables configuradas:</span>
                    <span className="font-medium">{envConfig.configuredCount}/{envConfig.totalVars}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variables requeridas faltantes:</span>
                    <span className="font-medium text-red-600">{missingRequiredVars.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado general:</span>
                    <span className={`font-medium ${envConfig.isFullyConfigured ? 'text-green-600' : 'text-yellow-600'}`}>
                      {envConfig.isFullyConfigured ? 'Completo' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error de guardado */}
            {saveError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {saveError}
                </AlertDescription>
              </Alert>
            )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              
              {currentStep === totalSteps - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? 'Guardando...' : 'Completar Configuración'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!formData[currentVar?.name] || errors[currentVar?.name]}
                >
                  Siguiente
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
