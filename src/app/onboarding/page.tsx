import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOnboardingStatus, isOnboardingComplete } from '@/lib/services/onboarding';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/settings');
  }

  const status = await getOnboardingStatus();
  
  // If onboarding is already complete, redirect to home
  if (isOnboardingComplete(status) && status.completedAt) {
    redirect('/');
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <OnboardingFlow 
          initialStatus={status}
          onComplete={() => {
            // Client-side navigation will be handled by the component
            window.location.href = '/create';
          }}
          onSkip={() => {
            window.location.href = '/';
          }}
        />
      </div>
    </main>
  );
}