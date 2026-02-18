/**
 * Utilidades para manejar métricas avanzadas de Shopify
 * Adaptado a la estructura existente del proyecto
 */

import { supabase } from '@/integrations/supabase/client';

// Tipos para las métricas de Shopify
export interface ShopifyMetrics {
  timestamp: string;
  period: {
    start: string;
    end: string;
  };
  date_range: string;
  ventas: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    daily_sales: Array<{
      date: string;
      amount: number;
    }>;
  };
  productos: {
    top_products: Array<{
      id: string;
      name: string;
      quantity_sold: number;
      revenue: number;
    }>;
    total_stock: number;
    low_stock_products: number;
    inventory_value: number;
  };
  clientes: {
    new_customers: number;
    returning_customers: number;
    retention_rate: number;
  };
  performance: {
    conversion_rate: number;
    fulfilled_orders: number;
    fulfillment_rate: number;
  };
}

export interface MetricsSnapshot {
  id: string;
  timestamp: string;
  period_start: string;
  period_end: string;
  date_range: string;
  metrics: ShopifyMetrics;
  created_at: string;
}

export type DateRange = '7d' | '30d' | '90d';

// Función para obtener métricas avanzadas de Shopify
export const fetchAdvancedShopifyMetrics = async (
  dateRange: DateRange = '30d',
  saveSnapshot: boolean = true
): Promise<ShopifyMetrics> => {
  try {
    const { data, error } = await supabase.functions.invoke('shopify-metrics-advanced', {
      body: {
        date_range: dateRange,
        save_snapshot: saveSnapshot
      }
    });

    if (error) {
      throw new Error(`Error en la función: ${error.message}`);
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as ShopifyMetrics;
  } catch (error) {
    console.error('Error fetching advanced Shopify metrics:', error);
    throw error;
  }
};

// Función para obtener métricas básicas (usando la función existente)
export const fetchBasicShopifyMetrics = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('shopify-analytics');
    
    if (error) {
      throw new Error(`Error en la función: ${error.message}`);
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Error fetching basic Shopify metrics:', error);
    throw error;
  }
};

// Función para obtener snapshots históricos de métricas
export const fetchMetricsHistory = async (
  dateRange: DateRange = '30d',
  limit: number = 10
): Promise<MetricsSnapshot[]> => {
  try {
    const { data, error } = await supabase
      .from('shopify_metrics_snapshots')
      .select('*')
      .eq('date_range', dateRange)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error obteniendo historial: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    throw error;
  }
};

// Función para obtener el último snapshot
export const fetchLatestMetricsSnapshot = async (
  dateRange: DateRange = '30d'
): Promise<MetricsSnapshot | null> => {
  try {
    const { data, error } = await supabase
      .from('shopify_metrics_snapshots')
      .select('*')
      .eq('date_range', dateRange)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Error obteniendo último snapshot: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching latest metrics snapshot:', error);
    return null;
  }
};

// Función para formatear números de moneda
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Función para formatear porcentajes
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Función para formatear fechas
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Función para calcular el cambio porcentual entre dos valores
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Función para obtener el color de la tendencia
export const getTrendColor = (change: number): 'success' | 'destructive' => {
  return change >= 0 ? 'success' : 'destructive';
};

// Función para obtener el tipo de cambio
export const getChangeType = (change: number): 'increase' | 'decrease' => {
  return change >= 0 ? 'increase' : 'decrease';
};

// Función para convertir métricas avanzadas al formato de MetricCard existente
export const convertToMetricCardData = (metrics: ShopifyMetrics) => {
  return [
    {
      title: "Revenue Total",
      value: formatCurrency(metrics.ventas.total_revenue),
      change: {
        value: Math.abs(0), // Se calculará con datos históricos
        type: "increase" as const
      },
      icon: "DollarSign" as const,
      color: "success" as const,
      description: `Últimos ${metrics.date_range}`
    },
    {
      title: "Pedidos Totales",
      value: metrics.ventas.total_orders.toString(),
      change: {
        value: Math.abs(0), // Se calculará con datos históricos
        type: "increase" as const
      },
      icon: "ShoppingCart" as const,
      color: "primary" as const,
      description: `Promedio: ${formatCurrency(metrics.ventas.average_order_value)}`
    },
    {
      title: "Nuevos Clientes",
      value: metrics.clientes.new_customers.toString(),
      change: {
        value: Math.abs(0), // Se calculará con datos históricos
        type: "increase" as const
      },
      icon: "Users" as const,
      color: "primary" as const,
      description: `Retención: ${formatPercentage(metrics.clientes.retention_rate)}`
    },
    {
      title: "Tasa Conversión",
      value: formatPercentage(metrics.performance.conversion_rate),
      change: {
        value: Math.abs(0), // Se calculará con datos históricos
        type: "increase" as const
      },
      icon: "TrendingUp" as const,
      color: "success" as const,
      description: `${metrics.performance.fulfilled_orders} enviados`
    }
  ];
};
