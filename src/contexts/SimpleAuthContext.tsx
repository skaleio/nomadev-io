import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
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
  showOnboarding: boolean;
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
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const SimpleAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const isAuthenticated = !!user && user.id;

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 [SIMPLE] Verificando sesión existente...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('👤 [SIMPLE] Sesión encontrada:', session.user.email);
          // Crear perfil básico inmediatamente
          const userProfile = {
            id: session.user.id,
            email: session.user.email || '',
            firstName: session.user.user_metadata?.first_name || 'Usuario',
            lastName: session.user.user_metadata?.last_name || '',
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          setUser(userProfile);
          setShowOnboarding(false);
        } else {
          console.log('🚪 [SIMPLE] No hay sesión activa');
        }
      } catch (error) {
        console.error('❌ [SIMPLE] Error verificando autenticación:', error);
      } finally {
        console.log('✅ [SIMPLE] Terminando carga de autenticación');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Implementación simplificada
    console.log('Login simplificado');
  };

  const register = async (userData: any) => {
    // Implementación simplificada
    console.log('Register simplificado');
  };

  const logout = () => {
    setUser(null);
    setShowOnboarding(false);
  };

  const updateProfile = async (profileData: any) => {
    // Implementación simplificada
    console.log('Update profile simplificado');
  };

  const updatePassword = async (passwordData: any) => {
    // Implementación simplificada
    console.log('Update password simplificado');
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    showOnboarding,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    completeOnboarding,
    skipOnboarding,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
