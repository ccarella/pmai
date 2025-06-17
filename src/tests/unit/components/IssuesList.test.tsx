import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IssuesList } from '@/components/IssuesList';

const mockIssues = [
  {
    id: 1,
    number: 1,
    title: 'Test Issue 1',
    state: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      login: 'user1',
      avatar_url: 'https://example.com/avatar1.jpg',
    },
    labels: [
      { id: 1, name: 'bug', color: 'ff0000' },
      { id: 2, name: 'urgent', color: '0000ff' },
    ],
    comments: 5,
  },
  {
    id: 2,
    number: 2,
    title: 'Test Issue 2',
    state: 'closed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      login: 'user2',
      avatar_url: 'https://example.com/avatar2.jpg',
    },
    labels: [],
    comments: 0,
    pull_request: true,
  },
];

describe('IssuesList', () => {
  const mockOnSelectIssue = jest.fn();

  beforeEach(() => {
    mockOnSelectIssue.mockClear();
  });

  it('should render empty state when no issues', () => {
    render(
      <IssuesList
        issues={[]}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    expect(screen.getByText('No issues found')).toBeInTheDocument();
  });

  it('should render list of issues', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    expect(screen.getByText('Test Issue 1')).toBeInTheDocument();
    expect(screen.getByText('Test Issue 2')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('should display issue state correctly', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    const openIcon = screen.getAllByRole('img', { hidden: true })[0];
    const closedIcon = screen.getAllByRole('img', { hidden: true })[1];

    expect(openIcon).toHaveClass('text-green-500');
    expect(closedIcon).toHaveClass('text-purple-500');
  });

  it('should display labels', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('should display comment count', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    expect(screen.getByText('5 comments')).toBeInTheDocument();
  });

  it('should indicate pull requests', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    const prIcons = screen.getAllByRole('img', { hidden: true });
    expect(prIcons).toHaveLength(3); // 2 state icons + 1 PR icon
  });

  it('should highlight selected issue', () => {
    const { rerender } = render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    const firstIssue = screen.getByText('Test Issue 1').closest('div[class*="Card"]');
    expect(firstIssue).not.toHaveClass('ring-2');

    rerender(
      <IssuesList
        issues={mockIssues}
        selectedIssue={mockIssues[0]}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    expect(firstIssue).toHaveClass('ring-2', 'ring-accent');
  });

  it('should call onSelectIssue when clicked', () => {
    render(
      <IssuesList
        issues={mockIssues}
        selectedIssue={null}
        onSelectIssue={mockOnSelectIssue}
      />
    );

    const firstIssue = screen.getByText('Test Issue 1').closest('div[class*="Card"]');
    fireEvent.click(firstIssue!);

    expect(mockOnSelectIssue).toHaveBeenCalledWith(mockIssues[0]);
  });
});