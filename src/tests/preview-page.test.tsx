import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import PreviewPage from '@/app/preview/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/PublishButton', () => ({
  PublishButton: ({ onSuccess }: { onSuccess: (url: string) => void }) => (
    <button onClick={() => onSuccess('https://github.com/repo/issues/1')}>
      Publish to GitHub
    </button>
  ),
}));

const mockPush = jest.fn();

const mockIssue = {
  original: 'Build a user authentication system with email and password',
  markdown: '# User Authentication System\n\n## Overview\nImplement a secure authentication system...',
  claudePrompt: 'Please implement a user authentication system...',
  summary: {
    type: 'feature',
    priority: 'high',
    estimatedEffort: 'large',
  },
};

describe('PreviewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });
  });

  it('renders loading state initially', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    
    render(<PreviewPage />);
    
    expect(screen.getByText('Loading your issue...')).toBeInTheDocument();
  });

  it('redirects to /create if no issue data in localStorage', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    
    render(<PreviewPage />);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/create');
    });
  });

  it('displays issue content with three tabs', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    expect(screen.getByText('Issue Preview')).toBeInTheDocument();
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('GitHub Issue')).toBeInTheDocument();
    expect(screen.getByText('Claude Prompt')).toBeInTheDocument();
  });

  it('displays GitHub Issue content by default', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    expect(screen.getByText(/User Authentication System/)).toBeInTheDocument();
  });

  it('switches to Original tab when clicked', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    const originalTab = screen.getByText('Original');
    fireEvent.click(originalTab);
    
    expect(screen.getByText(/Build a user authentication system/)).toBeInTheDocument();
  });

  it('switches to Claude Prompt tab when clicked', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    const claudeTab = screen.getByText('Claude Prompt');
    fireEvent.click(claudeTab);
    
    expect(screen.getByText(/Please implement a user authentication system/)).toBeInTheDocument();
  });

  it('copies content to clipboard based on active tab', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    // Test copying GitHub Issue (default)
    const copyButton = screen.getByText('Copy to Clipboard');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockIssue.markdown);
    });
    
    // Switch to Original and copy
    const originalTab = screen.getByText('Original');
    fireEvent.click(originalTab);
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(mockIssue.original);
    });
  });

  it('displays issue summary correctly', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    expect(screen.getByText('Issue Summary')).toBeInTheDocument();
    expect(screen.getByText('feature')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('large')).toBeInTheDocument();
  });

  it('handles Create New Issue button click', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    const createNewButton = screen.getByText('Create New Issue');
    fireEvent.click(createNewButton);
    
    expect(mockPush).toHaveBeenCalledWith('/create');
  });

  it('handles malformed localStorage data gracefully', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue('invalid json');
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    render(<PreviewPage />);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/create');
      expect(consoleError).toHaveBeenCalled();
    });
    
    consoleError.mockRestore();
  });

  it('shows copied feedback when copy button is clicked', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    const copyButton = screen.getByText('Copy to Clipboard');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});