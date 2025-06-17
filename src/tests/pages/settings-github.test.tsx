import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GitHubRepositoriesPage from '@/app/settings/github/page';

jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      const { whileHover, whileTap, animate, initial, exit, transition, ...htmlProps } = props as any;
      return <div {...htmlProps}>{children}</div>;
    },
    button: ({ children, onClick, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      const { whileHover, whileTap, animate, initial, exit, transition, ...htmlProps } = props as any;
      return <button onClick={onClick} {...htmlProps}>{children}</button>;
    },
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      const { whileHover, whileTap, animate, initial, exit, transition, ...htmlProps } = props as any;
      return <span {...htmlProps}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children }: React.PropsWithChildren) => children,
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

global.fetch = jest.fn();

describe('GitHubRepositoriesPage', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
    } as ReturnType<typeof useRouter>);
  });

  describe('Mobile Responsiveness', () => {
    it('should render with mobile-friendly classes', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '123', name: 'Test User' },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: [],
            selectedRepo: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: [],
          }),
        });

      render(<GitHubRepositoriesPage />);

      await waitFor(() => {
        // Check responsive padding
        const container = screen.getByText('Manage Repositories').closest('div')?.parentElement?.parentElement;
        expect(container).toHaveClass('p-4', 'sm:p-6', 'md:p-8');

        // Check responsive heading
        const heading = screen.getByRole('heading', { name: 'Manage Repositories' });
        expect(heading).toHaveClass('text-3xl', 'sm:text-4xl');

        // Check responsive search input
        const searchInput = screen.getByPlaceholderText('Search repositories...');
        expect(searchInput).toHaveClass('min-h-[44px]', 'text-sm', 'sm:text-base');
      });
    });

    it('should have proper touch targets for repository cards', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '123', name: 'Test User' },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      const mockRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'user/test-repo',
          description: 'A test repository',
          private: false,
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: mockRepos,
            selectedRepo: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: [],
          }),
        });

      render(<GitHubRepositoriesPage />);

      await waitFor(() => {
        const repoCard = screen.getByText('test-repo').closest('div')?.parentElement?.parentElement;
        expect(repoCard).toHaveClass('p-3', 'sm:p-4');
      });
    });

    it('should display repository info with responsive text sizes', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '123', name: 'Test User' },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      const mockRepos = [
        {
          id: 1,
          name: 'very-long-repository-name-that-should-truncate',
          full_name: 'user/very-long-repository-name-that-should-truncate',
          description: 'This is a very long description that should be truncated on mobile devices to prevent layout issues',
          private: true,
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: mockRepos,
            selectedRepo: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: [],
          }),
        });

      render(<GitHubRepositoriesPage />);

      await waitFor(() => {
        const repoName = screen.getByText('very-long-repository-name-that-should-truncate');
        expect(repoName).toHaveClass('text-sm', 'sm:text-base', 'truncate');

        const fullName = screen.getByText('user/very-long-repository-name-that-should-truncate');
        expect(fullName).toHaveClass('text-xs', 'sm:text-sm', 'break-all');

        const description = screen.getByText(/This is a very long description/);
        expect(description).toHaveClass('text-xs', 'sm:text-sm', 'line-clamp-2');

        const privateLabel = screen.getByText('Private');
        expect(privateLabel).toHaveClass('text-xs', 'px-1.5', 'sm:px-2');
      });
    });

    it('should have proper touch target for remove button', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '123', name: 'Test User' },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      const mockRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'user/test-repo',
          description: null,
          private: false,
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: mockRepos,
            selectedRepo: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: ['user/test-repo'],
          }),
        });

      render(<GitHubRepositoriesPage />);

      // Add the repository first
      await waitFor(() => {
        const repoCard = screen.getByText('test-repo').closest('[role="button"]') as HTMLElement;
        fireEvent.click(repoCard);
      });

      // Check remove button has proper size
      await waitFor(() => {
        const removeButton = screen.getByTitle('Remove from list');
        expect(removeButton).toHaveClass('min-w-[44px]', 'min-h-[44px]');
        
        // Check SVG icon size
        const svg = removeButton.querySelector('svg');
        expect(svg).toHaveClass('w-5', 'h-5');
      });
    });

    it('should stack footer buttons on mobile', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '123', name: 'Test User' },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: [],
            selectedRepo: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: ['user/test-repo'],
          }),
        });

      render(<GitHubRepositoriesPage />);

      await waitFor(() => {
        const footer = screen.getByRole('button', { name: 'Back to Settings' }).closest('div');
        expect(footer).toHaveClass('flex-col', 'sm:flex-row');
      });
    });
  });

  describe('Repository Management', () => {
    it('should redirect to settings if not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);

      render(<GitHubRepositoriesPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/settings');
      });
    });

    it('should add repository to list', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '123', name: 'Test User' },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      const mockRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'user/test-repo',
          description: null,
          private: false,
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: mockRepos,
            selectedRepo: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: [],
          }),
        });

      render(<GitHubRepositoriesPage />);

      await waitFor(() => {
        const repoCard = screen.getByText('test-repo').closest('[role="button"]') as HTMLElement;
        fireEvent.click(repoCard);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/github/added-repos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', repoFullName: 'user/test-repo' }),
        });
      });
    });

    it('should filter repositories by search term', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '123', name: 'Test User' },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      const mockRepos = [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'user/test-repo',
          description: 'A test repository',
          private: false,
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'another-repo',
          full_name: 'user/another-repo',
          description: 'Another repository',
          private: false,
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: mockRepos,
            selectedRepo: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            repositories: [],
          }),
        });

      render(<GitHubRepositoriesPage />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search repositories...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      expect(screen.getByText('test-repo')).toBeInTheDocument();
      expect(screen.queryByText('another-repo')).not.toBeInTheDocument();
    });
  });
});