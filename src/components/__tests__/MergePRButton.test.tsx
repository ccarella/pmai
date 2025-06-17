import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MergePRButton } from '../MergePRButton';
import { GitHubIssue } from '@/lib/types/github';

// Mock fetch
global.fetch = jest.fn();

describe('MergePRButton', () => {
  const mockIssue: GitHubIssue = {
    id: 1,
    number: 123,
    title: 'Test PR',
    state: 'open',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    closed_at: null,
    body: 'Test body',
    user: {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    labels: [],
    comments: 0,
    html_url: 'https://github.com/owner/repo/pull/123',
    pull_request: {
      url: 'https://api.github.com/repos/owner/repo/pulls/123',
      html_url: 'https://github.com/owner/repo/pull/123',
      diff_url: 'https://github.com/owner/repo/pull/123.diff',
      patch_url: 'https://github.com/owner/repo/pull/123.patch',
    },
  };

  const mockProps = {
    issue: mockIssue,
    repoOwner: 'owner',
    repoName: 'repo',
    onMergeSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should not render for non-pull request issues', () => {
    const issueWithoutPR = { ...mockIssue, pull_request: undefined };
    const { container } = render(
      <MergePRButton {...mockProps} issue={issueWithoutPR} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should check mergeability on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        mergeable: true,
        mergeable_state: 'clean',
        merge_state_reason: '',
      }),
    });

    render(<MergePRButton {...mockProps} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/pr/mergeability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          pull_number: 123,
        }),
      });
    });
  });

  it('should display merge button when PR is mergeable', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        mergeable: true,
        mergeable_state: 'clean',
        merge_state_reason: '',
      }),
    });

    render(<MergePRButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Merge PR')).toBeInTheDocument();
    });
  });

  it('should not display button when PR is not mergeable', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        mergeable: false,
        mergeable_state: 'dirty',
        merge_state_reason: 'Conflicts must be resolved',
      }),
    });

    render(<MergePRButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Merge PR')).not.toBeInTheDocument();
    });
  });

  it('should handle different mergeable states correctly', async () => {
    const states = [
      { state: 'unstable', expectedText: 'Merge PR (unstable)', disabled: false },
      { state: 'behind', expectedText: 'Update branch first', disabled: true },
      { state: 'blocked', expectedText: 'Blocked', disabled: true },
      { state: 'draft', expectedText: 'Draft PR', disabled: true },
    ];

    for (const { state, expectedText, disabled } of states) {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          mergeable: true,
          mergeable_state: state,
          merge_state_reason: '',
        }),
      });

      const { unmount } = render(<MergePRButton {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByText(expectedText);
        expect(button).toBeInTheDocument();
        if (disabled) {
          expect(button.closest('button')).toHaveAttribute('disabled');
        } else {
          expect(button.closest('button')).not.toHaveAttribute('disabled');
        }
      });

      unmount();
    }
  });

  it('should handle merge success', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          mergeable: true,
          mergeable_state: 'clean',
          merge_state_reason: '',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          merged: true,
          message: 'Pull Request successfully merged',
          sha: 'abc123',
        }),
      });

    render(<MergePRButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Merge PR')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Merge PR'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/pr/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          pull_number: 123,
          merge_method: 'merge',
        }),
      });
      expect(mockProps.onMergeSuccess).toHaveBeenCalled();
    });
  });

  it('should handle merge errors', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          mergeable: true,
          mergeable_state: 'clean',
          merge_state_reason: '',
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Merge validation failed',
        }),
      });

    render(<MergePRButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Merge PR')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Merge PR'));

    await waitFor(() => {
      expect(screen.getByText('Merge validation failed')).toBeInTheDocument();
    });
  });

  it('should show loading state while merging', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          mergeable: true,
          mergeable_state: 'clean',
          merge_state_reason: '',
        }),
      })
      .mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(<MergePRButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Merge PR')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Merge PR'));

    await waitFor(() => {
      expect(screen.getByText('Merging...')).toBeInTheDocument();
    });
  });

  it('should display merge state reason when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        mergeable: true,
        mergeable_state: 'blocked',
        merge_state_reason: 'Required status checks have not passed',
      }),
    });

    render(<MergePRButton {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Required status checks have not passed')).toBeInTheDocument();
    });
  });
});