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
        
        const SHOP_CHECK_TIMEOUT_MS = 4000;
        
        const checkOnboardingStatus = async () => {
          try {
            const shopsPromise = supabase
              .from('shopify_connections')
              .select('id')
              .eq('user_id', user.id)
              .eq('is_active', true);
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), SHOP_CHECK_TIMEOUT_MS)
            );
            const { data: shops, error } = await Promise.race([shopsPromise, timeoutPromise]).catch(() => ({
              data: null,
              error: { message: 'timeout' }
            })) as { data: { id: string }[] | null; error: { message: string } | null };

            if (error || !shops) {
              if (error?.message === 'timeout') console.warn('Verificación de tiendas lenta, yendo al dashboard');
              else console.error('Error verificando tiendas:', error);
              navigate('/dashboard', { replace: true });
              return;
            }

            if (shops.length === 0) {
              let hasSeenOnboarding: string | null = null;
              try {
                hasSeenOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
              } catch (e) {
                console.warn('localStorage no disponible para onboarding_completed', e);
              }
              if (!hasSeenOnboarding) {
                console.log('🎯 Usuario nuevo sin tienda, redirigiendo al onboarding...');
                navigate('/onboarding', { replace: true });
              } else {
                navigate('/dashboard', { replace: true });
              }
            } else {
              navigate('/dashboard', { replace: true });
            }
          } catch (err) {
            console.error('Error en checkOnboardingStatus:', err);
            navigate('/dashboard', { replace: true });
          }
        };

        checkOnboardingStatus();
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  return { isAuthenticated, isLoading, user };
};
