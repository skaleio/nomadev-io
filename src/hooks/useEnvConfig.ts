import { useState, useEffect, useCallback } from 'react';
import { 
  getEnvConfig, 
  getConfiguredEnvVars, 
  getMissingRequiredEnvVars,
  areRequiredEnvVarsConfigured,
  getEnvConfigStatus,
  getEnvConfigDescription,
  type EnvConfig,
  type EnvVariable 
} from '@/lib/env-config';

/**
 * Hook personalizado para manejar la configuración de variables de entorno
 */
export function useEnvConfig() {
  const [envConfig, setEnvConfig] = useState<EnvConfig>(getEnvConfig());
  const [isLoading, setIsLoading] = useState(false);

  // Actualizar configuración
  const refreshConfig = useCallback(() => {
    setEnvConfig(getEnvConfig());
  }, []);

  // Verificar si las variables requeridas están configuradas
  const checkRequiredVars = useCallback(() => {
    return areRequiredEnvVarsConfigured();
  }, []);

  // Obtener variables configuradas
  const getConfiguredVars = useCallback(() => {
    return getConfiguredEnvVars();
  }, []);

  // Obtener variables faltantes
  const getMissingVars = useCallback(() => {
    return getMissingRequiredEnvVars();
  }, []);

  // Obtener estado de configuración
  const getStatus = useCallback(() => {
    return getEnvConfigStatus();
  }, []);

  // Obtener descripción de configuración
  const getDescription = useCallback(() => {
    return getEnvConfigDescription();
  }, []);

  // Verificar una variable específica
  const isVarConfigured = useCallback((varName: string) => {
    return envConfig.configuredVars.some(v => v.name === varName);
  }, [envConfig.configuredVars]);

  // Obtener valor de una variable específica
  const getVarValue = useCallback((varName: string) => {
    const varConfig = envConfig.configuredVars.find(v => v.name === varName);
    return varConfig?.value;
  }, [envConfig.configuredVars]);

  // Verificar si una funcionalidad está disponible
  const isFeatureAvailable = useCallback((feature: string) => {
    switch (feature) {
      case 'supabase':
        return isVarConfigured('VITE_SUPABASE_URL') && isVarConfigured('VITE_SUPABASE_ANON_KEY');
      case 'evolution':
        return isVarConfigured('VITE_EVOLUTION_API_URL') && isVarConfigured('VITE_EVOLUTION_INSTANCE');
      case 'shopify':
        return isVarConfigured('VITE_SHOPIFY_API_KEY');
      case 'whatsapp':
        return isVarConfigured('VITE_EVOLUTION_API_URL') && isVarConfigured('VITE_EVOLUTION_INSTANCE');
      default:
        return false;
    }
  }, [isVarConfigured]);

  // Obtener estado de funcionalidades
  const getFeaturesStatus = useCallback(() => {
    return {
      supabase: isFeatureAvailable('supabase'),
      evolution: isFeatureAvailable('evolution'),
      shopify: isFeatureAvailable('shopify'),
      whatsapp: isFeatureAvailable('whatsapp'),
      allRequired: checkRequiredVars()
    };
  }, [isFeatureAvailable, checkRequiredVars]);

  // Actualizar configuración cuando cambien las variables de entorno
  useEffect(() => {
    const interval = setInterval(() => {
      const newConfig = getEnvConfig();
      if (JSON.stringify(newConfig) !== JSON.stringify(envConfig)) {
        setEnvConfig(newConfig);
      }
    }, 1000); // Verificar cada segundo

    return () => clearInterval(interval);
  }, [envConfig]);

  return {
    // Estado
    envConfig,
    isLoading,
    
    // Métodos
    refreshConfig,
    checkRequiredVars,
    getConfiguredVars,
    getMissingVars,
    getStatus,
    getDescription,
    isVarConfigured,
    getVarValue,
    isFeatureAvailable,
    getFeaturesStatus,
    
    // Propiedades calculadas
    isFullyConfigured: envConfig.isFullyConfigured,
    configuredCount: envConfig.configuredCount,
    totalVars: envConfig.totalVars,
    missingRequiredCount: envConfig.missingVars.filter(v => v.required).length,
    missingOptionalCount: envConfig.missingVars.filter(v => !v.required).length,
  };
}

/**
 * Hook específico para verificar si una funcionalidad está disponible
 */
export function useFeatureAvailability(feature: string) {
  const { isFeatureAvailable } = useEnvConfig();
  return isFeatureAvailable(feature);
}

/**
 * Hook para obtener el estado de todas las funcionalidades
 */
export function useFeaturesStatus() {
  const { getFeaturesStatus } = useEnvConfig();
  return getFeaturesStatus();
}

/**
 * Hook para verificar si las variables requeridas están configuradas
 */
export function useRequiredVarsCheck() {
  const { checkRequiredVars, isFullyConfigured } = useEnvConfig();
  return {
    areRequiredVarsConfigured: checkRequiredVars(),
    isFullyConfigured
  };
}
