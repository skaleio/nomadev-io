import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Importante: NO tirar throw aquí. Este módulo lo importa media app (auth, contextos,
// hooks, páginas...). Un throw sincrónico al cargar el módulo deja la SPA en pantalla
// negra porque React nunca llega a montar. En su lugar, avisamos por consola y
// exportamos un cliente con placeholders: las llamadas reales fallarán de forma
// controlada solo cuando se intente hablar con Supabase.
if (!isSupabaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'La app arranca en modo degradado: la UI funciona, pero las llamadas a Supabase ' +
      'fallarán hasta que copies .env.example a .env y completes los valores.'
  );
}

const effectiveUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const effectiveAnonKey = SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase: SupabaseClient<Database> = createClient<Database>(
  effectiveUrl,
  effectiveAnonKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
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
  }
);

export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.auth.getSession();
    if (error && error.message !== 'Auth session missing!') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};
