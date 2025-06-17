// Unit tests for onboarding utility functions
import { getOnboardingSteps, isOnboardingComplete, getNextIncompleteStep } from '../onboarding';
import type { OnboardingStatus } from '../onboarding';

// Mock the entire module except for the functions we want to test
jest.mock('../onboarding', () => ({
  ...jest.requireActual('../onboarding'),
  getOnboardingStatus: jest.fn(),
  markOnboardingComplete: jest.fn(),
  skipOnboarding: jest.fn(),
}));

describe('onboarding utility functions', () => {
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
      expect(steps[0]).toMatchObject({
        id: 'github',
        title: 'Connect GitHub Account',
        completed: true,
      });
      expect(steps[1]).toMatchObject({
        id: 'repository',
        title: 'Select Repository',
        completed: true,
      });
      expect(steps[2]).toMatchObject({
        id: 'openai',
        title: 'Add OpenAI API Key',
        completed: false,
      });
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

    it('returns false when any requirement is missing', () => {
      const incompleteStatuses: OnboardingStatus[] = [
        {
          isAuthenticated: false,
          hasOpenAIKey: true,
          hasSelectedRepo: true,
          selectedRepo: 'test/repo',
          addedRepos: ['test/repo'],
        },
        {
          isAuthenticated: true,
          hasOpenAIKey: false,
          hasSelectedRepo: true,
          selectedRepo: 'test/repo',
          addedRepos: ['test/repo'],
        },
        {
          isAuthenticated: true,
          hasOpenAIKey: true,
          hasSelectedRepo: false,
          addedRepos: [],
        },
      ];

      incompleteStatuses.forEach(status => {
        expect(isOnboardingComplete(status)).toBe(false);
      });
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

      expect(nextStep?.id).toBe('github');
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