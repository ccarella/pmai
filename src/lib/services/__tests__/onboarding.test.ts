import { getOnboardingSteps, isOnboardingComplete, getNextIncompleteStep } from '../onboarding';
import type { OnboardingStatus } from '../onboarding';

describe('onboarding service', () => {
  describe('getOnboardingSteps', () => {
    it('returns all steps with correct completion status', () => {
      const status: OnboardingStatus = {
        isAuthenticated: true,
        hasOpenAIKey: false,
        hasSelectedRepo: true,
        selectedRepo: 'test/repo',
        addedRepos: ['test/repo'],
      };

      const steps = getOnboardingSteps(status);

      expect(steps).toHaveLength(3);
      expect(steps[0]).toEqual({
        id: 'github',
        title: 'Connect GitHub Account',
        description: 'Sign in with your GitHub account to publish issues',
        completed: true,
        href: '/settings',
      });
      expect(steps[1]).toEqual({
        id: 'repository',
        title: 'Select Repository',
        description: 'Choose a repository where you want to create issues',
        completed: true,
        href: '/settings/github',
      });
      expect(steps[2]).toEqual({
        id: 'openai',
        title: 'Add OpenAI API Key',
        description: 'Connect your OpenAI key for AI-powered enhancements',
        completed: false,
        href: '/settings/openai',
      });
    });

    it('returns all steps as incomplete when no status', () => {
      const status: OnboardingStatus = {
        isAuthenticated: false,
        hasOpenAIKey: false,
        hasSelectedRepo: false,
        addedRepos: [],
      };

      const steps = getOnboardingSteps(status);

      expect(steps.every(step => !step.completed)).toBe(true);
    });
  });

  describe('isOnboardingComplete', () => {
    it('returns true when all requirements are met', () => {
      const status: OnboardingStatus = {
        isAuthenticated: true,
        hasOpenAIKey: true,
        hasSelectedRepo: true,
        selectedRepo: 'test/repo',
        addedRepos: ['test/repo'],
      };

      expect(isOnboardingComplete(status)).toBe(true);
    });

    it('returns false when authentication is missing', () => {
      const status: OnboardingStatus = {
        isAuthenticated: false,
        hasOpenAIKey: true,
        hasSelectedRepo: true,
        selectedRepo: 'test/repo',
        addedRepos: ['test/repo'],
      };

      expect(isOnboardingComplete(status)).toBe(false);
    });

    it('returns false when OpenAI key is missing', () => {
      const status: OnboardingStatus = {
        isAuthenticated: true,
        hasOpenAIKey: false,
        hasSelectedRepo: true,
        selectedRepo: 'test/repo',
        addedRepos: ['test/repo'],
      };

      expect(isOnboardingComplete(status)).toBe(false);
    });

    it('returns false when repository is not selected', () => {
      const status: OnboardingStatus = {
        isAuthenticated: true,
        hasOpenAIKey: true,
        hasSelectedRepo: false,
        addedRepos: [],
      };

      expect(isOnboardingComplete(status)).toBe(false);
    });
  });

  describe('getNextIncompleteStep', () => {
    it('returns first incomplete step', () => {
      const status: OnboardingStatus = {
        isAuthenticated: false,
        hasOpenAIKey: false,
        hasSelectedRepo: false,
        addedRepos: [],
      };

      const nextStep = getNextIncompleteStep(status);

      expect(nextStep).toEqual({
        id: 'github',
        title: 'Connect GitHub Account',
        description: 'Sign in with your GitHub account to publish issues',
        completed: false,
        href: '/settings',
      });
    });

    it('returns repository step when github is connected', () => {
      const status: OnboardingStatus = {
        isAuthenticated: true,
        hasOpenAIKey: false,
        hasSelectedRepo: false,
        addedRepos: [],
      };

      const nextStep = getNextIncompleteStep(status);

      expect(nextStep).toEqual({
        id: 'repository',
        title: 'Select Repository',
        description: 'Choose a repository where you want to create issues',
        completed: false,
        href: '/settings/github',
      });
    });

    it('returns null when all steps are complete', () => {
      const status: OnboardingStatus = {
        isAuthenticated: true,
        hasOpenAIKey: true,
        hasSelectedRepo: true,
        selectedRepo: 'test/repo',
        addedRepos: ['test/repo'],
      };

      const nextStep = getNextIncompleteStep(status);

      expect(nextStep).toBeNull();
    });
  });
});