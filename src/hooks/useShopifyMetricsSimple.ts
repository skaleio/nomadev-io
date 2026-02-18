import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useShopifyConnection } from './useShopifyConnection';

export interface ShopifyMetrics {
  timestamp: string;
  ventas: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
  };
  clientes: {
    new_customers: number;
    returning_customers: number;
    retention_rate: number;
  };
  productos: {
    low_stock_products: number;
    inventory_value: number;
    top_products: Array<{
      id: number;
      name: string;
      quantity_sold: number;
      revenue: number;
    }>;
  };
}

export const useShopifyMetricsSimple = (dateRange: '7d' | '30d' | '90d' = '30d') => {
  const [metrics, setMetrics] = useState<ShopifyMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { isConnected: isShopifyConnected } = useShopifyConnection();

  // Función para obtener métricas desde Supabase
  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    // Solo obtener métricas si hay una conexión real con Shopify
    if (!isShopifyConnected) {
      setMetrics(null);
      setError('No hay conexión con Shopify');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calcular fechas basadas en el rango seleccionado
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Consultar métricas desde Supabase
      const { data: shopifyData, error: shopifyError } = await supabase
        .from('shopify_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (shopifyError) {
        throw new Error(`Error al obtener métricas: ${shopifyError.message}`);
      }

      if (shopifyData && shopifyData.length > 0) {
        const latestData = shopifyData[0];
        setMetrics({
          timestamp: latestData.created_at,
          ventas: {
            total_revenue: latestData.total_revenue || 0,
            total_orders: latestData.total_orders || 0,
            average_order_value: latestData.average_order_value || 0,
          },
          clientes: {
            new_customers: latestData.new_customers || 0,
            returning_customers: latestData.returning_customers || 0,
            retention_rate: latestData.retention_rate || 0,
          },
          productos: {
            low_stock_products: latestData.low_stock_products || 0,
            inventory_value: latestData.inventory_value || 0,
            top_products: latestData.top_products || [],
          },
        });
      } else {
        // Si no hay datos reales, no mostrar métricas simuladas
        setMetrics(null);
        setError('No se encontraron métricas para el período seleccionado');
      }
    } catch (err) {
      console.error('Error fetching Shopify metrics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al obtener métricas');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, isShopifyConnected]);

  // Cargar métricas automáticamente cuando cambie el usuario o el rango de fechas
  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user, dateRange, fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    fetchMetrics,
  };
};
