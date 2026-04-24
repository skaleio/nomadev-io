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

// Fuente única de verdad: tabla `shopify_connections` (escrita por shopify-oauth-callback).
export function useShopifyConnection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ShopifyConnectionStatus>({
    isConnected: false,
    isLoading: true,
    error: null
  });

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
      const { data: connection, error: connError } = await supabase
        .from('shopify_connections')
        .select('shop_domain, updated_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (connError) {
        throw connError;
      }

      if (!connection?.shop_domain) {
        setStatus({ isConnected: false, isLoading: false, error: null });
        return;
      }

      const domain = connection.shop_domain.replace(/\.myshopify\.com$/, '');
      setStatus({
        isConnected: true,
        isLoading: false,
        error: null,
        shopDomain: domain,
        lastConnected: connection.updated_at ?? undefined
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

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    ...status,
    refresh: checkConnection
  };
}

export function useShopifyConnectionStatus() {
  const { isConnected, isLoading, error } = useShopifyConnection();

  return {
    isConnected,
    isLoading,
    hasError: !!error,
    error
  };
}
