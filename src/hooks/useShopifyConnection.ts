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

  // Verificar conexión con Shopify (lee shopify_connections primero, luego user_external_configs)
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

    const testShopifyToken = async (shopDomain: string, accessToken: string, lastConnected?: string) => {
      const domain = shopDomain.replace(/\.myshopify\.com$/, '');
      const res = await fetch(
        `https://${domain}.myshopify.com/admin/api/2024-01/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      if (res.ok) {
        setStatus({
          isConnected: true,
          isLoading: false,
          error: null,
          shopDomain: domain,
          lastConnected: lastConnected ?? undefined
        });
      } else {
        setStatus({
          isConnected: false,
          isLoading: false,
          error: 'Token de acceso inválido o expirado'
        });
      }
    };

    try {
      // 1) Intentar shopify_connections (donde escribe el OAuth)
      const { data: connection, error: connError } = await supabase
        .from('shopify_connections')
        .select('shop_domain, access_token, updated_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!connError && connection?.shop_domain && connection?.access_token) {
        try {
          await testShopifyToken(connection.shop_domain, connection.access_token, connection.updated_at);
          return;
        } catch {
          // Token falló; seguir a user_external_configs
        }
      }

      // 2) Fallback: user_external_configs (conexión manual / legacy)
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

      const configData = config?.config_data;
      if (configData?.shop_domain && configData?.access_token) {
        try {
          await testShopifyToken(configData.shop_domain, configData.access_token, config?.updated_at);
          return;
        } catch {
          setStatus({
            isConnected: false,
            isLoading: false,
            error: 'Error al conectar con Shopify API'
          });
          return;
        }
      }

      setStatus({
        isConnected: false,
        isLoading: false,
        error: null
      });
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
