import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IssueDetail } from '@/components/IssueDetail';
import { GitHubIssue, GitHubComment } from '@/lib/types/github';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const mockIssue: GitHubIssue = {
  id: 1,
  number: 1,
  title: 'Test Issue Title',
  state: 'open',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  closed_at: null,
  body: '# Test Issue Body\n\nThis is a test issue with **markdown** content.',
  user: {
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  labels: [
    { id: 1, name: 'bug', color: 'ff0000' },
    { id: 2, name: 'enhancement', color: '00ff00' },
  ],
  comments: 2,
  html_url: 'https://github.com/test/repo/issues/1',
};

const mockComments: GitHubComment[] = [
  {
    id: 1,
    body: 'First comment',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      login: 'commenter1',
      avatar_url: 'https://example.com/avatar1.jpg',
    },
  },
  {
    id: 2,
    body: 'Second comment with **bold** text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      login: 'commenter2',
      avatar_url: 'https://example.com/avatar2.jpg',
    },
  },
];

describe('IssueDetail', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should render issue details', () => {
    render(<IssueDetail issue={mockIssue} />);

    expect(screen.getByText('Test Issue Title')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('should render issue body with markdown', () => {
    render(<IssueDetail issue={mockIssue} />);

    expect(screen.getByText('Test Issue Body')).toBeInTheDocument();
    expect(screen.getByText('markdown')).toBeInTheDocument();
  });

  it('should render labels', () => {
    render(<IssueDetail issue={mockIssue} />);

    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('enhancement')).toBeInTheDocument();
  });

  it('should render GitHub link', () => {
    render(<IssueDetail issue={mockIssue} />);

    const githubLink = screen.getByText('GitHub').closest('a');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/test/repo/issues/1');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('should fetch and display comments when issue has comments', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        issue: mockIssue,
        comments: mockComments,
      })
    );

    render(<IssueDetail issue={mockIssue} />);

    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
    });

    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('commenter1')).toBeInTheDocument();
    expect(screen.getByText('Second comment with')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('commenter2')).toBeInTheDocument();
  });

  it('should not fetch comments when issue has no comments', () => {
    const issueWithoutComments = { ...mockIssue, comments: 0 };
    
    render(<IssueDetail issue={issueWithoutComments} />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Comments')).not.toBeInTheDocument();
  });

  it('should handle empty body', () => {
    const issueWithoutBody = { ...mockIssue, body: null };
    
    render(<IssueDetail issue={issueWithoutBody} />);

    expect(screen.getByText('No description provided')).toBeInTheDocument();
  });

  it('should handle closed issue state', () => {
    const closedIssue = {
      ...mockIssue,
      state: 'closed',
      closed_at: new Date().toISOString(),
    };
    
    render(<IssueDetail issue={closedIssue} />);

    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('should handle fetch error gracefully', async () => {
    fetchMock.mockRejectOnce(new Error('API Error'));

    render(<IssueDetail issue={mockIssue} />);

    await waitFor(() => {
      expect(screen.getByText('Error loading comments: API Error')).toBeInTheDocument();
    });
  });
});