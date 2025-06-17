import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SettingsPage from '@/app/settings/page';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLSpanElement>>) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
}));

jest.mock('@/lib/animations/utils', () => ({
  getRippleOrigin: jest.fn(() => ({ x: 50, y: 50 })),
}));

jest.mock('@/lib/animations/variants', () => ({
  fadeIn: {},
  cardVariants: {},
}));

jest.mock('@/lib/animations/hooks', () => ({
  useMousePosition: jest.fn(() => ({ x: 0, y: 0 })),
}));

jest.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <div>Theme Toggle</div>,
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

global.fetch = jest.fn();

// Helper function to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      refresh: jest.fn(),
    } as ReturnType<typeof useRouter>);
  });

  describe('Mobile Responsiveness', () => {
    it('should render with mobile-friendly classes', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      renderWithProviders(<SettingsPage />);

      // Check responsive padding
      const container = screen.getByText('Settings').closest('div')?.parentElement?.parentElement;
      expect(container).toHaveClass('p-4', 'sm:p-6', 'md:p-8');

      // Check responsive spacing
      const motionDiv = screen.getByText('Settings').closest('div')?.parentElement;
      expect(motionDiv).toHaveClass('space-y-6', 'sm:space-y-8');

      // Check responsive text sizes
      const heading = screen.getByRole('heading', { name: 'Settings' });
      expect(heading).toHaveClass('text-3xl', 'sm:text-4xl');

      const subtitle = screen.getByText('Connect your GitHub account to publish issues directly');
      expect(subtitle).toHaveClass('text-sm', 'sm:text-base');
    });

    it('should have proper touch targets for mobile buttons', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        const connectButton = screen.getByRole('button', { name: /Connect with GitHub/i });
        expect(connectButton).toHaveClass('min-h-[44px]');
      });
    });

    it('should stack buttons vertically on mobile when signed in', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com',
            image: 'https://example.com/avatar.jpg',
          },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ selectedRepo: 'test/repo' }),
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        const buttonContainer = screen.getByRole('button', { name: 'Manage Repositories' })
          .closest('div')?.parentElement;
        expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
      });
    });

    it('should display user info with responsive layout', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '123',
            name: 'Test User',
            email: 'very.long.email.address@example.com',
            image: 'https://example.com/avatar.jpg',
          },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ selectedRepo: 'test/repo' }),
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        const email = screen.getByText('very.long.email.address@example.com');
        expect(email).toHaveClass('break-all', 'text-xs', 'sm:text-sm');
      });
    });
  });

  describe('GitHub Connection', () => {
    it('should show GitHub not configured warning', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 503,
        ok: false,
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('GitHub integration not configured')).toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      renderWithProviders(<SettingsPage />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      // Loading spinner should be present within the GitHub Connection card
      const githubConnectionSection = screen.getByText('GitHub Connection').parentElement?.parentElement;
      expect(githubConnectionSection).toBeInTheDocument();
      const spinner = githubConnectionSection?.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should handle sign in', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        const connectButton = screen.getByRole('button', { name: /Connect with GitHub/i });
        fireEvent.click(connectButton);
      });

      expect(mockSignIn).toHaveBeenCalledWith('github');
    });

    it('should handle sign out', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com',
            image: 'https://example.com/avatar.jpg',
          },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ selectedRepo: null }),
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        const disconnectButton = screen.getByRole('button', { name: 'Disconnect' });
        fireEvent.click(disconnectButton);
      });

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/settings' });
    });

    it('should display selected repository', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com',
            image: 'https://example.com/avatar.jpg',
          },
          expires: '2025-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ selectedRepo: 'user/awesome-repo' }),
      });

      renderWithProviders(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Selected Repository')).toBeInTheDocument();
        expect(screen.getByText('user/awesome-repo')).toBeInTheDocument();
      });
    });
  });

  describe('Appearance Settings', () => {
    it('should display theme toggle', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      } as ReturnType<typeof useSession>);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      renderWithProviders(<SettingsPage />);

      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Choose your preferred theme')).toBeInTheDocument();
    });
  });
});