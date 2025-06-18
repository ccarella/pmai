import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PreviewPage from '@/app/preview/page';
import { RepositoryProvider } from '@/contexts/RepositoryContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/components/PublishButton', () => ({
  PublishButton: ({ onSuccess }: { onSuccess: (url: string) => void }) => (
    <button onClick={() => onSuccess('https://github.com/repo/issues/1')}>
      Publish to GitHub
    </button>
  ),
}));

const mockPush = jest.fn();
const mockIssue = {
  original: 'Build a user authentication system with email and password',
  markdown: '# User Authentication System\n\n## Overview\nImplement a secure authentication system...',
  claudePrompt: 'Please implement a user authentication system...',
  summary: {
    type: 'feature',
    priority: 'high',
    estimatedEffort: 'large',
  },
};

// Mock fetch responses
const mockSelectedRepoResponse = {
  selectedRepo: 'octocat/Hello-World'
};

const mockAddedReposResponse = {
  repositories: [
    {
      id: 1,
      name: 'Hello-World',
      full_name: 'octocat/Hello-World',
      private: false,
      owner: {
        login: 'octocat'
      }
    },
    {
      id: 2,
      name: 'private-repo',
      full_name: 'octocat/private-repo',
      private: true,
      owner: {
        login: 'octocat'
      }
    }
  ]
};

describe('PreviewPage - Repository Information', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Setup session mock
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com'
        }
      },
      status: 'authenticated'
    });
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Setup clipboard mock
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

  it('displays repository information in the Issue Summary section', async () => {
    // Setup localStorage with issue data
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );

    // Mock fetch responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSelectedRepoResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAddedReposResponse
      });

    render(
      <RepositoryProvider>
        <PreviewPage />
      </RepositoryProvider>
    );

    // Wait for the repository information to load
    await waitFor(() => {
      expect(screen.getByText('Repository:')).toBeInTheDocument();
      expect(screen.getByText('octocat/Hello-World')).toBeInTheDocument();
    });
  });

  it('displays a warning when no repository is selected', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );

    // Mock fetch responses with no selected repo
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: null })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAddedReposResponse
      });

    render(
      <RepositoryProvider>
        <PreviewPage />
      </RepositoryProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Repository:')).toBeInTheDocument();
      expect(screen.getByText('No repository selected')).toBeInTheDocument();
    });
  });

  it('shows private repository indicator when repository is private', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );

    // Mock fetch responses with private repo selected
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'octocat/private-repo' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAddedReposResponse
      });

    render(
      <RepositoryProvider>
        <PreviewPage />
      </RepositoryProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('octocat/private-repo')).toBeInTheDocument();
      expect(screen.getByText('Private')).toBeInTheDocument();
    });
  });

  it('displays confirmation dialog before publishing when clicking Publish button', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSelectedRepoResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAddedReposResponse
      });

    render(
      <RepositoryProvider>
        <PreviewPage />
      </RepositoryProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('octocat/Hello-World')).toBeInTheDocument();
    });

    // Click the publish button
    const publishButton = screen.getByText('Publish to GitHub');
    fireEvent.click(publishButton);

    // Check if confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText(/Confirm Repository/)).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to publish this issue to/)).toBeInTheDocument();
      expect(screen.getByText('octocat/Hello-World', { selector: 'strong' })).toBeInTheDocument();
    });
  });

  it('allows user to cancel repository confirmation', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSelectedRepoResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAddedReposResponse
      });

    render(
      <RepositoryProvider>
        <PreviewPage />
      </RepositoryProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('octocat/Hello-World')).toBeInTheDocument();
    });

    const publishButton = screen.getByText('Publish to GitHub');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText(/Confirm Repository/)).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Confirmation dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText(/Confirm Repository/)).not.toBeInTheDocument();
    });
  });

  it('proceeds with publishing after confirmation', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSelectedRepoResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAddedReposResponse
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
      <RepositoryProvider>
        <PreviewPage />
      </RepositoryProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('octocat/Hello-World')).toBeInTheDocument();
    });

    const publishButton = screen.getByText('Publish to GitHub');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText(/Confirm Repository/)).toBeInTheDocument();
    });

    // Click confirm button
    const confirmButton = screen.getByText('Confirm & Publish');
    fireEvent.click(confirmButton);

    // Should proceed with publishing
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/publish', expect.any(Object));
    });
  });

  it('shows link to settings when no repository is selected and trying to publish', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );

    // Mock no selected repository
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: null })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAddedReposResponse
      });

    render(
      <RepositoryProvider>
        <PreviewPage />
      </RepositoryProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No repository selected')).toBeInTheDocument();
    });

    // Should show a link to settings
    expect(screen.getByText('Select a repository')).toBeInTheDocument();
    const selectRepoLink = screen.getByRole('link', { name: 'Select a repository' });
    expect(selectRepoLink).toHaveAttribute('href', '/settings/github');
  });
});