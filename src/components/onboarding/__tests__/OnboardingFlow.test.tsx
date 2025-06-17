import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OnboardingFlow } from '../OnboardingFlow';
import { OnboardingStatus } from '@/lib/services/onboarding';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('OnboardingFlow', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  const incompleteStatus: OnboardingStatus = {
    isAuthenticated: true,
    hasOpenAIKey: false,
    hasSelectedRepo: true,
    selectedRepo: 'test/repo',
    addedRepos: ['test/repo'],
  };

  const completeStatus: OnboardingStatus = {
    isAuthenticated: true,
    hasOpenAIKey: true,
    hasSelectedRepo: true,
    selectedRepo: 'test/repo',
    addedRepos: ['test/repo'],
  };

  it('renders all onboarding steps', () => {
    render(<OnboardingFlow initialStatus={incompleteStatus} />);

    expect(screen.getByText('Welcome to PMAI!')).toBeInTheDocument();
    expect(screen.getByText('Connect GitHub Account')).toBeInTheDocument();
    expect(screen.getByText('Select Repository')).toBeInTheDocument();
    expect(screen.getByText('Add OpenAI API Key')).toBeInTheDocument();
  });

  it('shows completed steps with check marks', () => {
    render(<OnboardingFlow initialStatus={incompleteStatus} />);

    const steps = screen.getAllByRole('img', { hidden: true });
    expect(steps).toHaveLength(2); // Two completed steps should have check marks
  });

  it('shows Continue Setup button when onboarding is incomplete', () => {
    render(<OnboardingFlow initialStatus={incompleteStatus} />);

    expect(screen.getByText('Continue Setup')).toBeInTheDocument();
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
  });

  it('shows Get Started button when all steps are complete', () => {
    render(<OnboardingFlow initialStatus={completeStatus} />);

    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.queryByText('Continue Setup')).not.toBeInTheDocument();
  });

  it('navigates to the correct step when clicking Continue Setup', () => {
    render(<OnboardingFlow initialStatus={incompleteStatus} />);

    fireEvent.click(screen.getByText('Continue Setup'));

    expect(mockRouter.push).toHaveBeenCalledWith('/settings/openai');
  });

  it('navigates to step when clicking on step card', () => {
    render(<OnboardingFlow initialStatus={incompleteStatus} />);

    fireEvent.click(screen.getByText('Connect GitHub Account').closest('div')!);

    expect(mockRouter.push).toHaveBeenCalledWith('/settings');
  });

  it('calls onComplete when Get Started is clicked', async () => {
    const mockComplete = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <OnboardingFlow 
        initialStatus={completeStatus} 
        onComplete={mockComplete}
      />
    );

    fireEvent.click(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      expect(mockComplete).toHaveBeenCalled();
    });
  });

  it('calls onSkip when Skip for now is clicked', async () => {
    const mockSkip = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <OnboardingFlow 
        initialStatus={incompleteStatus} 
        onSkip={mockSkip}
      />
    );

    fireEvent.click(screen.getByText('Skip for now'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });
      expect(mockSkip).toHaveBeenCalled();
    });
  });

  it('fetches onboarding status when no initial status provided', async () => {
    const fetchedStatus: OnboardingStatus = {
      isAuthenticated: true,
      hasOpenAIKey: false,
      hasSelectedRepo: false,
      addedRepos: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => fetchedStatus,
    });

    render(<OnboardingFlow />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/onboarding/status');
      expect(screen.getByText('Welcome to PMAI!')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<OnboardingFlow />);

    await waitFor(() => {
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });
  });
});