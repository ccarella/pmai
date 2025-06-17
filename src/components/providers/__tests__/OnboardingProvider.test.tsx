import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { OnboardingProvider, useOnboarding } from '../OnboardingProvider';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/navigation');

// Mock OnboardingModal to avoid complexity
jest.mock('@/components/onboarding/OnboardingModal', () => ({
  OnboardingModal: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="onboarding-modal">Onboarding Modal</div> : null,
}));

global.fetch = jest.fn();

// Test component to access context
const TestComponent = () => {
  const { status, isComplete, showOnboarding } = useOnboarding();
  return (
    <div>
      <div data-testid="is-complete">{isComplete.toString()}</div>
      <div data-testid="status">{JSON.stringify(status)}</div>
      <button onClick={showOnboarding}>Show Onboarding</button>
    </div>
  );
};

describe('OnboardingProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  it('provides onboarding context to children', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    expect(screen.getByTestId('is-complete')).toHaveTextContent('false');
    expect(screen.getByTestId('status')).toHaveTextContent('null');
  });

  it('fetches onboarding status when user is authenticated', async () => {
    const mockStatus = {
      isAuthenticated: true,
      hasOpenAIKey: true,
      hasSelectedRepo: false,
      addedRepos: [],
    };

    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/onboarding/status');
      expect(screen.getByTestId('status')).toHaveTextContent(JSON.stringify(mockStatus));
      expect(screen.getByTestId('is-complete')).toHaveTextContent('false');
    });
  });

  it('shows modal on protected paths when onboarding is incomplete', async () => {
    const mockStatus = {
      isAuthenticated: true,
      hasOpenAIKey: false,
      hasSelectedRepo: false,
      addedRepos: [],
    };

    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (usePathname as jest.Mock).mockReturnValue('/create');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument();
    });
  });

  it('does not show modal when onboarding is complete', async () => {
    const mockStatus = {
      isAuthenticated: true,
      hasOpenAIKey: true,
      hasSelectedRepo: true,
      selectedRepo: 'test/repo',
      addedRepos: ['test/repo'],
    };

    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (usePathname as jest.Mock).mockReturnValue('/create');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('is-complete')).toHaveTextContent('true');
    });
  });

  it('does not show modal when onboarding was skipped', async () => {
    const mockStatus = {
      isAuthenticated: true,
      hasOpenAIKey: false,
      hasSelectedRepo: false,
      addedRepos: [],
      skippedAt: '2024-01-01T00:00:00Z',
    };

    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (usePathname as jest.Mock).mockReturnValue('/create');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument();
    });
  });

  it('does not show modal on non-protected paths', async () => {
    const mockStatus = {
      isAuthenticated: true,
      hasOpenAIKey: false,
      hasSelectedRepo: false,
      addedRepos: [],
    };

    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (usePathname as jest.Mock).mockReturnValue('/');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatus,
    });

    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('null');
    });
  });
});