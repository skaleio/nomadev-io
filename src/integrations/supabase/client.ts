import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Configuración de Supabase para nomadev.io (variables de entorno en build/runtime)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://rxgrhvrseejzbzneabrz.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4Z3JodnJzZWVqemJ6bmVhYnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NzQ3NzAsImV4cCI6MjA3NDE1MDc3MH0.sHoHzDjhgapAn3_Io4jSGUQw5gmE9cO_WFdRM1FYAp4";

// Crear cliente de Supabase con configuración optimizada
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'nomadev-io@1.0.0'
    }
  }
});

// Función para verificar la conexión
export const testSupabaseConnection = async () => {
  try {
    // Verificar conexión usando auth en lugar de una tabla específica
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'Auth session missing!') {
      console.error('Error de conexión a Supabase:', error);
      return false;
    }
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (err) {
    console.error('❌ Error de conexión a Supabase:', err);
    return false;
  }
};