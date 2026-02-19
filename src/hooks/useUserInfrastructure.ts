import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserInfrastructure, 
  toggleUserInfrastructure,
  type UserInfrastructure 
} from '@/lib/auto-infrastructure';

/**
 * Hook para manejar la infraestructura del usuario actual
 */
export function useUserInfrastructure() {
  const { user } = useAuth();
  const [infrastructure, setInfrastructure] = useState<UserInfrastructure | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar infraestructura del usuario
  const loadInfrastructure = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserInfrastructure(user.id);
      
      if (result.success && result.infrastructure) {
        setInfrastructure(result.infrastructure);
      } else {
        setError(result.error || 'Error cargando infraestructura');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Activar/desactivar infraestructura
  const toggleInfrastructure = useCallback(async (isActive: boolean) => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await toggleUserInfrastructure(user.id, isActive);
      
      if (result.success) {
        // Recargar infraestructura
        await loadInfrastructure();
      } else {
        setError(result.error || 'Error actualizando infraestructura');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadInfrastructure]);

  // Cargar infraestructura cuando cambie el usuario
  useEffect(() => {
    if (user?.id) {
      loadInfrastructure();
    } else {
      setInfrastructure(null);
    }
  }, [user?.id, loadInfrastructure]);

  return {
    infrastructure,
    isLoading,
    error,
    loadInfrastructure,
    toggleInfrastructure,
    isActive: infrastructure?.isActive || false,
    hasInfrastructure: !!infrastructure
  };
}

/**
 * Hook para verificar si una funcionalidad está disponible basada en la infraestructura
 */
export function useInfrastructureFeature(feature: string) {
  const { infrastructure, isActive } = useUserInfrastructure();

  const isFeatureAvailable = useCallback(() => {
    if (!infrastructure || !isActive) return false;

    switch (feature) {
      case 'database':
        return !!infrastructure.databaseSchema;
      case 'webhooks':
        return !!infrastructure.webhookUrl;
      case 'all':
        return !!(
          infrastructure.databaseSchema &&
          infrastructure.webhookUrl
        );
      default:
        return false;
    }
  }, [infrastructure, isActive, feature]);

  return {
    isAvailable: isFeatureAvailable(),
    isActive,
    hasInfrastructure: !!infrastructure
  };
}

/**
 * Hook para obtener información de la infraestructura del usuario
 */
export function useInfrastructureInfo() {
  const { infrastructure, isActive, hasInfrastructure } = useUserInfrastructure();

  const getInfo = useCallback(() => {
    if (!infrastructure) {
      return {
        status: 'not_configured',
        message: 'Infraestructura no configurada',
        details: []
      };
    }

    if (!isActive) {
      return {
        status: 'inactive',
        message: 'Infraestructura inactiva',
        details: [
          `Esquema DB: ${infrastructure.databaseSchema}`,
          `Webhook: ${infrastructure.webhookUrl}`
        ]
      };
    }

    return {
      status: 'active',
      message: 'Infraestructura activa y funcionando',
      details: [
        `Esquema DB: ${infrastructure.databaseSchema}`,
        `Webhook: ${infrastructure.webhookUrl}`,
        `Creada: ${new Date(infrastructure.createdAt).toLocaleDateString()}`
      ]
    };
  }, [infrastructure, isActive]);

  return {
    info: getInfo(),
    isActive,
    hasInfrastructure,
    infrastructure
  };
}
