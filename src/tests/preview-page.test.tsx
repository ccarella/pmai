import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import PreviewPage from '@/app/preview/page';
import { useRepository } from '@/contexts/RepositoryContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/RepositoryContext', () => ({
  useRepository: jest.fn(),
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

    (useRepository as jest.Mock).mockReturnValue({
      selectedRepo: 'owner/repo',
      addedRepos: [],
      isLoading: false,
      switchRepository: jest.fn(),
      refreshRepositories: jest.fn(),
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

  it('displays issue content without tabs', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    expect(screen.getByText('Issue Preview')).toBeInTheDocument();
    expect(screen.queryByText('Original')).not.toBeInTheDocument();
    expect(screen.queryByText('GitHub Issue')).not.toBeInTheDocument();
    expect(screen.queryByText('Claude Prompt')).not.toBeInTheDocument();
  });

  it('displays GitHub Issue content directly', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    expect(screen.getByText(/User Authentication System/)).toBeInTheDocument();
  });

  it('does not display original content', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    expect(screen.queryByText(/Build a user authentication system/)).not.toBeInTheDocument();
  });


  it('copies GitHub Issue content to clipboard using icon', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    const copyButton = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockIssue.markdown);
    });
  });

  it('displays issue summary without estimated effort', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );

    render(<PreviewPage />);

    expect(screen.getByText('Issue Summary')).toBeInTheDocument();
    expect(screen.getByText('owner/repo')).toBeInTheDocument();
    expect(screen.getByText('feature')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.queryByText('large')).not.toBeInTheDocument();
    expect(screen.queryByText('Estimated Effort:')).not.toBeInTheDocument();
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

  it('shows copied feedback when copy icon is clicked', async () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    const copyButton = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(screen.getByTitle('Copied!')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays Generated Content section properly', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    expect(screen.getByText('Generated Content')).toBeInTheDocument();
    expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument();
    
    // Ensure markdown content is visible
    const preElement = screen.getByText(/User Authentication System/).closest('pre');
    expect(preElement).toHaveClass('whitespace-pre-wrap', 'text-sm', 'font-mono');
  });

  it('ensures clean UI without tab navigation', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(
      JSON.stringify(mockIssue)
    );
    
    render(<PreviewPage />);
    
    // Check that there are no tab buttons
    const buttons = screen.getAllByRole('button');
    const tabButtons = buttons.filter(btn => 
      btn.textContent === 'Original' || btn.textContent === 'GitHub Issue'
    );
    expect(tabButtons).toHaveLength(0);
    
    // Verify only essential buttons are present
    expect(screen.getByText('Create New Issue')).toBeInTheDocument();
    expect(screen.getByText('Publish to GitHub')).toBeInTheDocument();
  });
});