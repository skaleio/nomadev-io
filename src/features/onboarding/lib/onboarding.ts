import { supabase } from '@/lib/supabase/client';

interface OnboardingAwareUser {
  onboardingCompletedAt?: string;
}

export const hasCompletedOnboarding = (user: OnboardingAwareUser | null | undefined): boolean =>
  Boolean(user?.onboardingCompletedAt);

export const markOnboardingCompleted = async (): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    data: { onboarding_completed_at: new Date().toISOString() },
  });
  if (error) {
    console.warn('No se pudo marcar onboarding como completado:', error.message);
  }
};
