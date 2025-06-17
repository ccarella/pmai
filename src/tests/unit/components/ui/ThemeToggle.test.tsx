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

  it('should render theme options', async () => {
    renderWithThemeProvider(<ThemeToggle />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Check if options are present
    expect(screen.getByText('☀️ Light')).toBeInTheDocument();
    expect(screen.getByText('🌙 Dark')).toBeInTheDocument();
    expect(screen.getByText('💻 System')).toBeInTheDocument();
  });

  it('should change theme when option is selected', async () => {
    renderWithThemeProvider(<ThemeToggle />);
    
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    
    fireEvent.change(select, { target: { value: 'dark' } });
    
    expect(select.value).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should have proper accessibility attributes', () => {
    renderWithThemeProvider(<ThemeToggle />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-label', 'Select theme');
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