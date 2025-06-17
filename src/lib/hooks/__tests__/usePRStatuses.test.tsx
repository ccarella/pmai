import { renderHook, waitFor } from '@testing-library/react';
import { usePRStatuses } from '../usePRStatuses';
import { GitHubIssue } from '@/lib/types/github';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocking
fetchMock.enableMocks();

describe('usePRStatuses', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  const mockIssues: GitHubIssue[] = [
    {
      id: 1,
      number: 123,
      title: 'Test Issue with PR',
      state: 'open',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      closed_at: null,
      body: 'Test body',
      user: { login: 'test', avatar_url: '' },
      labels: [],
      comments: 0,
      html_url: 'https://github.com/test/repo/issues/123',
      pull_request: true,
    },
    {
      id: 2,
      number: 124,
      title: 'Test Issue without PR',
      state: 'open',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      closed_at: null,
      body: 'Test body',
      user: { login: 'test', avatar_url: '' },
      labels: [],
      comments: 0,
      html_url: 'https://github.com/test/repo/issues/124',
    },
  ];

  it('fetches statuses for issues with PRs', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        statuses: {
          123: 'success',
        },
      })
    );

    const { result } = renderHook(() => usePRStatuses(mockIssues));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statuses).toEqual({
      123: 'success',
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/github/pr-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ issueNumbers: [123] }),
    });
  });

  it('handles empty issues array', () => {
    const { result } = renderHook(() => usePRStatuses([]));

    expect(result.current.loading).toBe(false);
    expect(result.current.statuses).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    fetchMock.mockRejectOnce(new Error('API Error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => usePRStatuses(mockIssues));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statuses).toEqual({
      123: 'unknown',
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching PR statuses:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('only fetches statuses for issues with pull_request flag', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        statuses: {
          123: 'pending',
        },
      })
    );

    const { result } = renderHook(() => usePRStatuses(mockIssues));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only request status for issue 123, not 124
    expect(fetchMock).toHaveBeenCalledWith('/api/github/pr-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ issueNumbers: [123] }),
    });
  });

  it('handles non-ok response status', async () => {
    fetchMock.mockResponseOnce('', { status: 500 });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => usePRStatuses(mockIssues));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statuses).toEqual({
      123: 'unknown',
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching PR statuses:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});