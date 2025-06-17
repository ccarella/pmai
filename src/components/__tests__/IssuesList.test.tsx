import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IssuesList } from '../IssuesList';
import { GitHubIssue } from '@/lib/types/github';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    div: ({ children, layout, initial, animate, variants, ...props }: any) => {
      // Filter out framer-motion specific props
      const cleanProps = { ...props };
      delete cleanProps.whileHover;
      delete cleanProps.whileTap;
      delete cleanProps.transition;
      delete cleanProps.exit;
      return <div {...cleanProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock react-markdown
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

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
    },
  ];

  const mockOnSelectIssue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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
});