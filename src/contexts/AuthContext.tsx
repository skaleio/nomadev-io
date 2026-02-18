import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, testSupabaseConnection } from '../integrations/supabase/client';
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

  const isAuthenticated = !!user && user.id;

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkAuth = async () => {
      try {
        console.log('🔍 Verificando sesión existente...');
        
        // Timeout de seguridad: si la verificación tarda más de 5 segundos, continuar sin sesión
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        let sessionResult;
        try {
          sessionResult = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]);
        } catch (raceError: any) {
          if (raceError.message === 'Timeout') {
            console.warn('⚠️ Timeout verificando sesión, continuando sin autenticación');
            if (isMounted) {
              setIsLoading(false);
            }
            return;
          }
          throw raceError;
        }
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (!isMounted) return;
        
        const { data: { session } } = sessionResult;
        
        if (session?.user) {
          console.log('👤 Sesión encontrada:', session.user.email);
          // Crear perfil básico inmediatamente
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            firstName: session.user.user_metadata?.first_name || 'Usuario',
            lastName: session.user.user_metadata?.last_name || '',
            isActive: true,
            createdAt: new Date().toISOString(),
          });
        } else {
          console.log('🚪 No hay sesión activa');
        }
      } catch (error: any) {
        console.error('❌ Error verificando autenticación:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    checkAuth();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Usuario firmado, cargando perfil...');
          await loadUserProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('Usuario deslogueado');
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refrescado, manteniendo sesión...');
          // No hacer nada, mantener el usuario actual
        }
        if (isMounted) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('🚀 Iniciando proceso de login para:', email);
      
      // Login de prueba solo si está habilitado por env (nunca en producción)
      const allowTestLogin = import.meta.env.VITE_ALLOW_TEST_LOGIN === 'true';
      const testEmail = import.meta.env.VITE_TEST_LOGIN_EMAIL;
      const testPassword = import.meta.env.VITE_TEST_LOGIN_PASSWORD;
      if (allowTestLogin && testEmail && testPassword && email === testEmail && password === testPassword) {
        console.log('🧪 Usando credenciales de prueba - login local');
        const testUser = {
          id: 'test-user-12345',
          email: testEmail,
          firstName: 'Usuario',
          lastName: 'Prueba',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        setUser(testUser);
        setIsLoading(false);
        return;
      }
      
      console.log('📡 Enviando credenciales a Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error de autenticación:', error);
        setError(error.message);
        setIsLoading(false);
        throw error;
      }

      if (data.user) {
        console.log('✅ Usuario autenticado exitosamente:', data.user.email);
        
        // Crear un perfil básico inmediatamente
        const userProfile = {
          id: data.user.id,
          email: data.user.email || '',
          firstName: data.user.user_metadata?.first_name || 'Usuario',
          lastName: data.user.user_metadata?.last_name || '',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        
        setUser(userProfile);
        console.log('👤 Perfil de usuario creado:', userProfile);
        setIsLoading(false);
        
        // NO cargar perfil completo para evitar colgados
        console.log('🎉 Login completado exitosamente');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      
      // Manejo específico de diferentes tipos de errores
      let errorMessage = 'Error inesperado al iniciar sesión';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Por favor confirma tu email antes de iniciar sesión.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Demasiados intentos. Espera unos minutos antes de volver a intentar.';
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet y vuelve a intentar.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
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
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
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
