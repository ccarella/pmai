import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IssueDetail } from '../IssueDetail';
import { GitHubIssue } from '@/lib/types/github';

// Mock the GitHubMarkdown component
jest.mock('../ui/GitHubMarkdown', () => ({
  GitHubMarkdown: ({ content }: { content: string }) => <div data-testid="github-markdown">{content}</div>
}));

// Mock the Card component to pass through its props
jest.mock('../ui/Card', () => ({
  Card: ({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => <div className={className} {...props}>{children}</div>
}));

// Mock fetch
global.fetch = jest.fn();

const mockIssue: GitHubIssue = {
  id: 1,
  number: 123,
  title: 'Test Issue Title',
  body: '## Test Issue Body\n\nThis is a test issue with **markdown** content.',
  state: 'open',
  user: {
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg',
    html_url: 'https://github.com/testuser',
  },
  labels: [
    {
      id: 1,
      name: 'bug',
      color: 'd73a4a',
      description: 'Something isn\'t working',
    },
    {
      id: 2,
      name: 'enhancement',
      color: 'a2eeef',
      description: 'New feature or request',
    },
  ],
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date('2024-01-02').toISOString(),
  html_url: 'https://github.com/owner/repo/issues/123',
  comments: 2,
  assignees: [],
  assignee: null,
  milestone: null,
  locked: false,
  pull_request: undefined,
};

const mockComments = [
  {
    id: 1,
    body: 'This is the first comment',
    user: {
      login: 'commenter1',
      avatar_url: 'https://example.com/avatar1.jpg',
      html_url: 'https://github.com/commenter1',
    },
    created_at: new Date('2024-01-03').toISOString(),
    updated_at: new Date('2024-01-03').toISOString(),
    html_url: 'https://github.com/owner/repo/issues/123#issuecomment-1',
  },
  {
    id: 2,
    body: 'This is the second comment',
    user: {
      login: 'commenter2',
      avatar_url: 'https://example.com/avatar2.jpg',
      html_url: 'https://github.com/commenter2',
    },
    created_at: new Date('2024-01-04').toISOString(),
    updated_at: new Date('2024-01-04').toISOString(),
    html_url: 'https://github.com/owner/repo/issues/123#issuecomment-2',
  },
];

describe('IssueDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ comments: mockComments }),
    });
  });

  it('renders issue title and basic information', () => {
    render(<IssueDetail issue={mockIssue} />);

    expect(screen.getByRole('article', { name: 'Issue: Test Issue Title' })).toBeInTheDocument();
    expect(screen.getByText('Test Issue Title')).toBeInTheDocument();
    expect(screen.getByText('#123')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getAllByText('testuser')[0]).toBeInTheDocument();
  });

  it('renders issue labels with correct colors', () => {
    render(<IssueDetail issue={mockIssue} />);

    const bugLabel = screen.getByText('bug');
    expect(bugLabel).toBeInTheDocument();
    expect(bugLabel).toHaveStyle({ color: '#d73a4a' });

    const enhancementLabel = screen.getByText('enhancement');
    expect(enhancementLabel).toBeInTheDocument();
    expect(enhancementLabel).toHaveStyle({ color: '#a2eeef' });
  });

  it('renders issue body with markdown', () => {
    render(<IssueDetail issue={mockIssue} />);

    const markdown = screen.getByTestId('github-markdown');
    expect(markdown).toBeInTheDocument();
    expect(markdown.textContent).toContain('## Test Issue Body');
    expect(markdown.textContent).toContain('This is a test issue with **markdown** content.');
  });

  it('renders closed issue with correct styling', () => {
    const closedIssue = { ...mockIssue, state: 'closed' };
    render(<IssueDetail issue={closedIssue} />);

    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toHaveClass('bg-purple-500/20', 'text-purple-500');
  });

  it('renders issue without body', () => {
    const issueWithoutBody = { ...mockIssue, body: null };
    render(<IssueDetail issue={issueWithoutBody} />);

    expect(screen.getByText('No description provided')).toBeInTheDocument();
  });

  it('fetches and displays comments when issue has comments', async () => {
    await act(async () => {
      render(<IssueDetail issue={mockIssue} />);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issueNumber: 123 }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
      expect(screen.getByText('commenter1')).toBeInTheDocument();
      expect(screen.getByText('This is the first comment')).toBeInTheDocument();
      expect(screen.getByText('commenter2')).toBeInTheDocument();
      expect(screen.getByText('This is the second comment')).toBeInTheDocument();
    });
  });

  it('does not fetch comments when issue has no comments', () => {
    const issueWithoutComments = { ...mockIssue, comments: 0 };
    render(<IssueDetail issue={issueWithoutComments} />);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<IssueDetail issue={mockIssue} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Error loading comments: Network error')).toBeInTheDocument();
    });
  });

  it('renders with correct accessibility attributes', () => {
    render(<IssueDetail issue={mockIssue} />);

    const article = screen.getByRole('article', { name: 'Issue: Test Issue Title' });
    expect(article).toBeInTheDocument();
    
    const region = screen.getByRole('region', { name: 'Issue description' });
    expect(region).toBeInTheDocument();
  });

  it('renders with responsive classes', () => {
    render(<IssueDetail issue={mockIssue} />);

    const card = screen.getByRole('article', { name: 'Issue: Test Issue Title' });
    expect(card).toHaveClass('p-4', 'sm:p-6');
  });
});