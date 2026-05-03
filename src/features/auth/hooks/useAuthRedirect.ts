import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { hasCompletedOnboarding } from '@/features/onboarding/lib/onboarding';

/**
 * Si el usuario llega autenticado a `/login` o `/register`, lo redirige:
 *  - a `/onboarding` si todavía no completó el onboarding,
 *  - a `/dashboard` si ya lo completó.
 */
export const useAuthRedirect = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') return;

    const target = hasCompletedOnboarding(user) ? '/dashboard' : '/onboarding';
    navigate(target, { replace: true });
  }, [isAuthenticated, isLoading, user, navigate]);

  return { isAuthenticated, isLoading, user };
};
