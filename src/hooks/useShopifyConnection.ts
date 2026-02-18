import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface ShopifyConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  shopDomain?: string;
  lastConnected?: string;
}

/**
 * Hook para verificar el estado de conexión con Shopify
 */
export function useShopifyConnection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ShopifyConnectionStatus>({
    isConnected: false,
    isLoading: true,
    error: null
  });

  // Verificar conexión con Shopify
  const checkConnection = useCallback(async () => {
    if (!user?.id) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Verificar si existe configuración de Shopify en la base de datos
      const { data: config, error: configError } = await supabase
        .from('user_external_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('service_name', 'shopify')
        .eq('is_active', true)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      if (!config) {
        setStatus({
          isConnected: false,
          isLoading: false,
          error: null
        });
        return;
      }

      // Verificar si la configuración tiene los datos necesarios
      const configData = config.config_data;
      if (!configData || !configData.shop_domain || !configData.access_token) {
        setStatus({
          isConnected: false,
          isLoading: false,
          error: 'Configuración incompleta'
        });
        return;
      }

      // Intentar hacer una petición de prueba a Shopify
      try {
        const testResponse = await fetch(
          `https://${configData.shop_domain}.myshopify.com/admin/api/2024-01/shop.json`,
          {
            headers: {
              'X-Shopify-Access-Token': configData.access_token,
              'Content-Type': 'application/json'
            }
          }
        );

        if (testResponse.ok) {
          setStatus({
            isConnected: true,
            isLoading: false,
            error: null,
            shopDomain: configData.shop_domain,
            lastConnected: config.updated_at
          });
        } else {
          setStatus({
            isConnected: false,
            isLoading: false,
            error: 'Token de acceso inválido o expirado'
          });
        }
      } catch (apiError) {
        setStatus({
          isConnected: false,
          isLoading: false,
          error: 'Error al conectar con Shopify API'
        });
      }

    } catch (error) {
      console.error('Error verificando conexión Shopify:', error);
      setStatus({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error inesperado'
      });
    }
  }, [user?.id]);

  // Verificar conexión al cargar y cuando cambie el usuario
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    ...status,
    refresh: checkConnection
  };
}

/**
 * Hook simplificado para obtener solo el estado de conexión
 */
export function useShopifyConnectionStatus() {
  const { isConnected, isLoading, error } = useShopifyConnection();
  
  return {
    isConnected,
    isLoading,
    hasError: !!error,
    error
  };
}
