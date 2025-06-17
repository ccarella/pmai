import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from '@/app/settings/page';
import { useSession } from 'next-auth/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { whileHover, whileTap, animate, initial, exit, transition, ...htmlProps } = props as any;
      return <div {...htmlProps}>{children}</div>;
    },
    button: ({ children, onClick, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { whileHover, whileTap, animate, initial, exit, transition, ...htmlProps } = props as any;
      return <button onClick={onClick} {...htmlProps}>{children}</button>;
    },
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { whileHover, whileTap, animate, initial, exit, transition, ...htmlProps } = props as any;
      return <span {...htmlProps}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children }: React.PropsWithChildren) => children,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock fetch
global.fetch = jest.fn();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    (global.fetch as jest.Mock).mockClear();
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });
  });

  it('should render the settings page with title and description', () => {
    renderWithProviders(<SettingsPage />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Connect your GitHub account to publish issues directly')).toBeInTheDocument();
  });

  it('should render the appearance section with theme toggle', () => {
    renderWithProviders(<SettingsPage />);
    
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Choose your preferred theme')).toBeInTheDocument();
    
    // Check if theme toggle buttons are present
    expect(screen.getByLabelText('Set theme to Light')).toBeInTheDocument();
    expect(screen.getByLabelText('Set theme to Dark')).toBeInTheDocument();
    expect(screen.getByLabelText('Set theme to System')).toBeInTheDocument();
  });

  it('should allow changing theme from settings page', async () => {
    renderWithProviders(<SettingsPage />);
    
    const darkButton = screen.getByLabelText('Set theme to Dark');
    fireEvent.click(darkButton);
    
    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('should render GitHub connection section', () => {
    renderWithProviders(<SettingsPage />);
    
    expect(screen.getByText('GitHub Connection')).toBeInTheDocument();
    expect(screen.getByText('Connect your GitHub account to publish issues directly to your repositories.')).toBeInTheDocument();
    expect(screen.getByText('Connect with GitHub')).toBeInTheDocument();
  });

  it('should show connected state when user is authenticated', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
          id: '123',
        },
      },
      status: 'authenticated',
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ selectedRepo: 'test-user/test-repo' }),
    });

    renderWithProviders(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('test-user/test-repo')).toBeInTheDocument();
    });
  });

  it('should show back to home link', () => {
    renderWithProviders(<SettingsPage />);
    
    const backLink = screen.getByText('Back to Home');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/');
  });
});