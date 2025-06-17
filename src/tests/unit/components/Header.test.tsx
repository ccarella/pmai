import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/Header';
import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/components/RepositorySwitcher', () => ({
  RepositorySwitcher: () => <div>Repository Switcher</div>,
}));

jest.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggleButton: () => <button>Theme Toggle</button>,
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Header', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('should render header with logo', () => {
    render(
      <SessionProvider session={null}>
        <Header />
      </SessionProvider>
    );

    const logo = screen.getByText('PMAI');
    expect(logo).toBeInTheDocument();
    expect(logo.closest('a')).toHaveAttribute('href', '/');
  });

  it('should render navigation tabs', () => {
    render(
      <SessionProvider session={null}>
        <Header />
      </SessionProvider>
    );

    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Issues')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should highlight active tab for /create', () => {
    mockUsePathname.mockReturnValue('/create');

    render(
      <SessionProvider session={null}>
        <Header />
      </SessionProvider>
    );

    const createTab = screen.getByText('Create');
    expect(createTab).toHaveClass('text-foreground', 'border-b-2', 'border-accent');

    const issuesTab = screen.getByText('Issues');
    expect(issuesTab).toHaveClass('text-muted-foreground');
    expect(issuesTab).not.toHaveClass('border-b-2');
  });

  it('should highlight active tab for /issues', () => {
    mockUsePathname.mockReturnValue('/issues');

    render(
      <SessionProvider session={null}>
        <Header />
      </SessionProvider>
    );

    const issuesTab = screen.getByText('Issues');
    expect(issuesTab).toHaveClass('text-foreground', 'border-b-2', 'border-accent');

    const createTab = screen.getByText('Create');
    expect(createTab).toHaveClass('text-muted-foreground');
    expect(createTab).not.toHaveClass('border-b-2');
  });

  it('should highlight active tab for /settings', () => {
    mockUsePathname.mockReturnValue('/settings/github');

    render(
      <SessionProvider session={null}>
        <Header />
      </SessionProvider>
    );

    const settingsTab = screen.getByText('Settings');
    expect(settingsTab).toHaveClass('text-foreground', 'border-b-2', 'border-accent');
  });

  it('should render repository switcher', () => {
    render(
      <SessionProvider session={null}>
        <Header />
      </SessionProvider>
    );

    expect(screen.getByText('Repository Switcher')).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    render(
      <SessionProvider session={null}>
        <Header />
      </SessionProvider>
    );

    expect(screen.getByText('Theme Toggle')).toBeInTheDocument();
  });

  it('should render settings icon link', () => {
    render(
      <SessionProvider session={null}>
        <Header />
      </SessionProvider>
    );

    const settingsIcon = screen.getByTitle('Settings');
    expect(settingsIcon).toBeInTheDocument();
    expect(settingsIcon).toHaveAttribute('href', '/settings');
  });
});