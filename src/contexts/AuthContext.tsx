import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
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

// Cache local de perfil para hidratación instantánea en reload (evita ver "cargando"
// 1-2s mientras Supabase valida la sesión). El listener corrige si la sesión es inválida.
const PROFILE_CACHE_KEY = 'nomadev:profile-cache';

const loadCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

const saveCachedUser = (u: User | null) => {
  try {
    if (u) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(u));
    else localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch { /* noop */ }
};

// Helpers puros — fuera del componente para no recrearse en cada render.
const buildQuickUser = (supabaseUser: SupabaseUser): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  firstName: supabaseUser.user_metadata?.first_name || 'Usuario',
  lastName: supabaseUser.user_metadata?.last_name || '',
  isActive: true,
  createdAt: supabaseUser.created_at || new Date().toISOString(),
});

const mapAuthErrorMessage = (msg: string): string => {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (msg.includes('Email not confirmed')) return 'Por favor confirma tu email antes de iniciar sesión.';
  if (msg.includes('Too many requests')) return 'Demasiados intentos. Espera unos minutos antes de volver a intentar.';
  if (msg.includes('Network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
    return 'Error de conexión. Verifica tu internet y que la app pueda conectar con Supabase.';
  }
  if (msg === 'LOGIN_TIMEOUT') return 'La conexión con Supabase tardó demasiado. Verifica tu conexión a internet.';
  return msg || 'Error inesperado al iniciar sesión';
};

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
  // Hidratación optimista: si hay perfil cacheado en localStorage, arrancamos con él.
  // El listener corrige inmediatamente si la sesión real es distinta o inválida.
  const [user, setUser] = useState<User | null>(() => loadCachedUser());
  // Si tenemos cache, no estamos "cargando" desde la perspectiva del usuario.
  const [isLoading, setIsLoading] = useState<boolean>(() => !loadCachedUser());
  const [error, setError] = useState<string | null>(null);

  // Ref con el id del usuario actualmente "vivo": descarta resultados async obsoletos.
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);

  const isAuthenticated = !!user && !!user.id;

  // Setter que también persiste en cache.
  const commitUser = useCallback((next: User | null) => {
    setUser(next);
    saveCachedUser(next);
    currentUserIdRef.current = next?.id ?? null;
  }, []);

  const loadUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    const uid = supabaseUser.id;
    if (currentUserIdRef.current !== uid) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id,email,first_name,last_name,created_at')
        .eq('id', uid)
        .single();

      if (currentUserIdRef.current !== uid) return;

      if (error) {
        if (error.code === 'PGRST116') {
          // Perfil no existe → crearlo en background.
          supabase.from('profiles').insert({
            id: uid,
            email: supabaseUser.email || '',
            first_name: supabaseUser.user_metadata?.first_name || 'Usuario',
            last_name: supabaseUser.user_metadata?.last_name || '',
          }).then(({ error: insertError }) => {
            if (insertError) console.warn('No se pudo crear perfil:', insertError.message);
          });
        }
        return;
      }

      if (currentUserIdRef.current !== uid) return;
      commitUser({
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        isActive: true,
        createdAt: profile.created_at,
      });
    } catch (err) {
      console.warn('Perfil no se pudo hidratar:', err);
    }
  }, [commitUser]);

  // Aplica una sesión: setea el user y dispara side-effects de "fresh login" si aplica.
  const applySession = useCallback((supabaseUser: SupabaseUser, opts: { fresh: boolean }) => {
    commitUser(buildQuickUser(supabaseUser));
    setIsLoading(false);

    if (opts.fresh) {
      const expectFresh = consumeExpectFreshDropiLogin();
      if (expectFresh) {
        clearDropiSessionPrefs(supabaseUser.id);
        try { localStorage.removeItem('dropi:lastImportAt'); } catch { /* noop */ }
        resetDropiImportedDataForUser(supabaseUser.id).catch(() => { /* best effort */ });
      }
    }

    loadUserProfile(supabaseUser).catch(() => { /* perfil rápido ya seteado */ });
  }, [commitUser, loadUserProfile]);

  // Único listener de auth. Supabase v2 dispara INITIAL_SESSION al suscribirse.
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      switch (event) {
        case 'INITIAL_SESSION':
          if (session?.user) {
            applySession(session.user, { fresh: false });
          } else {
            commitUser(null);
            setIsLoading(false);
          }
          break;
        case 'SIGNED_IN':
          if (session?.user) applySession(session.user, { fresh: true });
          break;
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            currentUserIdRef.current = session.user.id;
            setUser((prev) => {
              const next = prev
                ? { ...prev, email: session.user.email || prev.email }
                : buildQuickUser(session.user);
              saveCachedUser(next);
              return next;
            });
          }
          break;
        case 'USER_UPDATED':
          if (session?.user) {
            commitUser(buildQuickUser(session.user));
            loadUserProfile(session.user).catch(() => { /* noop */ });
          }
          break;
        case 'SIGNED_OUT':
          commitUser(null);
          setIsLoading(false);
          break;
        default:
          break;
      }
    });

    // Failsafe: si en 3s no llegó INITIAL_SESSION, salir del loading.
    const failsafe = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, [applySession, commitUser, loadUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);

    // Login de prueba solo si está habilitado por env.
    const allowTestLogin = import.meta.env.VITE_ALLOW_TEST_LOGIN === 'true';
    const testEmail = import.meta.env.VITE_TEST_LOGIN_EMAIL;
    const testPassword = import.meta.env.VITE_TEST_LOGIN_PASSWORD;
    if (allowTestLogin && testEmail && testPassword && email === testEmail && password === testPassword) {
      clearDropiSessionPrefs('test-user-12345');
      try { localStorage.removeItem('dropi:lastImportAt'); } catch { /* noop */ }
      clearExpectFreshDropiLoginMarker();
      commitUser({
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

    // Race: respuesta de API vs evento SIGNED_IN vs timeout.
    // SIGNED_IN cubre el bug intermitente donde signInWithPassword no resuelve.
    const LOGIN_TIMEOUT_MS = 12000;
    let signedInResolved = false;
    let resolveSignedIn: () => void = () => {};
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const signedInPromise = new Promise<void>((resolve) => {
      resolveSignedIn = resolve;
    });

    const { data: { subscription: tempSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        signedInResolved = true;
        resolveSignedIn();
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), LOGIN_TIMEOUT_MS);
    });

    const authPromise = supabase.auth.signInWithPassword({ email, password }).then((res) => {
      if (res.error) throw res.error;
    });
    authPromise.catch(() => { /* manejado en el race */ });

    try {
      await Promise.race([authPromise, signedInPromise, timeoutPromise]);
    } catch (err) {
      if (signedInResolved) return; // login OK por evento, ignoramos rejection tardía
      const msg = err instanceof Error ? err.message : String(err);
      const friendly = mapAuthErrorMessage(msg);
      setError(friendly);
      clearExpectFreshDropiLoginMarker();
      throw err instanceof Error ? err : new Error(friendly);
    } finally {
      tempSub.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    markExpectFreshDropiLogin();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err) {
      clearExpectFreshDropiLoginMarker();
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setError(msg);
      throw err;
    }
  }, []);

  const register = useCallback(async (userData: {
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
        supabase.from('profiles').insert({
          id: data.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
        }).then(({ error: profileError }) => {
          if (profileError) console.warn('Error creando perfil tras registro:', profileError);
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al registrarse';
      setError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const sessionUserId = currentUserIdRef.current;
    // Limpiar UI primero — Supabase puede tardar.
    commitUser(null);
    if (sessionUserId) clearDropiSessionPrefs(sessionUserId);
    try { localStorage.removeItem('dropi:lastImportAt'); } catch { /* noop */ }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error al cerrar sesión en Supabase (estado local ya limpio):', err);
    }
    window.location.href = '/';
  }, [commitUser]);

  const updateProfile = useCallback(async (profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => {
    setError(null);
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email,
        })
        .eq('id', user.id);
      if (error) throw error;

      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) await loadUserProfile(supabaseUser);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al actualizar perfil';
      setError(msg);
      throw err;
    }
  }, [user, loadUserProfile]);

  const updatePassword = useCallback(async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al actualizar contraseña';
      setError(msg);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Memoizado: solo cambia cuando alguno de sus inputs cambia → consumidores sin re-renders innecesarios.
  const value = useMemo<AuthContextType>(() => ({
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
  }), [user, isLoading, isAuthenticated, login, loginWithGoogle, register, logout, updateProfile, updatePassword, error, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
