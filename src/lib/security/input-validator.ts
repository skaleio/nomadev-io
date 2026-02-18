import DOMPurify from 'dompurify';
import validator from 'validator';

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
}

/**
 * Valida y sanitiza inputs de usuario
 */
export class InputValidator {
  /**
   * Valida y sanitiza texto general
   */
  static validateText(input: string, options: {
    minLength?: number;
    maxLength?: number;
    allowHtml?: boolean;
    required?: boolean;
  } = {}): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = input;

    // Verificar si es requerido
    if (options.required && (!input || input.trim().length === 0)) {
      errors.push('Este campo es requerido');
      return { isValid: false, sanitizedValue: '', errors };
    }

    // Sanitizar HTML si no está permitido
    if (!options.allowHtml) {
      sanitizedValue = DOMPurify.sanitize(input, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
      });
    }

    // Validar longitud
    if (options.minLength && sanitizedValue.length < options.minLength) {
      errors.push(`Mínimo ${options.minLength} caracteres`);
    }
    if (options.maxLength && sanitizedValue.length > options.maxLength) {
      errors.push(`Máximo ${options.maxLength} caracteres`);
    }

    // Detectar intentos de inyección
    if (this.detectInjectionAttempts(sanitizedValue)) {
      errors.push('Contenido no permitido detectado');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      errors
    };
  }

  /**
   * Valida emails
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || email.trim().length === 0) {
      errors.push('Email es requerido');
      return { isValid: false, sanitizedValue: '', errors };
    }

    const sanitized = validator.normalizeEmail(email.trim());
    
    if (!sanitized || !validator.isEmail(sanitized)) {
      errors.push('Email inválido');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized || '',
      errors
    };
  }

  /**
   * Valida contraseñas
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password || password.length === 0) {
      errors.push('Contraseña es requerida');
      return { isValid: false, sanitizedValue: '', errors };
    }

    if (password.length < 8) {
      errors.push('Mínimo 8 caracteres');
    }
    if (password.length > 128) {
      errors.push('Máximo 128 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Debe contener al menos un carácter especial');
    }

    // Detectar contraseñas comunes
    if (this.isCommonPassword(password)) {
      errors.push('Contraseña muy común, elige una más segura');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: password,
      errors
    };
  }

  /**
   * Valida URLs
   */
  static validateURL(url: string): ValidationResult {
    const errors: string[] = [];
    
    if (!url || url.trim().length === 0) {
      errors.push('URL es requerida');
      return { isValid: false, sanitizedValue: '', errors };
    }

    const sanitized = url.trim();
    
    if (!validator.isURL(sanitized, { 
      protocols: ['http', 'https'],
      require_protocol: true 
    })) {
      errors.push('URL inválida');
    }

    // Verificar dominios permitidos
    if (!this.isAllowedDomain(sanitized)) {
      errors.push('Dominio no permitido');
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized,
      errors
    };
  }

  /**
   * Valida números
   */
  static validateNumber(input: string, options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}): ValidationResult {
    const errors: string[] = [];
    
    if (!input || input.trim().length === 0) {
      errors.push('Número es requerido');
      return { isValid: false, sanitizedValue: '', errors };
    }

    const sanitized = input.trim();
    const num = parseFloat(sanitized);
    
    if (isNaN(num)) {
      errors.push('No es un número válido');
      return { isValid: false, sanitizedValue: '', errors };
    }

    if (options.integer && !Number.isInteger(num)) {
      errors.push('Debe ser un número entero');
    }
    if (options.min !== undefined && num < options.min) {
      errors.push(`Mínimo ${options.min}`);
    }
    if (options.max !== undefined && num > options.max) {
      errors.push(`Máximo ${options.max}`);
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue: sanitized,
      errors
    };
  }

  /**
   * Detecta intentos de inyección
   */
  private static detectInjectionAttempts(input: string): boolean {
    const patterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<style[^>]*>.*?<\/style>/gi,
      /expression\s*\(/gi,
      /url\s*\(/gi,
      /@import/gi,
      /union\s+select/gi,
      /select\s+.*\s+from/gi,
      /insert\s+into/gi,
      /update\s+.*\s+set/gi,
      /delete\s+from/gi,
      /drop\s+table/gi,
      /create\s+table/gi,
      /alter\s+table/gi,
      /exec\s*\(/gi,
      /execute\s*\(/gi,
      /sp_\w+/gi,
      /xp_\w+/gi,
      /\.\.\//gi,
      /\.\.\\/gi,
      /<%.*?%>/gi,
      /<\?.*?\?>/gi
    ];

    return patterns.some(pattern => pattern.test(input));
  }

  /**
   * Verifica si es una contraseña común
   */
  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      '1234567890', 'password1', 'qwerty123', 'dragon', 'master'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Verifica si el dominio está permitido
   */
  private static isAllowedDomain(url: string): boolean {
    const allowedDomains = [
      'nomadev.io',
      'www.nomadev.io',
      'supabase.co',
      'shopify.com',
      'evolution.com',
      'localhost'
    ];
    
    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }
}
