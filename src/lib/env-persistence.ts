/**
 * Sistema de persistencia para variables de entorno
 * Permite guardar y cargar configuraciones de variables de entorno en la base de datos
 */

import { supabase } from '../integrations/supabase/client';
import { getEnvConfig, type EnvVariable } from './env-config';

export interface EnvConfigRecord {
  id: string;
  user_id: string;
  variable_name: string;
  variable_value: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserEnvConfig {
  userId: string;
  variables: EnvVariable[];
  lastUpdated: string;
}

/**
 * Encripta un valor usando una clave simple (en producción usar una clave más segura)
 */
function encryptValue(value: string): string {
  // Implementación simple de encriptación (en producción usar crypto-js o similar)
  return btoa(value); // Base64 encoding
}

/**
 * Desencripta un valor
 */
function decryptValue(encryptedValue: string): string {
  try {
    return atob(encryptedValue); // Base64 decoding
  } catch {
    return encryptedValue; // Si falla, devolver el valor original
  }
}

/**
 * Guarda la configuración de variables de entorno de un usuario
 */
export async function saveUserEnvConfig(
  userId: string, 
  variables: EnvVariable[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Primero, eliminar configuraciones existentes del usuario
    const { error: deleteError } = await supabase
      .from('user_env_configs')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error eliminando configuraciones existentes:', deleteError);
      return { success: false, error: deleteError.message };
    }

    // Preparar datos para inserción
    const configRecords = variables
      .filter(v => v.isConfigured && v.value)
      .map(v => ({
        user_id: userId,
        variable_name: v.name,
        variable_value: encryptValue(v.value || ''),
        is_encrypted: true
      }));

    if (configRecords.length === 0) {
      return { success: true };
    }

    // Insertar nuevas configuraciones
    const { error: insertError } = await supabase
      .from('user_env_configs')
      .insert(configRecords);

    if (insertError) {
      console.error('Error guardando configuraciones:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('✅ Configuración de variables de entorno guardada exitosamente');
    return { success: true };
  } catch (error) {
    console.error('Error inesperado guardando configuración:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado' 
    };
  }
}

/**
 * Carga la configuración de variables de entorno de un usuario
 */
export async function loadUserEnvConfig(
  userId: string
): Promise<{ success: boolean; config?: UserEnvConfig; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_env_configs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando configuración:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { 
        success: true, 
        config: {
          userId,
          variables: [],
          lastUpdated: new Date().toISOString()
        }
      };
    }

    // Convertir registros a variables de entorno
    const variables: EnvVariable[] = data.map(record => {
      const decryptedValue = record.is_encrypted 
        ? decryptValue(record.variable_value)
        : record.variable_value;

      return {
        name: record.variable_name,
        value: decryptedValue,
        type: 'text', // Se determinará basado en el nombre
        required: false, // Se determinará basado en el nombre
        description: '',
        placeholder: '',
        isConfigured: true
      };
    });

    const config: UserEnvConfig = {
      userId,
      variables,
      lastUpdated: data[0]?.updated_at || new Date().toISOString()
    };

    console.log('✅ Configuración de variables de entorno cargada exitosamente');
    return { success: true, config };
  } catch (error) {
    console.error('Error inesperado cargando configuración:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado' 
    };
  }
}

/**
 * Elimina la configuración de variables de entorno de un usuario
 */
export async function deleteUserEnvConfig(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_env_configs')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error eliminando configuración:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Configuración de variables de entorno eliminada exitosamente');
    return { success: true };
  } catch (error) {
    console.error('Error inesperado eliminando configuración:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado' 
    };
  }
}

/**
 * Sincroniza la configuración actual con la base de datos
 */
export async function syncEnvConfigWithDatabase(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentConfig = getEnvConfig();
    const configuredVars = currentConfig.configuredVars;

    return await saveUserEnvConfig(userId, configuredVars);
  } catch (error) {
    console.error('Error sincronizando configuración:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado' 
    };
  }
}

/**
 * Verifica si un usuario tiene configuración guardada
 */
export async function hasUserEnvConfig(
  userId: string
): Promise<{ hasConfig: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_env_configs')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error verificando configuración:', error);
      return { hasConfig: false, error: error.message };
    }

    return { hasConfig: (data && data.length > 0) || false };
  } catch (error) {
    console.error('Error inesperado verificando configuración:', error);
    return { 
      hasConfig: false, 
      error: error instanceof Error ? error.message : 'Error inesperado' 
    };
  }
}

/**
 * Obtiene estadísticas de configuración de usuarios
 */
export async function getEnvConfigStats(): Promise<{
  success: boolean;
  stats?: {
    totalUsers: number;
    configuredUsers: number;
    mostConfiguredVar: string;
    leastConfiguredVar: string;
  };
  error?: string;
}> {
  try {
    // Obtener total de usuarios con configuración
    const { data: configData, error: configError } = await supabase
      .from('user_env_configs')
      .select('user_id, variable_name');

    if (configError) {
      console.error('Error obteniendo estadísticas:', configError);
      return { success: false, error: configError.message };
    }

    // Contar usuarios únicos
    const uniqueUsers = new Set(configData?.map(d => d.user_id) || []);
    const configuredUsers = uniqueUsers.size;

    // Contar variables más/menos configuradas
    const varCounts: { [key: string]: number } = {};
    configData?.forEach(d => {
      varCounts[d.variable_name] = (varCounts[d.variable_name] || 0) + 1;
    });

    const sortedVars = Object.entries(varCounts).sort((a, b) => b[1] - a[1]);
    const mostConfiguredVar = sortedVars[0]?.[0] || 'N/A';
    const leastConfiguredVar = sortedVars[sortedVars.length - 1]?.[0] || 'N/A';

    return {
      success: true,
      stats: {
        totalUsers: configuredUsers, // Aproximación
        configuredUsers,
        mostConfiguredVar,
        leastConfiguredVar
      }
    };
  } catch (error) {
    console.error('Error inesperado obteniendo estadísticas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado' 
    };
  }
}
