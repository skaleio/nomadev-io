import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { hasCompletedOnboarding } from '@/features/onboarding/lib/onboarding';

const PUBLIC_OR_AUTH_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/auth/success',
  '/onboarding',
]);

/**
 * En rutas protegidas: si el usuario autenticado todavía no marcó el onboarding como completado
 * (`user_metadata.onboarding_completed_at` ausente), lo redirige a `/onboarding`.
 */
export const useOnboardingRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    const currentPath = window.location.pathname;
    if (PUBLIC_OR_AUTH_ROUTES.has(currentPath)) return;

    if (!hasCompletedOnboarding(user)) {
      navigate('/onboarding', { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate]);
};
