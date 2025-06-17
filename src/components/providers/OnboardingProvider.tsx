'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { OnboardingStatus, isOnboardingComplete } from '@/lib/services/onboarding';

interface OnboardingContextType {
  status: OnboardingStatus | null;
  isComplete: boolean;
  showOnboarding: () => void;
  refreshStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType>({
  status: null,
  isComplete: false,
  showOnboarding: () => {},
  refreshStatus: async () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);

interface OnboardingProviderProps {
  children: React.ReactNode;
}

const PROTECTED_PATHS = ['/create', '/preview'];
const ONBOARDING_PATHS = ['/settings', '/onboarding'];

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const isComplete = onboardingStatus ? isOnboardingComplete(onboardingStatus) : false;

  const fetchOnboardingStatus = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/onboarding/status');
      if (response.ok) {
        const data = await response.json();
        setOnboardingStatus(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
    }
    return null;
  }, [session?.user]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    if (session?.user && !hasChecked) {
      setHasChecked(true);
      fetchOnboardingStatus().then((status) => {
        if (status && !isOnboardingComplete(status) && !status.completedAt && !status.skippedAt) {
          const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
          const isOnboardingPath = ONBOARDING_PATHS.some(path => pathname.startsWith(path));
          
          if (isProtectedPath && !isOnboardingPath) {
            setShowModal(true);
          }
        }
      });
    }
  }, [session, sessionStatus, pathname, hasChecked, fetchOnboardingStatus]);

  const handleOnboardingComplete = async () => {
    await fetchOnboardingStatus();
    setShowModal(false);
  };

  const showOnboarding = () => {
    setShowModal(true);
  };

  const refreshStatus = async () => {
    await fetchOnboardingStatus();
  };

  return (
    <OnboardingContext.Provider
      value={{
        status: onboardingStatus,
        isComplete,
        showOnboarding,
        refreshStatus,
      }}
    >
      {children}
      <OnboardingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onComplete={handleOnboardingComplete}
        initialStatus={onboardingStatus || undefined}
      />
    </OnboardingContext.Provider>
  );
};