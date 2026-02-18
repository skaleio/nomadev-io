import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  X,
  ExternalLink 
} from 'lucide-react';
import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useInfrastructureInfo } from '@/hooks/useUserInfrastructure';

interface ConfigStatusBannerProps {
  onOpenSettings?: () => void;
  onDismiss?: () => void;
  showDismissButton?: boolean;
}

export function ConfigStatusBanner({ 
  onOpenSettings, 
  onDismiss, 
  showDismissButton = true 
}: ConfigStatusBannerProps) {
  const { 
    isFullyConfigured, 
    missingRequiredCount, 
    getStatus, 
    getDescription,
    getFeaturesStatus 
  } = useEnvConfig();

  const { info: infraInfo, isActive: infraActive } = useInfrastructureInfo();
  const featuresStatus = getFeaturesStatus();

  // No mostrar el banner si todo está configurado y la infraestructura está activa
  if (isFullyConfigured && infraActive) {
    return null;
  }

  // Determinar el tipo de alerta basado en infraestructura y configuraciones externas
  const alertType = !infraActive ? 'destructive' : 'default';
  const icon = !infraActive ? AlertTriangle : Settings;
  const IconComponent = icon;

  return (
    <Alert className={`border-l-4 ${
      !infraActive 
        ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' 
        : 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <IconComponent className={`h-5 w-5 mt-0.5 ${
            !infraActive ? 'text-red-600' : 'text-yellow-600'
          }`} />
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium ${
                !infraActive 
                  ? 'text-red-800 dark:text-red-200' 
                  : 'text-yellow-800 dark:text-yellow-200'
              }`}>
                {!infraActive ? 'Infraestructura No Disponible' : 'Configuración de Conexiones Externas'}
              </h4>
              
              {/* Badges de estado de funcionalidades */}
              <div className="flex gap-1">
                <Badge 
                  variant={infraActive ? "default" : "destructive"}
                  className="text-xs"
                >
                  Infraestructura {infraActive ? '✓' : '✗'}
                </Badge>
                <Badge 
                  variant={featuresStatus.shopify ? "default" : "secondary"}
                  className="text-xs"
                >
                  Shopify {featuresStatus.shopify ? '✓' : '✗'}
                </Badge>
              </div>
            </div>
            
            <AlertDescription className={`${
              !infraActive 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {!infraActive 
                ? infraInfo.message 
                : getDescription()
              }
            </AlertDescription>
            
            <div className="mt-3">
              {onOpenSettings && (
                <Button
                  size="sm"
                  variant={!infraActive ? "destructive" : "default"}
                  onClick={onOpenSettings}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configurar Ahora
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {showDismissButton && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * Banner simplificado que solo muestra el estado básico
 */
export function SimpleConfigStatusBanner() {
  const { isFullyConfigured, missingRequiredCount, getStatus } = useEnvConfig();

  if (isFullyConfigured) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-800 dark:text-green-200">
          Aplicación completamente configurada
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      missingRequiredCount > 0 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    }`}>
      {missingRequiredCount > 0 ? (
        <AlertTriangle className="h-4 w-4 text-red-600" />
      ) : (
        <Settings className="h-4 w-4 text-yellow-600" />
      )}
      <span className={`text-sm ${
        missingRequiredCount > 0 
          ? 'text-red-800 dark:text-red-200' 
          : 'text-yellow-800 dark:text-yellow-200'
      }`}>
        {getStatus()}
      </span>
    </div>
  );
}
