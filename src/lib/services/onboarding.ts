import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redisClient } from '@/lib/utils/redis';

export interface OnboardingStatus {
  isAuthenticated: boolean;
  hasOpenAIKey: boolean;
  openAIKeyAddedAt?: string;
  hasSelectedRepo: boolean;
  selectedRepo?: string;
  addedRepos: string[];
  completedAt?: string;
  skippedAt?: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href?: string;
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const session = await getServerSession(authOptions);
  
  const status: OnboardingStatus = {
    isAuthenticated: false,
    hasOpenAIKey: false,
    hasSelectedRepo: false,
    addedRepos: [],
  };

  if (!session?.user?.id) {
    return status;
  }

  status.isAuthenticated = true;

  try {
    // Check for OpenAI API key
    const userProfile = await redisClient.hgetall(`user:${session.user.id}`);
    if (userProfile?.openaiApiKey) {
      status.hasOpenAIKey = true;
      status.openAIKeyAddedAt = userProfile.openaiKeyAddedAt;
    }

    // Check for GitHub connection and repository selection
    const githubConnection = await redisClient.hgetall(`github:${session.user.id}`);
    if (githubConnection?.selectedRepo) {
      status.hasSelectedRepo = true;
      status.selectedRepo = githubConnection.selectedRepo;
    }
    if (githubConnection?.addedRepos) {
      status.addedRepos = JSON.parse(githubConnection.addedRepos);
    }

    // Check if onboarding was completed or skipped
    const onboardingData = await redisClient.hgetall(`onboarding:${session.user.id}`);
    if (onboardingData?.completedAt) {
      status.completedAt = onboardingData.completedAt;
    }
    if (onboardingData?.skippedAt) {
      status.skippedAt = onboardingData.skippedAt;
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error);
  }

  return status;
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  await redisClient.hset(`onboarding:${userId}`, {
    completedAt: new Date().toISOString(),
  });
}

export async function skipOnboarding(userId: string): Promise<void> {
  await redisClient.hset(`onboarding:${userId}`, {
    skippedAt: new Date().toISOString(),
  });
}

export function getOnboardingSteps(status: OnboardingStatus): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    {
      id: 'github',
      title: 'Connect GitHub Account',
      description: 'Sign in with your GitHub account to publish issues',
      completed: status.isAuthenticated,
      href: '/settings',
    },
    {
      id: 'repository',
      title: 'Select Repository',
      description: 'Choose a repository where you want to create issues',
      completed: status.hasSelectedRepo,
      href: '/settings/github',
    },
    {
      id: 'openai',
      title: 'Add OpenAI API Key',
      description: 'Connect your OpenAI key for AI-powered enhancements',
      completed: status.hasOpenAIKey,
      href: '/settings/openai',
    },
  ];

  return steps;
}

export function isOnboardingComplete(status: OnboardingStatus): boolean {
  return status.isAuthenticated && status.hasSelectedRepo && status.hasOpenAIKey;
}

export function getNextIncompleteStep(status: OnboardingStatus): OnboardingStep | null {
  const steps = getOnboardingSteps(status);
  return steps.find(step => !step.completed) || null;
}