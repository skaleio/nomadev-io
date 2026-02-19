/**
 * Sistema de Infraestructura Automatizada
 * Maneja la creación automática de recursos para cada usuario
 */

import { supabase } from '../integrations/supabase/client';

export interface UserInfrastructure {
  userId: string;
  databaseSchema: string;
  evolutionInstance: string;
  webhookUrl: string;
  apiKeys: {
    supabase: string;
    evolution: string;
    webhook: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface AutoConfigResult {
  success: boolean;
  infrastructure?: UserInfrastructure;
  error?: string;
}

/**
 * Crea automáticamente toda la infraestructura para un nuevo usuario
 */
export async function createUserInfrastructure(
  userId: string,
  userEmail: string
): Promise<AutoConfigResult> {
  try {
    console.log(`🚀 Creando infraestructura para usuario: ${userEmail}`);

    // 1. Crear esquema de base de datos único para el usuario
    const databaseSchema = `user_${userId.replace(/-/g, '_')}`;
    const webhookUrl = `${import.meta.env.VITE_APP_URL}/webhooks/${userId}`;

    // 2. Crear esquema en la base de datos
    const schemaResult = await createUserDatabaseSchema(databaseSchema);
    if (!schemaResult.success) {
      return { success: false, error: schemaResult.error };
    }

    // 3. Generar claves API únicas
    const apiKeys = await generateUserApiKeys(userId);

    // 4. Configurar webhooks
    const webhookResult = await setupUserWebhooks(userId, webhookUrl);
    if (!webhookResult.success) {
      return { success: false, error: webhookResult.error };
    }

    // 5. Guardar configuración en la base de datos
    const infrastructure: UserInfrastructure = {
      userId,
      databaseSchema,
      evolutionInstance: '', // Reservado; WhatsApp usará API oficial de Meta
      webhookUrl,
      apiKeys,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const saveResult = await saveUserInfrastructure(infrastructure);
    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    console.log(`✅ Infraestructura creada exitosamente para ${userEmail}`);
    return { success: true, infrastructure };

  } catch (error) {
    console.error('Error creando infraestructura:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado' 
    };
  }
}

/**
 * Crea un esquema de base de datos único para el usuario
 */
async function createUserDatabaseSchema(schemaName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Crear esquema
    const { error: schemaError } = await supabase.rpc('create_user_schema', {
      schema_name: schemaName
    });

    if (schemaError) {
      console.error('Error creando esquema:', schemaError);
      return { success: false, error: schemaError.message };
    }

    // Crear tablas básicas en el esquema
    const tables = [
      'orders', 'customers', 'products', 'messages', 'webhooks', 'analytics'
    ];

    for (const table of tables) {
      const { error: tableError } = await supabase.rpc('create_user_table', {
        schema_name: schemaName,
        table_name: table
      });

      if (tableError) {
        console.error(`Error creando tabla ${table}:`, tableError);
        return { success: false, error: tableError.message };
      }
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error creando esquema' 
    };
  }
}

/**
 * Genera claves API únicas para el usuario
 */
async function generateUserApiKeys(userId: string): Promise<UserInfrastructure['apiKeys']> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  return {
    supabase: `sk_${userId.substring(0, 8)}_${timestamp}_${randomSuffix}`,
    evolution: '', // Reservado para futura API Meta
    webhook: `wh_${userId.substring(0, 8)}_${timestamp}_${randomSuffix}`
  };
}

/**
 * Configura webhooks para el usuario
 */
async function setupUserWebhooks(
  userId: string, 
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Registrar webhook en la base de datos
    const { error } = await supabase
      .from('user_webhooks')
      .insert({
        user_id: userId,
        webhook_url: webhookUrl,
        events: ['order.created', 'order.updated', 'customer.created', 'message.received'],
        is_active: true
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error configurando webhooks' 
    };
  }
}

/**
 * Guarda la configuración de infraestructura del usuario
 */
async function saveUserInfrastructure(
  infrastructure: UserInfrastructure
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_infrastructure')
      .insert({
        user_id: infrastructure.userId,
        database_schema: infrastructure.databaseSchema,
        evolution_instance: infrastructure.evolutionInstance,
        webhook_url: infrastructure.webhookUrl,
        api_keys: infrastructure.apiKeys,
        is_active: infrastructure.isActive,
        created_at: infrastructure.createdAt
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error guardando infraestructura' 
    };
  }
}

/**
 * Obtiene la infraestructura de un usuario
 */
export async function getUserInfrastructure(
  userId: string
): Promise<{ success: boolean; infrastructure?: UserInfrastructure; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_infrastructure')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const infrastructure: UserInfrastructure = {
      userId: data.user_id,
      databaseSchema: data.database_schema,
      evolutionInstance: data.evolution_instance,
      webhookUrl: data.webhook_url,
      apiKeys: data.api_keys,
      isActive: data.is_active,
      createdAt: data.created_at
    };

    return { success: true, infrastructure };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error obteniendo infraestructura' 
    };
  }
}

/**
 * Activa/desactiva la infraestructura de un usuario
 */
export async function toggleUserInfrastructure(
  userId: string, 
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_infrastructure')
      .update({ is_active: isActive })
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error actualizando infraestructura' 
    };
  }
}

/**
 * Obtiene estadísticas de infraestructura
 */
export async function getInfrastructureStats(): Promise<{
  success: boolean;
  stats?: {
    totalUsers: number;
    activeUsers: number;
    totalInstances: number;
    totalWebhooks: number;
  };
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('user_infrastructure')
      .select('is_active');

    if (error) {
      return { success: false, error: error.message };
    }

    const totalUsers = data?.length || 0;
    const activeUsers = data?.filter(d => d.is_active).length || 0;

    return {
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalInstances: activeUsers, // Cada usuario activo tiene una instancia
        totalWebhooks: activeUsers   // Cada usuario activo tiene webhooks
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error obteniendo estadísticas' 
    };
  }
}
