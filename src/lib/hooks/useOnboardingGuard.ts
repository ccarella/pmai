import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/components/providers/OnboardingProvider';

interface UseOnboardingGuardOptions {
  redirectTo?: string;
  requireComplete?: boolean;
}

export function useOnboardingGuard(options: UseOnboardingGuardOptions = {}) {
  const { status, isComplete } = useOnboarding();
  const router = useRouter();
  const { redirectTo = '/onboarding', requireComplete = true } = options;

  useEffect(() => {
    if (!status) return;

    // If onboarding is required but not complete, redirect
    if (requireComplete && !isComplete && !status.skippedAt) {
      router.push(redirectTo);
    }
  }, [status, isComplete, requireComplete, redirectTo, router]);

  return { status, isComplete };
}