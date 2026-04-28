import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import {
  clearDropiSessionPrefs,
  clearExpectFreshDropiLoginMarker,
  consumeExpectFreshDropiLogin,
  markExpectFreshDropiLogin,
} from '@/lib/dropiSessionPrefs';
import { resetDropiImportedDataForUser } from '@/lib/resetDropiImportedData';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Tables } from '../integrations/supabase/types';

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

  const isAuthenticated = !!user && !!user.id;

  // Construir un perfil "rápido" desde la sesión de Supabase para setear el usuario
  // inmediatamente; el perfil completo se carga en background.
  const buildQuickUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: supabaseUser.user_metadata?.first_name || 'Usuario',
    lastName: supabaseUser.user_metadata?.last_name || '',
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          console.warn('⚠️ Error de sesión, limpiando:', sessionError.message);
          await supabase.auth.signOut();
          return;
        }

        if (session?.user) {
          setUser(buildQuickUser(session.user));
          // Hidratar perfil completo en background (no bloquea el render)
          loadUserProfile(session.user).catch(() => { /* ya hay perfil rápido */ });
        }
      } catch (err) {
        console.error('❌ Error verificando sesión:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAuth();

    // Escuchar cambios de sesión. Fuente única de verdad para el estado del usuario.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const uid = session.user.id;
          const freshLogin = consumeExpectFreshDropiLogin();
          if (freshLogin) {
            clearDropiSessionPrefs(uid);
            try {
              localStorage.removeItem('dropi:lastImportAt');
            } catch {
              /* noop */
            }
            await resetDropiImportedDataForUser(uid);
          }
          // Setear usuario inmediatamente para desbloquear la UI
          setUser(buildQuickUser(session.user));
          setIsLoading(false);
          // Hidratar perfil completo sin bloquear
          loadUserProfile(session.user).catch(() => { /* perfil rápido ya seteado */ });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Cargando perfil para usuario:', supabaseUser.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error cargando perfil:', error);
        
        // Si no existe el perfil, crear uno básico
        if (error.code === 'PGRST116') {
          console.log('Creando perfil para usuario existente...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              first_name: supabaseUser.user_metadata?.first_name || 'Usuario',
              last_name: supabaseUser.user_metadata?.last_name || '',
            });

          if (insertError) {
            console.error('Error creando perfil:', insertError);
            // Crear un perfil básico en memoria si falla la inserción
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              firstName: supabaseUser.user_metadata?.first_name || 'Usuario',
              lastName: supabaseUser.user_metadata?.last_name || '',
              isActive: true,
              createdAt: new Date().toISOString(),
            });
            return;
          }

          // Recargar el perfil después de crearlo
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (newProfile) {
            setUser({
              id: newProfile.id,
              email: newProfile.email,
              firstName: newProfile.first_name,
              lastName: newProfile.last_name,
              isActive: newProfile.is_active,
              createdAt: newProfile.created_at,
            });
          }
        } else {
          // Para otros errores, crear un perfil básico en memoria
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            firstName: supabaseUser.user_metadata?.first_name || 'Usuario',
            lastName: supabaseUser.user_metadata?.last_name || '',
            isActive: true,
            createdAt: new Date().toISOString(),
          });
        }
        return;
      }

      console.log('Perfil cargado exitosamente:', profile);
      setUser({
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        isActive: true, // profiles table doesn't have is_active field
        createdAt: profile.created_at,
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
      // En caso de error, crear un perfil básico en memoria
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.first_name || 'Usuario',
        lastName: supabaseUser.user_metadata?.last_name || '',
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);

    // Login de prueba solo si está habilitado por env (nunca en producción)
    const allowTestLogin = import.meta.env.VITE_ALLOW_TEST_LOGIN === 'true';
    const testEmail = import.meta.env.VITE_TEST_LOGIN_EMAIL;
    const testPassword = import.meta.env.VITE_TEST_LOGIN_PASSWORD;
    if (allowTestLogin && testEmail && testPassword && email === testEmail && password === testPassword) {
      clearDropiSessionPrefs('test-user-12345');
      try {
        localStorage.removeItem('dropi:lastImportAt');
      } catch {
        /* noop */
      }
      clearExpectFreshDropiLoginMarker();
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

    const LOGIN_TIMEOUT_MS = 15000;

    // Escuchamos SIGNED_IN como "backup": si el cliente Supabase-JS no resuelve
    // la promesa de signInWithPassword (bug conocido bajo ciertas condiciones),
    // el evento SIGNED_IN sí se dispara y lo usamos para considerar el login exitoso.
    let signedInSub: { unsubscribe: () => void } | null = null;
    const signedInPromise = new Promise<void>((resolve) => {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) resolve();
      });
      signedInSub = data.subscription;
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), LOGIN_TIMEOUT_MS);
    });

    markExpectFreshDropiLogin();

    let authError: Error | null = null;
    const authPromise = supabase.auth.signInWithPassword({ email, password }).then(
      (res) => {
        if (res.error) {
          authError = res.error;
          throw res.error;
        }
        return res;
      },
      (err) => {
        authError = err instanceof Error ? err : new Error(String(err));
        throw authError;
      }
    );
    // Evitar unhandled rejection si signedInPromise gana pero authPromise falla después.
    authPromise.catch(() => { /* error capturado en authError */ });

    try {
      // Ganador: (a) respuesta de la API, (b) evento SIGNED_IN o (c) timeout.
      // Si authPromise rechaza con error real de credenciales, lo relanzamos; si gana
      // signedInPromise, el login fue correcto vía evento.
      await Promise.race([authPromise, signedInPromise, timeoutPromise]);
      if (authError) throw authError;
      // En cualquier caso de éxito, onAuthStateChange ya setea el usuario.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      let errorMessage = 'Error inesperado al iniciar sesión';
      if (msg.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos.';
      } else if (msg.includes('Email not confirmed')) {
        errorMessage = 'Por favor confirma tu email antes de iniciar sesión.';
      } else if (msg.includes('Too many requests')) {
        errorMessage = 'Demasiados intentos. Espera unos minutos antes de volver a intentar.';
      } else if (msg.includes('Network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet y que la app pueda conectar con Supabase.';
      } else if (msg === 'LOGIN_TIMEOUT') {
        errorMessage = 'La conexión con Supabase tardó demasiado. Verifica tu conexión a internet e intenta nuevamente. Si el problema persiste, el proyecto puede estar pausado en el Dashboard.';
      } else if (msg) {
        errorMessage = msg;
      }
      setError(errorMessage);
      clearExpectFreshDropiLoginMarker();
      throw err;
    } finally {
      signedInSub?.unsubscribe();
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      markExpectFreshDropiLogin();
      const redirectTo = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) {
        setError(error.message);
        clearExpectFreshDropiLoginMarker();
        throw error;
      }
      // La redirección a Google la hace Supabase; al volver, onAuthStateChange actualizará el usuario
    } catch (error: any) {
      console.error('Error login con Google:', error);
      clearExpectFreshDropiLoginMarker();
      setError(error?.message || 'Error al iniciar sesión con Google');
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('🚀 Iniciando registro para:', userData.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
          }
        }
      });

      if (error) {
        console.error('❌ Error en registro:', error);
        setError(error.message);
        throw error;
      }

      if (data.user) {
        console.log('✅ Usuario registrado exitosamente:', data.user.email);
        
        // Crear perfil en la tabla profiles (sin esperar)
        supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
          })
          .then(({ error: profileError }) => {
            if (profileError) {
              console.error('Error creando perfil:', profileError);
            } else {
              console.log('✅ Perfil creado exitosamente');
            }
          });

        // NO cargar perfil ni redirigir automáticamente
        // El modal se encargará de mostrar la verificación
        console.log('🎉 Registro completado, mostrando modal de verificación');
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      setError(error.message || 'Error inesperado al registrarse');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const sessionUserId = user?.id;
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      if (sessionUserId) clearDropiSessionPrefs(sessionUserId);
      try {
        localStorage.removeItem('dropi:lastImportAt');
      } catch {
        /* noop */
      }
      setUser(null);
      // Redirigir a la landing page después del logout
      window.location.href = '/';
    }
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
