import { useEffect, useRef, useCallback, useState } from 'react';
import { PERFORMANCE_CONFIG } from '@/config/performance';

/**
 * Hook para monitorear y optimizar el rendimiento
 */
export const usePerformance = () => {
  const observerRef = useRef<PerformanceObserver | null>(null);
  const metricsRef = useRef<Record<string, number>>({});

  // Función para medir el tiempo de renderizado
  const measureRenderTime = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      
      // Almacenar métrica
      metricsRef.current[`${componentName}_render_time`] = renderTime;
      
      // Alertar si el tiempo de renderizado es muy alto
      if (renderTime > 100) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, []);

  // Función para medir el tiempo de operaciones asíncronas
  const measureAsyncOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      console.log(`${operationName} completed in: ${operationTime.toFixed(2)}ms`);
      metricsRef.current[`${operationName}_time`] = operationTime;
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      console.error(`${operationName} failed after: ${operationTime.toFixed(2)}ms`, error);
      metricsRef.current[`${operationName}_error_time`] = operationTime;
      
      throw error;
    }
  }, []);

  // Función para debounce
  const useDebounce = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ): T => {
    const timeoutRef = useRef<NodeJS.Timeout>();
    
    return ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T;
  }, []);

  // Función para throttle
  const useThrottle = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ): T => {
    const lastCallRef = useRef<number>(0);
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    }) as T;
  }, []);

  // Función para lazy loading de imágenes
  const useLazyImage = useCallback((src: string, placeholder?: string) => {
    const [imageSrc, setImageSrc] = useState(placeholder || '');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [src]);

    const handleLoad = () => {
      setIsLoaded(true);
      setIsError(false);
    };

    const handleError = () => {
      setIsError(true);
      setIsLoaded(false);
    };

    return {
      ref: imgRef,
      src: imageSrc,
      isLoaded,
      isError,
      onLoad: handleLoad,
      onError: handleError
    };
  }, []);

  // Función para obtener métricas de rendimiento
  const getMetrics = useCallback(() => {
    return {
      ...metricsRef.current,
      memory: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null,
      navigation: performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    };
  }, []);

  // Función para limpiar métricas
  const clearMetrics = useCallback(() => {
    metricsRef.current = {};
  }, []);

  // Configurar observador de rendimiento
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            metricsRef.current[entry.name] = entry.duration;
          }
        }
      });

      observerRef.current.observe({ entryTypes: ['measure'] });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    measureRenderTime,
    measureAsyncOperation,
    useDebounce,
    useThrottle,
    useLazyImage,
    getMetrics,
    clearMetrics
  };
};

// Hook para lazy loading de componentes
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    importFunc()
      .then((module) => {
        setComponent(() => module.default);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [importFunc]);

  if (isLoading) {
    return fallback ? fallback : null;
  }

  if (error) {
    console.error('Error loading component:', error);
    return null;
  }

  return Component;
};
