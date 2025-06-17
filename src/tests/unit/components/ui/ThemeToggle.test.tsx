import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle, ThemeToggleButton } from '@/components/ui/ThemeToggle';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

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

const renderWithThemeProvider = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('should render theme option buttons', async () => {
    renderWithThemeProvider(<ThemeToggle />);
    
    // Check if all theme buttons are present
    expect(screen.getByLabelText('Set theme to Light')).toBeInTheDocument();
    expect(screen.getByLabelText('Set theme to Dark')).toBeInTheDocument();
    expect(screen.getByLabelText('Set theme to System')).toBeInTheDocument();
    
    // Check if icons and labels are present
    expect(screen.getByText('☀️')).toBeInTheDocument();
    expect(screen.getByText('🌙')).toBeInTheDocument();
    expect(screen.getByText('💻')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('should change theme when button is clicked', async () => {
    renderWithThemeProvider(<ThemeToggle />);
    
    const darkButton = screen.getByLabelText('Set theme to Dark');
    
    fireEvent.click(darkButton);
    
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(darkButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should highlight active theme button', () => {
    renderWithThemeProvider(<ThemeToggle />);
    
    // System should be active by default
    const systemButton = screen.getByLabelText('Set theme to System');
    expect(systemButton).toHaveClass('bg-accent');
    expect(systemButton).toHaveAttribute('aria-pressed', 'true');
    
    // Click dark theme
    const darkButton = screen.getByLabelText('Set theme to Dark');
    fireEvent.click(darkButton);
    
    expect(darkButton).toHaveClass('bg-accent');
    expect(darkButton).toHaveAttribute('aria-pressed', 'true');
    expect(systemButton).not.toHaveClass('bg-accent');
    expect(systemButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should show resolved theme for system option', () => {
    renderWithThemeProvider(<ThemeToggle />);
    
    // When system is selected, it should show the resolved theme
    const systemButton = screen.getByLabelText('Set theme to System');
    expect(systemButton).toHaveTextContent('(light)'); // Default system preference
  });
});

describe('ThemeToggleButton', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('should render current theme', async () => {
    renderWithThemeProvider(<ThemeToggleButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    // Should show system theme by default
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('💻')).toBeInTheDocument();
  });

  it('should cycle through themes when clicked', async () => {
    renderWithThemeProvider(<ThemeToggleButton />);
    
    const button = screen.getByRole('button');
    
    // Initial state should be system
    expect(screen.getByText('System')).toBeInTheDocument();
    
    // Click to cycle to light
    fireEvent.click(button);
    expect(screen.getByText('Light')).toBeInTheDocument();
    
    // Click to cycle to dark
    fireEvent.click(button);
    expect(screen.getByText('Dark')).toBeInTheDocument();
    
    // Click to cycle back to system
    fireEvent.click(button);
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithThemeProvider(<ThemeToggleButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
  });

  it('should persist theme changes', () => {
    renderWithThemeProvider(<ThemeToggleButton />);
    
    const button = screen.getByRole('button');
    
    // Click to change theme
    fireEvent.click(button);
    
    // Check if theme is saved to localStorage
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should show correct icon for each theme', () => {
    renderWithThemeProvider(<ThemeToggleButton />);
    
    const button = screen.getByRole('button');
    
    // System theme
    expect(screen.getByText('💻')).toBeInTheDocument();
    
    // Light theme
    fireEvent.click(button);
    expect(screen.getByText('☀️')).toBeInTheDocument();
    
    // Dark theme
    fireEvent.click(button);
    expect(screen.getByText('🌙')).toBeInTheDocument();
  });
});