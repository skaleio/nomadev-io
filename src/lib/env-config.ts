/**
 * Configuración y validación de variables de entorno
 * Maneja la detección, validación y configuración de variables de entorno
 */

export interface EnvVariable {
  name: string;
  value: string | undefined;
  type: 'url' | 'key' | 'text' | 'boolean';
  required: boolean;
  description: string;
  placeholder: string;
  isConfigured: boolean;
}

export interface EnvConfig {
  isFullyConfigured: boolean;
  configuredVars: EnvVariable[];
  missingVars: EnvVariable[];
  totalVars: number;
  configuredCount: number;
}

// Definición de variables de entorno EXTERNAS (solo lo que el usuario debe configurar)
const EXTERNAL_ENV_VARIABLES_DEFINITION: Omit<EnvVariable, 'value' | 'isConfigured'>[] = [
  {
    name: 'SHOPIFY_SHOP_DOMAIN',
    type: 'text',
    required: false,
    description: 'Dominio de tu tienda Shopify (sin .myshopify.com)',
    placeholder: 'mi-tienda'
  },
  {
    name: 'SHOPIFY_ACCESS_TOKEN',
    type: 'key',
    required: false,
    description: 'Token de acceso de Shopify',
    placeholder: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  },
  {
    name: 'SHOPIFY_WEBHOOK_SECRET',
    type: 'key',
    required: false,
    description: 'Secreto para webhooks de Shopify',
    placeholder: 'tu-webhook-secret'
  }
];

// Variables internas (manejadas automáticamente por nosotros)
const INTERNAL_ENV_VARIABLES = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY', 
  'VITE_EVOLUTION_API_URL',
  'VITE_EVOLUTION_INSTANCE',
  'VITE_APP_URL',
  'VITE_EVOLUTION_ADMIN_KEY'
];

/**
 * Obtiene el valor de una variable de entorno
 */
function getEnvValue(varName: string): string | undefined {
  return import.meta.env[varName];
}

/**
 * Valida si una variable de entorno está configurada correctamente
 */
function isEnvVarConfigured(varName: string, value: string | undefined): boolean {
  if (!value || value.trim() === '') {
    return false;
  }

  // Validaciones específicas por tipo
  const varDef = ENV_VARIABLES_DEFINITION.find(v => v.name === varName);
  if (!varDef) return false;

  switch (varDef.type) {
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'key':
      // Las claves deben tener al menos 10 caracteres
      return value.length >= 10;
    case 'text':
      // Texto debe tener al menos 3 caracteres
      return value.length >= 3;
    case 'boolean':
      return ['true', 'false', '1', '0'].includes(value.toLowerCase());
    default:
      return true;
  }
}

/**
 * Obtiene la configuración actual de variables de entorno EXTERNAS
 */
export function getEnvConfig(): EnvConfig {
  const configuredVars: EnvVariable[] = [];
  const missingVars: EnvVariable[] = [];

  // Solo verificar variables externas (las que el usuario debe configurar)
  EXTERNAL_ENV_VARIABLES_DEFINITION.forEach(varDef => {
    const value = getEnvValue(varDef.name);
    const isConfigured = isEnvVarConfigured(varDef.name, value);

    const envVar: EnvVariable = {
      ...varDef,
      value,
      isConfigured
    };

    if (isConfigured) {
      configuredVars.push(envVar);
    } else {
      missingVars.push(envVar);
    }
  });

  const totalVars = EXTERNAL_ENV_VARIABLES_DEFINITION.length;
  const configuredCount = configuredVars.length;
  // Para variables externas, no hay requeridas - todas son opcionales
  const isFullyConfigured = true; // Siempre está "completo" porque no hay requeridas

  return {
    isFullyConfigured,
    configuredVars,
    missingVars,
    totalVars,
    configuredCount
  };
}

/**
 * Obtiene solo las variables configuradas
 */
export function getConfiguredEnvVars(): EnvVariable[] {
  const config = getEnvConfig();
  return config.configuredVars;
}

/**
 * Obtiene solo las variables faltantes
 */
export function getMissingEnvVars(): EnvVariable[] {
  const config = getEnvConfig();
  return config.missingVars;
}

/**
 * Obtiene las variables requeridas faltantes (siempre vacío para variables externas)
 */
export function getMissingRequiredEnvVars(): EnvVariable[] {
  // Para variables externas, no hay requeridas
  return [];
}

/**
 * Verifica si todas las variables requeridas están configuradas (siempre true para variables externas)
 */
export function areRequiredEnvVarsConfigured(): boolean {
  // Para variables externas, no hay requeridas, por lo que siempre está "configurado"
  return true;
}

/**
 * Obtiene el estado de configuración como texto legible
 */
export function getEnvConfigStatus(): string {
  const config = getEnvConfig();
  
  if (config.configuredCount === config.totalVars) {
    return `✅ Todas las conexiones externas configuradas (${config.configuredCount}/${config.totalVars})`;
  }
  
  const missingOptional = config.missingVars.length;
  
  if (missingOptional > 0) {
    return `🔧 ${missingOptional} conexiones externas disponibles para configurar (${config.configuredCount}/${config.totalVars})`;
  }
  
  return `✅ Infraestructura lista (${config.configuredCount}/${config.totalVars} conexiones externas)`;
}

/**
 * Obtiene una descripción detallada del estado de configuración
 */
export function getEnvConfigDescription(): string {
  const config = getEnvConfig();
  
  if (config.configuredCount === config.totalVars) {
    return 'Tu infraestructura está completamente configurada. Todas las conexiones externas están listas.';
  }
  
  const missingOptional = config.missingVars;
  
  let description = 'Tu infraestructura base está lista y funcionando. ';
  
  if (missingOptional.length > 0) {
    description += `Puedes configurar ${missingOptional.length} conexiones externas opcionales para funcionalidades adicionales: ${missingOptional.map(v => v.name).join(', ')}.`;
  }
  
  return description;
}

/**
 * Valida una variable de entorno específica
 */
export function validateEnvVar(varName: string, value: string): { isValid: boolean; error?: string } {
  const varDef = EXTERNAL_ENV_VARIABLES_DEFINITION.find(v => v.name === varName);
  
  if (!varDef) {
    return { isValid: false, error: 'Variable de entorno no reconocida' };
  }
  
  // Para variables externas, no hay requeridas
  if (!value || value.trim() === '') {
    return { isValid: true }; // Vacío está permitido para variables opcionales
  }
  
  if (!isEnvVarConfigured(varName, value)) {
    switch (varDef.type) {
      case 'url':
        return { isValid: false, error: 'Debe ser una URL válida' };
      case 'key':
        return { isValid: false, error: 'Debe tener al menos 10 caracteres' };
      case 'text':
        return { isValid: false, error: 'Debe tener al menos 3 caracteres' };
      default:
        return { isValid: false, error: 'Formato inválido' };
    }
  }
  
  return { isValid: true };
}

/**
 * Obtiene instrucciones de configuración para una variable específica
 */
export function getEnvVarInstructions(varName: string): string {
  const instructions: Record<string, string> = {
    'SHOPIFY_SHOP_DOMAIN': 'Ve a tu tienda Shopify Admin y copia el dominio de tu tienda (sin .myshopify.com). Ejemplo: si tu tienda es "mi-tienda.myshopify.com", ingresa "mi-tienda".',
    'SHOPIFY_ACCESS_TOKEN': 'Ve a tu tienda Shopify Admin → Settings → Apps and sales channels → Develop apps → Create an app → Admin API access scopes, y copia el Access Token.',
    'SHOPIFY_WEBHOOK_SECRET': 'En la misma app de Shopify, ve a Webhooks y crea un webhook. Copia el Webhook secret que se genera automáticamente.'
  };
  
  return instructions[varName] || 'Consulta la documentación para obtener más información sobre esta conexión externa.';
}
