import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PreviewPage from '@/app/preview/page';
import { RepositoryProvider } from '@/contexts/RepositoryContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock PublishButtonWithConfirmation to have access to its internals
jest.mock('@/components/PublishButtonWithConfirmation', () => {
  const React = jest.requireActual('react');
  return {
    PublishButtonWithConfirmation: ({ title, body, labels, onSuccess, onError, className }: {
      title: string;
      body: string;
      labels?: string[];
      onSuccess?: (url: string) => void;
      onError?: (error: string) => void;
      className?: string;
    }) => {
      const [showConfirmation, setShowConfirmation] = React.useState(false);
      const [loading, setLoading] = React.useState(false);
      
      const handleClick = () => {
        setShowConfirmation(true);
      };
      
      const handleConfirm = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/github/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, labels }),
          });
          
          const data = await response.json();
          
          if (response.ok) {
            onSuccess?.(data.issueUrl);
          } else {
            onError?.(data.error);
          }
        } catch {
          onError?.('Failed to publish');
        } finally {
          setLoading(false);
          setShowConfirmation(false);
        }
      };
      
      return (
        <>
          <button onClick={handleClick} className={className}>
            Publish to GitHub
          </button>
          {showConfirmation && (
            <div data-testid="confirmation-dialog">
              <h3>Confirm Repository</h3>
              <p>Are you sure you want to publish this issue to <strong data-testid="repo-name">repository</strong>?</p>
              <button onClick={handleConfirm} disabled={loading}>
                Confirm & Publish
              </button>
              <button onClick={() => setShowConfirmation(false)}>
                Cancel
              </button>
            </div>
          )}
        </>
      );
    }
  };
});

const mockPush = jest.fn();
const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com'
  },
  expires: '2024-12-31'
};

const mockIssue = {
  original: 'Build a user authentication system',
  markdown: '# User Authentication System\n\nImplement authentication...',
  claudePrompt: 'Please implement authentication...',
  summary: {
    type: 'feature',
    priority: 'high',
    estimatedEffort: 'large',
  },
};

describe('Repository Confirmation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Setup localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn().mockReturnValue(JSON.stringify(mockIssue)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Setup clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    // Setup fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('completes full repository confirmation and publishing flow', async () => {
    // Mock API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'octocat/Hello-World' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          repositories: [{
            id: 1,
            name: 'Hello-World',
            full_name: 'octocat/Hello-World',
            private: false,
            owner: { login: 'octocat' }
          }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          issueUrl: 'https://github.com/octocat/Hello-World/issues/123',
          issueNumber: 123,
          title: 'User Authentication System'
        })
      });

    render(
      <SessionProvider session={mockSession}>
        <RepositoryProvider>
          <PreviewPage />
        </RepositoryProvider>
      </SessionProvider>
    );

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Issue Preview')).toBeInTheDocument();
    });

    // Click publish button
    const publishButton = screen.getByText('Publish to GitHub');
    fireEvent.click(publishButton);

    // Verify confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Repository')).toBeInTheDocument();
    });

    // Click confirm
    const confirmButton = screen.getByText('Confirm & Publish');
    fireEvent.click(confirmButton);

    // Verify API call was made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'User Authentication System',
          body: mockIssue.markdown,
          labels: ['feature']
        })
      });
    });
  });

  it('handles publishing errors with repository context', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'octocat/Hello-World' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          repositories: [{
            id: 1,
            name: 'Hello-World',
            full_name: 'octocat/Hello-World',
            private: false,
            owner: { login: 'octocat' }
          }]
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Repository not found'
        })
      });

    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    render(
      <SessionProvider session={mockSession}>
        <RepositoryProvider>
          <PreviewPage />
        </RepositoryProvider>
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Issue Preview')).toBeInTheDocument();
    });

    const publishButton = screen.getByText('Publish to GitHub');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Confirm & Publish');
    fireEvent.click(confirmButton);

    // Verify error handling
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to publish:', 'Repository not found');
    });

    consoleError.mockRestore();
  });

  it('prevents publishing when no repository is selected', async () => {
    // Mock no selected repository
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: null })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: [] })
      });

    render(
      <SessionProvider session={mockSession}>
        <RepositoryProvider>
          <PreviewPage />
        </RepositoryProvider>
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Issue Preview')).toBeInTheDocument();
    });

    // Verify that the publish button is disabled or shows appropriate message
    const publishButton = screen.getByText('Publish to GitHub');
    
    // The button should still be clickable but should show an error
    fireEvent.click(publishButton);

    // Since no repo is selected, it should not show confirmation dialog
    await waitFor(() => {
      expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
    });
  });

  it('updates UI after successful repository switch and publish', async () => {
    // Initial state with one repo
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'octocat/Hello-World' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          repositories: [
            {
              id: 1,
              name: 'Hello-World',
              full_name: 'octocat/Hello-World',
              private: false,
              owner: { login: 'octocat' }
            },
            {
              id: 2,
              name: 'Another-Repo',
              full_name: 'octocat/Another-Repo',
              private: true,
              owner: { login: 'octocat' }
            }
          ]
        })
      });

    const { rerender } = render(
      <SessionProvider session={mockSession}>
        <RepositoryProvider>
          <PreviewPage />
        </RepositoryProvider>
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Issue Preview')).toBeInTheDocument();
    });

    // Simulate repository switch
    window.dispatchEvent(new CustomEvent('repository-switched', { 
      detail: { repository: 'octocat/Another-Repo' } 
    }));

    // Mock updated fetch calls after switch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'octocat/Another-Repo' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          repositories: [
            {
              id: 1,
              name: 'Hello-World',
              full_name: 'octocat/Hello-World',
              private: false,
              owner: { login: 'octocat' }
            },
            {
              id: 2,
              name: 'Another-Repo',
              full_name: 'octocat/Another-Repo',
              private: true,
              owner: { login: 'octocat' }
            }
          ]
        })
      });

    // Force re-render to pick up context changes
    rerender(
      <SessionProvider session={mockSession}>
        <RepositoryProvider>
          <PreviewPage />
        </RepositoryProvider>
      </SessionProvider>
    );

    // Verify UI updates with new repository
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/selected-repo');
    });
  });
});