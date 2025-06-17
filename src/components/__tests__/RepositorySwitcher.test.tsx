import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { RepositorySwitcher } from '../RepositorySwitcher';
import { RepositoryProvider } from '@/contexts/RepositoryContext';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock next/link
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  };
});

describe('RepositorySwitcher', () => {
  const mockRouter = {
    refresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <RepositoryProvider>
        {ui}
      </RepositoryProvider>
    );
  };

  it('should not render when user is not logged in', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { container } = renderWithProvider(<RepositorySwitcher />);
    expect(container.firstChild).toBeNull();
  });

  it('should show loading state initially', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    const { container } = renderWithProvider(<RepositorySwitcher />);
    const loadingDiv = container.querySelector('.animate-pulse');
    expect(loadingDiv).toBeInTheDocument();
  });

  it('should display selected repository', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo-name' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          repositories: [
            {
              id: 1,
              name: 'repo-name',
              full_name: 'owner/repo-name',
              private: false,
            },
          ],
        }),
      });

    renderWithProvider(<RepositorySwitcher />);

    await waitFor(() => {
      expect(screen.getByText('repo-name')).toBeInTheDocument();
    });
  });

  it('should show "Select repository" when no repo is selected', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: [] }),
      });

    renderWithProvider(<RepositorySwitcher />);

    await waitFor(() => {
      expect(screen.getByText('Select repository')).toBeInTheDocument();
    });
  });

  it('should toggle dropdown when clicked', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: [] }),
      });

    renderWithProvider(<RepositorySwitcher />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /switch repository/i })).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /switch repository/i });
    
    // Initially closed
    expect(button).toHaveAttribute('aria-expanded', 'false');
    
    // Open dropdown
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('No repositories added yet')).toBeInTheDocument();
    
    // Close dropdown
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should display repositories in dropdown', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    const mockRepos = [
      {
        id: 1,
        name: 'repo-1',
        full_name: 'owner/repo-1',
        private: false,
      },
      {
        id: 2,
        name: 'repo-2',
        full_name: 'owner/repo-2',
        private: true,
      },
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: mockRepos }),
      });

    renderWithProvider(<RepositorySwitcher />);

    await waitFor(() => {
      expect(screen.getByText('repo-1')).toBeInTheDocument();
    });

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /switch repository/i }));

    // Check repositories are displayed
    expect(screen.getAllByText('repo-1')).toHaveLength(2); // One in button, one in dropdown
    expect(screen.getByText('repo-2')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('should handle repository selection', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    const mockRepos = [
      {
        id: 1,
        name: 'repo-1',
        full_name: 'owner/repo-1',
        private: false,
      },
      {
        id: 2,
        name: 'repo-2',
        full_name: 'owner/repo-2',
        private: false,
      },
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: mockRepos }),
      });

    // Mock window event dispatch
    const eventListenerSpy = jest.spyOn(window, 'dispatchEvent');

    renderWithProvider(<RepositorySwitcher />);

    await waitFor(() => {
      expect(screen.getByText('repo-1')).toBeInTheDocument();
    });

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /switch repository/i }));

    // Reset fetch mock for the selection
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Click on repo-2
    const repo2Button = screen.getByText('repo-2').closest('button');
    fireEvent.click(repo2Button!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/github/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedRepo: 'owner/repo-2' }),
      });
    });

    expect(mockRouter.refresh).toHaveBeenCalled();
    expect(eventListenerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'repository-switched',
        detail: { repository: 'owner/repo-2' },
      })
    );
  });

  it('should show "Add repository" link', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: [] }),
      });

    renderWithProvider(<RepositorySwitcher />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /switch repository/i })).toBeInTheDocument();
    });

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /switch repository/i }));

    // Check for "Add repository" link
    const addRepoLink = screen.getByText('Add repository');
    expect(addRepoLink).toBeInTheDocument();
    expect(addRepoLink.closest('a')).toHaveAttribute('href', '/settings/github');
  });

  it('should close dropdown when clicking outside', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '123' } },
      status: 'authenticated',
    });

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: [] }),
      });

    renderWithProvider(
      <div>
        <RepositorySwitcher />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /switch repository/i })).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /switch repository/i });
    
    // Open dropdown
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});