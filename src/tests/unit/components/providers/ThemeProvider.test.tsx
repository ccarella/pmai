import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/providers/ThemeProvider';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

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

// Test component that uses the theme hook
const TestComponent = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('system')} data-testid="set-system">
        Set System
      </button>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('should provide default theme when no localStorage value exists', async () => {
    render(
      <ThemeProvider defaultTheme="system">
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    });
  });

  it('should load theme from localStorage on mount', async () => {
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  it('should save theme to localStorage when changed', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('set-dark'));

    await waitFor(() => {
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
  });

  it('should apply correct CSS classes to document element', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('set-dark'));

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    fireEvent.click(screen.getByTestId('set-light'));

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  it('should resolve system theme correctly', async () => {
    // Mock dark system preference
    (window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('set-system'));

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });
  });

  it('should throw error when useTheme is used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      useTheme();
      return <div>Test</div>;
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });

  it('should render without errors during hydration', () => {
    // This test ensures the component doesn't crash during hydration
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should render the test component successfully
    expect(screen.getByTestId('current-theme')).toBeInTheDocument();
  });

  it('should handle invalid localStorage values gracefully', async () => {
    localStorage.setItem('theme', 'invalid-theme');

    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });
});