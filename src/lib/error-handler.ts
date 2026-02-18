// error-handler.ts - Utilidades para manejo de errores
export interface ErrorInfo {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  action?: string;
}

export const ERROR_CODES = {
  // Errores de conexión
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  BACKEND_UNAVAILABLE: 'BACKEND_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // Errores de Shopify
  SHOPIFY_UNAUTHORIZED: 'SHOPIFY_UNAUTHORIZED',
  SHOPIFY_FORBIDDEN: 'SHOPIFY_FORBIDDEN',
  SHOPIFY_NOT_FOUND: 'SHOPIFY_NOT_FOUND',
  SHOPIFY_RATE_LIMITED: 'SHOPIFY_RATE_LIMITED',
  SHOPIFY_SERVER_ERROR: 'SHOPIFY_SERVER_ERROR',
  
  // Errores de datos
  DATA_FETCH_ERROR: 'DATA_FETCH_ERROR',
  DATA_PARSE_ERROR: 'DATA_PARSE_ERROR',
  
  // Errores de aplicación
  INITIALIZATION_ERROR: 'INITIALIZATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  [ERROR_CODES.CONNECTION_ERROR]: {
    code: ERROR_CODES.CONNECTION_ERROR,
    message: 'No se pudo conectar con el servidor',
    severity: 'high',
    action: 'Verifica tu conexión a internet'
  },
  [ERROR_CODES.BACKEND_UNAVAILABLE]: {
    code: ERROR_CODES.BACKEND_UNAVAILABLE,
    message: 'Backend no disponible',
    severity: 'high',
    action: 'Asegúrate de que el servidor esté ejecutándose en el puerto 3001'
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    code: ERROR_CODES.NETWORK_ERROR,
    message: 'Error de red',
    severity: 'medium',
    action: 'Verifica tu conexión a internet'
  },
  [ERROR_CODES.SHOPIFY_UNAUTHORIZED]: {
    code: ERROR_CODES.SHOPIFY_UNAUTHORIZED,
    message: 'Token de acceso inválido o expirado',
    severity: 'high',
    action: 'Verifica tus credenciales de Shopify'
  },
  [ERROR_CODES.SHOPIFY_FORBIDDEN]: {
    code: ERROR_CODES.SHOPIFY_FORBIDDEN,
    message: 'Permisos insuficientes',
    severity: 'high',
    action: 'Revisa los permisos de tu aplicación de Shopify'
  },
  [ERROR_CODES.SHOPIFY_NOT_FOUND]: {
    code: ERROR_CODES.SHOPIFY_NOT_FOUND,
    message: 'Recurso no encontrado',
    severity: 'medium',
    action: 'Verifica la URL y el dominio de tu tienda'
  },
  [ERROR_CODES.SHOPIFY_RATE_LIMITED]: {
    code: ERROR_CODES.SHOPIFY_RATE_LIMITED,
    message: 'Límite de API excedido',
    severity: 'medium',
    action: 'Espera unos minutos y vuelve a intentar'
  },
  [ERROR_CODES.SHOPIFY_SERVER_ERROR]: {
    code: ERROR_CODES.SHOPIFY_SERVER_ERROR,
    message: 'Error interno del servidor de Shopify',
    severity: 'medium',
    action: 'Intenta nuevamente en unos minutos'
  },
  [ERROR_CODES.DATA_FETCH_ERROR]: {
    code: ERROR_CODES.DATA_FETCH_ERROR,
    message: 'Error al obtener datos',
    severity: 'medium',
    action: 'Intenta recargar la página'
  },
  [ERROR_CODES.DATA_PARSE_ERROR]: {
    code: ERROR_CODES.DATA_PARSE_ERROR,
    message: 'Error al procesar datos',
    severity: 'low',
    action: 'Los datos se mostrarán cuando estén disponibles'
  },
  [ERROR_CODES.INITIALIZATION_ERROR]: {
    code: ERROR_CODES.INITIALIZATION_ERROR,
    message: 'Error al inicializar la aplicación',
    severity: 'high',
    action: 'Recarga la página o contacta al soporte'
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: 'Error desconocido',
    severity: 'medium',
    action: 'Intenta recargar la página'
  }
};

export const getErrorInfo = (errorCode: string): ErrorInfo => {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
};

export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  return 'Error desconocido';
};

export const getErrorSeverity = (errorCode: string): 'low' | 'medium' | 'high' => {
  const errorInfo = getErrorInfo(errorCode);
  return errorInfo.severity;
};

export const shouldShowError = (errorCode: string): boolean => {
  const severity = getErrorSeverity(errorCode);
  return severity === 'high' || severity === 'medium';
};

export const getErrorAction = (errorCode: string): string | undefined => {
  const errorInfo = getErrorInfo(errorCode);
  return errorInfo.action;
};
