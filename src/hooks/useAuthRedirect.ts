import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAuthRedirect = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Solo redirigir si hay un usuario autenticado y NO está cargando
    // Y solo si estamos en páginas de autenticación
    if (!isLoading && isAuthenticated && user) {
      const currentPath = window.location.pathname;
      
      // Solo redirigir desde login/register si el usuario ya está autenticado
      // Esto evita auto-ejecutar login al entrar a la página
      if (currentPath === '/login' || currentPath === '/register') {
        console.log('Usuario ya autenticado, verificando si necesita onboarding...');
        
        // Verificar si el usuario necesita onboarding
        const checkOnboardingStatus = async () => {
          try {
            const { data: shops, error } = await supabase
              .from('shops')
              .select('id, is_active')
              .eq('user_id', user.id)
              .eq('is_active', true);

            if (error) {
              console.error('Error verificando tiendas:', error);
              // En caso de error, ir al dashboard por defecto
              navigate('/dashboard', { replace: true });
              return;
            }

            // Si no tiene tiendas activas, verificar si ya completó onboarding
            if (!shops || shops.length === 0) {
              const hasSeenOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
              
              if (!hasSeenOnboarding) {
                console.log('🎯 Usuario nuevo sin tienda, redirigiendo al onboarding...');
                navigate('/onboarding', { replace: true });
              } else {
                console.log('Usuario ya completó onboarding, redirigiendo al dashboard...');
                navigate('/dashboard', { replace: true });
              }
            } else {
              console.log('Usuario con tienda conectada, redirigiendo al dashboard...');
              navigate('/dashboard', { replace: true });
            }
          } catch (error) {
            console.error('Error en checkOnboardingStatus:', error);
            // En caso de error, ir al dashboard por defecto
            navigate('/dashboard', { replace: true });
          }
        };

        checkOnboardingStatus();
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  return { isAuthenticated, isLoading, user };
};
