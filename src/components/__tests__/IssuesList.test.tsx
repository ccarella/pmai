import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IssuesList } from '../IssuesList';
import { GitHubIssue } from '@/lib/types/github';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      // Filter out framer-motion specific props
      const cleanProps: Record<string, unknown> = {};
      Object.keys(props).forEach(key => {
        if (!['layout', 'initial', 'animate', 'exit', 'variants', 'whileHover', 'whileTap', 'transition'].includes(key)) {
          cleanProps[key] = props[key];
        }
      });
      return <div {...cleanProps}>{children}</div>;
    },
    svg: ({ children, ...props }: React.PropsWithChildren<React.SVGProps<SVGSVGElement>>) => {
      // Filter out framer-motion specific props
      const cleanProps: Record<string, unknown> = {};
      Object.keys(props).forEach(key => {
        if (!['initial', 'animate', 'exit', 'variants', 'transition'].includes(key)) {
          cleanProps[key] = props[key];
        }
      });
      return <svg {...cleanProps}>{children}</svg>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock react-markdown
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

// Mock the Card component
jest.mock('../ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

// Mock PRStatusIndicator
jest.mock('../PRStatusIndicator', () => ({
  PRStatusIndicator: ({ status }: { status: string }) => (
    <div data-testid={`pr-status-${status}`}>PR Status: {status}</div>
  ),
}));

// Mock usePRStatuses hook
jest.mock('@/lib/hooks/usePRStatuses', () => ({
  usePRStatuses: () => ({ statuses: {} }),
}));

// Mock animation libs
jest.mock('@/lib/animations/hooks', () => ({
  useMousePosition: () => ({ x: 0, y: 0 }),
}));

jest.mock('@/lib/animations/utils', () => ({
  calculate3DRotation: () => ({ rotateX: 0, rotateY: 0 }),
}));

jest.mock('@/lib/animations/variants', () => ({
  cardVariants: {},
  successCheck: {},
}));

// Mock clipboard API
const mockWriteText = jest.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

// Mock window.open
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

describe('IssuesList', () => {
  const mockIssues: GitHubIssue[] = [
    {
      id: 1,
      number: 123,
      title: 'Test Issue 1',
      body: 'This is the body content of test issue 1',
      state: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      html_url: 'https://github.com/test/repo/issues/123',
      user: {
        login: 'testuser',
        avatar_url: 'https://github.com/testuser.png',
      },
      labels: [
        { id: 1, name: 'bug', color: 'FF0000' },
        { id: 2, name: 'enhancement', color: '00FF00' },
      ],
      comments: 5,
      pull_request: undefined,
      closed_at: null,
    },
    {
      id: 2,
      number: 124,
      title: 'Test Issue 2',
      body: 'This is the body content of test issue 2',
      state: 'closed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      html_url: 'https://github.com/test/repo/issues/124',
      user: {
        login: 'testuser2',
        avatar_url: 'https://github.com/testuser2.png',
      },
      labels: [],
      comments: 0,
      pull_request: undefined,
      closed_at: new Date().toISOString(),
    },
    {
      id: 3,
      number: 125,
      title: 'Test PR Issue',
      body: 'This is a pull request',
      state: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      html_url: 'https://github.com/test/repo/issues/125',
      user: {
        login: 'testuser3',
        avatar_url: 'https://github.com/testuser3.png',
      },
      labels: [],
      comments: 2,
      pull_request: {
        url: 'https://api.github.com/repos/test/repo/pulls/125',
        html_url: 'https://github.com/test/repo/pull/125',
        diff_url: 'https://github.com/test/repo/pull/125.diff',
        patch_url: 'https://github.com/test/repo/pull/125.patch',
      },
      closed_at: null,
    },
    {
      id: 4,
      number: 126,
      title: 'Test PR Issue with boolean',
      body: 'This is a pull request with boolean flag',
      state: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      html_url: 'https://github.com/test/repo/issues/126',
      user: {
        login: 'testuser4',
        avatar_url: 'https://github.com/testuser4.png',
      },
      labels: [],
      comments: 0,
      pull_request: true,
      closed_at: null,
    },
  ];

  const mockOnSelectIssue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockClear();
    mockWindowOpen.mockClear();
  });

  it('renders empty state when no issues', () => {
    render(
      <IssuesList
        issues={[]}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    expect(screen.getByText('No issues found')).toBeInTheDocument();
  });

  it('renders list of issues', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    expect(screen.getByText('Test Issue 1')).toBeInTheDocument();
    expect(screen.getByText('Test Issue 2')).toBeInTheDocument();
    expect(screen.getByText('#123')).toBeInTheDocument();
    expect(screen.getByText('#124')).toBeInTheDocument();
  });

  it('expands issue on click to show body content', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    // Initially, body content should not be visible
    expect(screen.queryByText('This is the body content of test issue 1')).not.toBeInTheDocument();

    // Click on the first issue
    const firstIssue = screen.getByText('Test Issue 1').closest('[role="button"]');
    fireEvent.click(firstIssue!);

    // Body content should now be visible
    expect(screen.getByText('This is the body content of test issue 1')).toBeInTheDocument();
    expect(mockOnSelectIssue).toHaveBeenCalledWith(mockIssues[0]);
  });

  it('collapses issue on second click', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    const firstIssue = screen.getByText('Test Issue 1').closest('[role="button"]');
    
    // First click expands
    fireEvent.click(firstIssue!);
    expect(screen.getByText('This is the body content of test issue 1')).toBeInTheDocument();

    // Second click collapses
    fireEvent.click(firstIssue!);
    expect(screen.queryByText('This is the body content of test issue 1')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    const firstIssue = screen.getByText('Test Issue 1').closest('[role="button"]');
    
    // Press Enter to expand
    fireEvent.keyDown(firstIssue!, { key: 'Enter' });
    expect(screen.getByText('This is the body content of test issue 1')).toBeInTheDocument();

    // Press Space to collapse
    fireEvent.keyDown(firstIssue!, { key: ' ' });
    expect(screen.queryByText('This is the body content of test issue 1')).not.toBeInTheDocument();
  });

  it('shows correct aria-expanded attribute', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    const firstIssue = screen.getByText('Test Issue 1').closest('[role="button"]');
    
    // Initially collapsed
    expect(firstIssue).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(firstIssue!);
    expect(firstIssue).toHaveAttribute('aria-expanded', 'true');
  });

  it('displays issue labels', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('enhancement')).toBeInTheDocument();
  });

  it('shows comment count when present', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    expect(screen.getByText('5 comments')).toBeInTheDocument();
  });

  it('applies selected styling to selected issue', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={mockIssues[0]}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    const selectedIssue = screen.getByText('Test Issue 1').closest('[role="button"]');
    expect(selectedIssue?.className).toContain('ring-2');
    expect(selectedIssue?.className).toContain('ring-accent');
  });

  it('does not show body content for issues without body', () => {
    const issuesWithoutBody = [
      {
        ...mockIssues[0],
        body: null,
      },
    ];

    render(
      <IssuesList
        issues={issuesWithoutBody}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    const issue = screen.getByText('Test Issue 1').closest('[role="button"]');
    fireEvent.click(issue!);

    // Should not show any body content
    expect(screen.queryByText('This is the body content')).not.toBeInTheDocument();
  });

  describe('Copy URL functionality', () => {
    beforeEach(() => {
      mockWriteText.mockClear();
    });

    it('renders copy button for each issue', () => {
      render(
        <IssuesList
          issues={mockIssues}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const copyButtons = screen.getAllByTitle('Copy GitHub URL');
      expect(copyButtons).toHaveLength(mockIssues.length);
    });

    it('copies issue URL to clipboard on button click', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);

      render(
        <IssuesList
          issues={mockIssues}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const copyButton = screen.getAllByTitle('Copy GitHub URL')[0];
      fireEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith('https://github.com/test/repo/issues/123');
    });

    it('shows success feedback after copying', async () => {
      mockWriteText.mockResolvedValueOnce(undefined);

      render(
        <IssuesList
          issues={mockIssues}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const copyButton = screen.getAllByTitle('Copy GitHub URL')[0];
      fireEvent.click(copyButton);

      // Wait for the success state
      expect(await screen.findByTitle('Copied!')).toBeInTheDocument();
      expect(await screen.findByLabelText('URL copied!')).toBeInTheDocument();
    });

    it('does not trigger issue expansion when clicking copy button', () => {
      mockWriteText.mockResolvedValueOnce(undefined);

      render(
        <IssuesList
          issues={mockIssues}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const copyButton = screen.getAllByTitle('Copy GitHub URL')[0];
      fireEvent.click(copyButton);

      // Issue body should not be visible (not expanded)
      expect(screen.queryByText('This is the body content of test issue 1')).not.toBeInTheDocument();
      
      // onSelectIssue should not have been called
      expect(mockOnSelectIssue).not.toHaveBeenCalled();
    });

    it('handles keyboard interaction for copy button', () => {
      mockWriteText.mockResolvedValueOnce(undefined);

      render(
        <IssuesList
          issues={mockIssues}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const copyButton = screen.getAllByTitle('Copy GitHub URL')[0];
      
      // Press Enter on copy button
      fireEvent.keyDown(copyButton, { key: 'Enter' });
      expect(mockWriteText).toHaveBeenCalledWith('https://github.com/test/repo/issues/123');
      
      // Clear mock
      mockWriteText.mockClear();
      
      // Press Space on copy button
      fireEvent.keyDown(copyButton, { key: ' ' });
      expect(mockWriteText).toHaveBeenCalledWith('https://github.com/test/repo/issues/123');
    });

    it('fallsback to execCommand when clipboard API is not available', async () => {
      // Mock clipboard API to throw error
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard API not available'));
      
      // Mock document.execCommand
      const mockExecCommand = jest.fn(() => true);
      document.execCommand = mockExecCommand;

      render(
        <IssuesList
          issues={mockIssues}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const copyButton = screen.getAllByTitle('Copy GitHub URL')[0];
      fireEvent.click(copyButton);

      // Wait for the fallback to execute
      await waitFor(() => {
        expect(mockExecCommand).toHaveBeenCalledWith('copy');
      });
    });

    it('handles copy failure gracefully', async () => {
      // Mock both clipboard API and execCommand to fail
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard API not available'));
      document.execCommand = jest.fn(() => {
        throw new Error('execCommand failed');
      });
      
      // Mock console.error to verify error is logged
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

      render(
        <IssuesList
          issues={mockIssues}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const copyButton = screen.getAllByTitle('Copy GitHub URL')[0];
      fireEvent.click(copyButton);

      // Wait for the error to be logged
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Failed to copy URL');
      });
      
      mockConsoleError.mockRestore();
    });
  });

  describe('Pull Request Icon functionality', () => {
    beforeEach(() => {
      mockWindowOpen.mockClear();
    });

    it('renders PR icon for issues with pull requests', () => {
      render(
        <IssuesList
          issues={mockIssues}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      // PR icons should be rendered for issues with pull_request field
      const prButtons = screen.getAllByTitle('Open pull request in new tab');
      expect(prButtons).toHaveLength(2); // Two issues have pull_request
    });

    it('does not render PR icon for regular issues', () => {
      render(
        <IssuesList
          issues={[mockIssues[0], mockIssues[1]]} // Only regular issues
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      // No PR icons should be rendered
      const prButtons = screen.queryAllByTitle('Open pull request in new tab');
      expect(prButtons).toHaveLength(0);
    });

    it('opens PR URL in new tab when PR icon is clicked (with full PR object)', () => {
      render(
        <IssuesList
          issues={[mockIssues[2]]} // Issue with full PR object
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const prButton = screen.getByTitle('Open pull request in new tab');
      fireEvent.click(prButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/test/repo/pull/125',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('opens PR URL in new tab when PR icon is clicked (with boolean PR flag)', () => {
      render(
        <IssuesList
          issues={[mockIssues[3]]} // Issue with boolean PR flag
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const prButton = screen.getByTitle('Open pull request in new tab');
      fireEvent.click(prButton);

      // Should convert issue URL to PR URL
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/test/repo/pull/126',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('does not trigger issue expansion when clicking PR icon', () => {
      render(
        <IssuesList
          issues={[mockIssues[2]]}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const prButton = screen.getByTitle('Open pull request in new tab');
      fireEvent.click(prButton);

      // Issue body should not be visible (not expanded)
      expect(screen.queryByText('This is a pull request')).not.toBeInTheDocument();
      
      // onSelectIssue should not have been called
      expect(mockOnSelectIssue).not.toHaveBeenCalled();
    });

    it('handles keyboard interaction for PR icon (Enter key)', () => {
      render(
        <IssuesList
          issues={[mockIssues[2]]}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const prButton = screen.getByTitle('Open pull request in new tab');
      fireEvent.keyDown(prButton, { key: 'Enter' });

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/test/repo/pull/125',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('handles keyboard interaction for PR icon (Space key)', () => {
      render(
        <IssuesList
          issues={[mockIssues[2]]}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const prButton = screen.getByTitle('Open pull request in new tab');
      fireEvent.keyDown(prButton, { key: ' ' });

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://github.com/test/repo/pull/125',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('ignores other keys on PR icon', () => {
      render(
        <IssuesList
          issues={[mockIssues[2]]}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const prButton = screen.getByTitle('Open pull request in new tab');
      fireEvent.keyDown(prButton, { key: 'Tab' });

      expect(mockWindowOpen).not.toHaveBeenCalled();
    });

    it('PR icon has proper accessibility attributes', () => {
      render(
        <IssuesList
          issues={[mockIssues[2]]}
          selectedIssue={null}
          onSelectIssue={mockOnSelectIssue}
        />
      );

      const prButton = screen.getByTitle('Open pull request in new tab');
      expect(prButton).toHaveAttribute('aria-label', 'Open pull request in new tab');
    });
  });
});