import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para redirigir usuarios nuevos al onboarding
 * Solo se ejecuta en páginas protegidas (no en login/register)
 * Verifica si el usuario tiene una tienda conectada.
 * Si no tiene tienda conectada, redirige al onboarding.
 */
export const useOnboardingRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated || !user) {
        return;
      }

      const currentPath = window.location.pathname;
      
      // Solo ejecutar en páginas protegidas, NO en login/register
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/verify-email') {
        return;
      }

      try {
        // Verificar si el usuario ya tiene una tienda conectada
        const { data: shops, error } = await supabase
          .from('shops')
          .select('id, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error verificando tiendas:', error);
          return;
        }

        // Si no tiene tiendas activas, redirigir al onboarding
        if (!shops || shops.length === 0) {
          const hasSeenOnboarding = localStorage.getItem(`onboarding_completed_${user.id}`);
          
          if (!hasSeenOnboarding) {
            console.log('🎯 Usuario sin tienda conectada, redirigiendo al onboarding...');
            navigate('/onboarding', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error en checkOnboardingStatus:', error);
      }
    };

    // Pequeño delay para asegurar que el auth esté completamente cargado
    const timeoutId = setTimeout(checkOnboardingStatus, 500);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user, navigate]);
};

