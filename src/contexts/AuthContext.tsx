import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import {
  clearDropiSessionPrefs,
  clearExpectFreshDropiLoginMarker,
  consumeExpectFreshDropiLogin,
  markExpectFreshDropiLogin,
} from '@/lib/dropiSessionPrefs';
import { resetDropiImportedDataForUser } from '@/lib/resetDropiImportedData';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => Promise<void>;
  updatePassword: (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref con el id del usuario actualmente "vivo": cualquier promesa async (loadUserProfile,
  // side-effects de SIGNED_IN) que termine cuando ya cambió el id la descartamos. Evita
  // resucitar un user después de un logout.
  const currentUserIdRef = useRef<string | null>(null);

  const isAuthenticated = !!user && !!user.id;

  // Perfil "rápido" desde la sesión de Supabase, para desbloquear la UI al instante.
  // El perfil completo se hidrata en background.
  const buildQuickUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: supabaseUser.user_metadata?.first_name || 'Usuario',
    lastName: supabaseUser.user_metadata?.last_name || '',
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  // Aplica el usuario a partir de una sesión de Supabase, gestionando side-effects
  // que solo deben correr en un login "fresco" (no en INITIAL_SESSION ni token refresh).
  const applySession = (supabaseUser: SupabaseUser, opts: { fresh: boolean }) => {
    const uid = supabaseUser.id;
    currentUserIdRef.current = uid;
    setUser(buildQuickUser(supabaseUser));
    setIsLoading(false);

    if (opts.fresh) {
      const expectFresh = consumeExpectFreshDropiLogin();
      if (expectFresh) {
        clearDropiSessionPrefs(uid);
        try { localStorage.removeItem('dropi:lastImportAt'); } catch { /* noop */ }
        resetDropiImportedDataForUser(uid).catch(() => { /* best effort */ });
      }
    }

    // Hidratar el perfil completo sin bloquear la UI.
    loadUserProfile(supabaseUser).catch(() => { /* perfil rápido ya seteado */ });
  };

  // Único punto de escucha de cambios de auth. Supabase v2 dispara INITIAL_SESSION
  // automáticamente al suscribirse, así que NO necesitamos un getSession() manual.
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      switch (event) {
        case 'INITIAL_SESSION': {
          // Estado inicial al cargar la app. Si hay sesión persistida, entra; si no,
          // simplemente terminamos el loading sin tocar nada del servidor.
          if (session?.user) {
            applySession(session.user, { fresh: false });
          } else {
            currentUserIdRef.current = null;
            setUser(null);
            setIsLoading(false);
          }
          break;
        }
        case 'SIGNED_IN': {
          if (session?.user) applySession(session.user, { fresh: true });
          break;
        }
        case 'TOKEN_REFRESHED': {
          // Token renovado. Mantenemos el usuario; solo refrescamos campos básicos
          // por si Supabase actualizó email o metadata.
          if (session?.user) {
            currentUserIdRef.current = session.user.id;
            setUser((prev) => prev ? { ...prev, email: session.user.email || prev.email } : buildQuickUser(session.user));
          }
          break;
        }
        case 'USER_UPDATED': {
          if (session?.user) {
            currentUserIdRef.current = session.user.id;
            setUser(buildQuickUser(session.user));
            loadUserProfile(session.user).catch(() => { /* noop */ });
          }
          break;
        }
        case 'SIGNED_OUT': {
          currentUserIdRef.current = null;
          setUser(null);
          setIsLoading(false);
          break;
        }
        // PASSWORD_RECOVERY y otros: no necesitamos acción específica.
        default:
          break;
      }
    });

    // Failsafe: si en 8s no llegó INITIAL_SESSION (raro, pero protege contra cuelgues
    // del cliente), salimos del loading para no dejar la app en pantalla de carga.
    const failsafe = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 8000);

    return () => {
      isMounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    const uid = supabaseUser.id;
    // Si la sesión cambió antes de empezar, no hacemos nada.
    if (currentUserIdRef.current !== uid) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      // Si entre tanto el usuario cambió o cerró sesión, descartar el resultado.
      if (currentUserIdRef.current !== uid) return;

      if (error) {
        // Perfil no existe → crearlo. Cualquier otro error: dejamos el perfil "rápido".
        if (error.code === 'PGRST116') {
          await supabase.from('profiles').insert({
            id: uid,
            email: supabaseUser.email || '',
            first_name: supabaseUser.user_metadata?.first_name || 'Usuario',
            last_name: supabaseUser.user_metadata?.last_name || '',
          });
        }
        return;
      }

      if (currentUserIdRef.current !== uid) return;
      setUser({
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        isActive: true,
        createdAt: profile.created_at,
      });
    } catch (err) {
      console.warn('Perfil no se pudo hidratar, manteniendo perfil rápido:', err);
    }
  };

  const mapAuthErrorMessage = (msg: string): string => {
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.';
    if (msg.includes('Email not confirmed')) return 'Por favor confirma tu email antes de iniciar sesión.';
    if (msg.includes('Too many requests')) return 'Demasiados intentos. Espera unos minutos antes de volver a intentar.';
    if (msg.includes('Network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
      return 'Error de conexión. Verifica tu internet y que la app pueda conectar con Supabase.';
    }
    if (msg === 'LOGIN_TIMEOUT') {
      return 'La conexión con Supabase tardó demasiado. Verifica tu conexión a internet e intenta nuevamente.';
    }
    return msg || 'Error inesperado al iniciar sesión';
  };

  const login = async (email: string, password: string) => {
    setError(null);

    // Login de prueba solo si está habilitado por env (nunca en producción).
    const allowTestLogin = import.meta.env.VITE_ALLOW_TEST_LOGIN === 'true';
    const testEmail = import.meta.env.VITE_TEST_LOGIN_EMAIL;
    const testPassword = import.meta.env.VITE_TEST_LOGIN_PASSWORD;
    if (allowTestLogin && testEmail && testPassword && email === testEmail && password === testPassword) {
      clearDropiSessionPrefs('test-user-12345');
      try { localStorage.removeItem('dropi:lastImportAt'); } catch { /* noop */ }
      clearExpectFreshDropiLoginMarker();
      currentUserIdRef.current = 'test-user-12345';
      setUser({
        id: 'test-user-12345',
        email: testEmail,
        firstName: 'Usuario',
        lastName: 'Prueba',
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      setIsLoading(false);
      return;
    }

    markExpectFreshDropiLogin();

    // Race: (a) respuesta de la API, (b) evento SIGNED_IN del listener global, (c) timeout.
    // El (b) cubre el bug de supabase-js donde signInWithPassword no resuelve aunque
    // la auth haya tenido éxito.
    const LOGIN_TIMEOUT_MS = 15000;

    let signedInResolved = false;
    let onSignedIn!: () => void;
    const signedInPromise = new Promise<'event'>((resolve) => {
      onSignedIn = () => { signedInResolved = true; resolve('event'); };
    });
    const { data: { subscription: signedInSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) onSignedIn();
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), LOGIN_TIMEOUT_MS);
    });

    const authPromise = supabase.auth.signInWithPassword({ email, password }).then((res) => {
      if (res.error) throw res.error;
      return 'api' as const;
    });
    // Suppress unhandled rejection si el evento gana antes que la API rechace.
    authPromise.catch(() => { /* manejado en el race */ });

    try {
      await Promise.race([authPromise, signedInPromise, timeoutPromise]);
      // Si ganó el evento, no necesitamos esperar la respuesta de la API.
    } catch (err: unknown) {
      // Si el evento ya se resolvió antes que el error, consideramos el login OK
      // (el listener global ya seteó al usuario).
      if (signedInResolved) return;

      const msg = err instanceof Error ? err.message : String(err);
      const errorMessage = mapAuthErrorMessage(msg);
      setError(errorMessage);
      clearExpectFreshDropiLoginMarker();
      throw err instanceof Error ? err : new Error(errorMessage);
    } finally {
      signedInSub.unsubscribe();
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    markExpectFreshDropiLogin();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      // La redirección a Google la hace Supabase; al volver, onAuthStateChange actualiza el usuario.
    } catch (err: unknown) {
      clearExpectFreshDropiLoginMarker();
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setError(msg);
      throw err;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Crear perfil en background; el modal de verificación de email gestiona el flujo.
        supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
          })
          .then(({ error: profileError }) => {
            if (profileError) console.warn('Error creando perfil tras registro:', profileError);
          });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al registrarse';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    const sessionUserId = user?.id;
    // Limpiar inmediatamente el estado local: la UI no debe seguir creyéndose autenticada
    // ni una décima de segundo aunque Supabase tarde en responder.
    currentUserIdRef.current = null;
    setUser(null);
    if (sessionUserId) clearDropiSessionPrefs(sessionUserId);
    try { localStorage.removeItem('dropi:lastImportAt'); } catch { /* noop */ }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Error al cerrar sesión en Supabase (estado local ya limpio):', error);
    }
    // Hard redirect a la landing para garantizar un estado limpio (caches de queries,
    // websockets, listeners, etc.) sin tener que invalidar manualmente cada uno.
    window.location.href = '/';
  };

  const updateProfile = async (profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email,
        })
        .eq('id', user.id);

      if (error) {
        setError(error.message);
        throw error;
      }

      // Recargar perfil del usuario
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        await loadUserProfile(supabaseUser);
      }
    } catch (error: any) {
      setError(error.message || 'Error inesperado al actualizar perfil');
      throw error;
    }
  };

  const updatePassword = async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      setError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        setError(error.message);
        throw error;
      }
    } catch (error: any) {
      setError(error.message || 'Error inesperado al actualizar contraseña');
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    updatePassword,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
