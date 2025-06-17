import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ThemeToggleButton } from '@/components/ui/ThemeToggle';

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

// Mock matchMedia with configurable return value
let matchMediaResult = false;
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: matchMediaResult,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Test app component that simulates a real app structure
const TestApp = () => {
  return (
    <ThemeProvider defaultTheme="system">
      <div className="min-h-screen bg-background text-foreground">
        <header className="p-4 border-b border-border">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Test App</h1>
            <ThemeToggleButton />
          </div>
        </header>
        <main className="p-4">
          <div className="bg-card-bg p-4 rounded-lg border border-border">
            <h2 className="text-lg font-semibold text-foreground">Content</h2>
            <p className="text-muted">This is test content</p>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};

describe('Theme Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    matchMediaResult = false;
  });

  it('should apply theme classes to document root and persist across component updates', async () => {
    render(<TestApp />);

    // Wait for component to mount and apply initial theme
    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    // Should have light class initially (system preference is light)
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Click to change to dark theme
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    // Document should still have light class
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click to change to dark theme
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    // Document should now have dark class
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);

    // Verify localStorage persistence
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should respect system theme preference when theme is set to system', async () => {
    // Set system preference to dark
    matchMediaResult = true;

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    // Should apply dark theme based on system preference
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should load saved theme from localStorage on app start', async () => {
    localStorage.setItem('theme', 'dark');

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    // Should apply saved dark theme
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should handle rapid theme changes correctly', async () => {
    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button');

    // Rapidly cycle through themes
    fireEvent.click(toggleButton); // light
    fireEvent.click(toggleButton); // dark
    fireEvent.click(toggleButton); // system
    fireEvent.click(toggleButton); // light

    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should maintain theme state across component remounts', async () => {
    const { unmount } = render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    // Change to dark theme
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton); // light
    fireEvent.click(toggleButton); // dark

    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    // Unmount and remount component
    unmount();
    render(<TestApp />);

    // Should restore dark theme from localStorage
    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should update meta theme-color when theme changes', async () => {
    // Add meta theme-color element
    const metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    metaThemeColor.content = '#ffffff';
    document.head.appendChild(metaThemeColor);

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole('button');

    // Change to dark theme
    fireEvent.click(toggleButton); // light
    fireEvent.click(toggleButton); // dark

    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    // Check if meta theme-color was updated for dark theme
    const updatedMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    expect(updatedMeta.content).toBe('#282a36');

    // Change back to light theme
    fireEvent.click(toggleButton); // system
    fireEvent.click(toggleButton); // light

    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    // Check if meta theme-color was updated for light theme
    expect(updatedMeta.content).toBe('#f8f8f2');

    // Cleanup
    document.head.removeChild(metaThemeColor);
  });
});