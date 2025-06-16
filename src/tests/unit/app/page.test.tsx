import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: { children: React.ReactNode }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: { children: React.ReactNode }) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: { children: React.ReactNode }) => <span {...props}>{children}</span>,
  },
}));

jest.mock('next/link', () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
  Link.displayName = 'Link';
  return Link;
});

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    expect(screen.getByText('GitHub Issue Generator')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<Home />);
    expect(screen.getByText('Create comprehensive, AI-optimized GitHub issues for Claude Code')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<Home />);
    expect(screen.getByText(/Transform your product requirements into detailed/)).toBeInTheDocument();
  });

  it('renders the create issue button', () => {
    render(<Home />);
    const link = screen.getByRole('link', { name: 'Create New Issue' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/create');
  });

  it('does not render the tech stack information', () => {
    render(<Home />);
    expect(screen.queryByText(/Built with Next.js/)).not.toBeInTheDocument();
    expect(screen.queryByText(/React Hook Form/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Zod validation/)).not.toBeInTheDocument();
  });

  it('does not render the TDD information', () => {
    render(<Home />);
    expect(screen.queryByText(/Optimized for TDD/)).not.toBeInTheDocument();
    expect(screen.queryByText(/comprehensive test coverage/)).not.toBeInTheDocument();
  });
});