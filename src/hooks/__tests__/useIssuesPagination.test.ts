import { renderHook, act, waitFor } from '@testing-library/react';
import { useIssuesPagination } from '../useIssuesPagination';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocks
fetchMock.enableMocks();

describe('useIssuesPagination', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  const mockIssuesResponse = (page: number, hasNext: boolean = true) => ({
    issues: Array(20).fill(null).map((_, i) => ({
      id: page * 20 + i,
      number: page * 20 + i,
      title: `Issue ${page * 20 + i}`,
      state: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: null,
      body: `Issue body ${page * 20 + i}`,
      user: {
        login: 'user',
        avatar_url: 'https://example.com/avatar.png',
      },
      labels: [],
      comments: 0,
      html_url: `https://github.com/owner/repo/issues/${page * 20 + i}`,
    })),
    pagination: {
      page,
      per_page: 20,
      next: hasNext ? page + 1 : undefined,
    },
    repository: {
      owner: 'owner',
      name: 'repo',
    },
  });

  it('should fetch initial issues on mount', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockIssuesResponse(1)));

    const { result } = renderHook(() => useIssuesPagination());

    expect(result.current.loading).toBe(true);
    expect(result.current.issues).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.issues).toHaveLength(20);
    expect(result.current.page).toBe(1);
    expect(result.current.hasMore).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/github/issues?state=open&sort=created&direction=desc&page=1&per_page=20')
    );
  });

  it('should fetch more issues when fetchMore is called', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(mockIssuesResponse(1)))
      .mockResponseOnce(JSON.stringify(mockIssuesResponse(2)));

    const { result } = renderHook(() => useIssuesPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.issues).toHaveLength(20);

    await act(async () => {
      await result.current.fetchMore();
    });

    await waitFor(() => {
      expect(result.current.isLoadingMore).toBe(false);
    });

    expect(result.current.issues).toHaveLength(40);
    expect(result.current.page).toBe(2);
  });

  it('should reset issues when filters change', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(mockIssuesResponse(1)))
      .mockResponseOnce(JSON.stringify(mockIssuesResponse(1)));

    const { result } = renderHook(() => useIssuesPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ state: 'closed' });
    });

    expect(result.current.issues).toEqual([]);
    expect(result.current.page).toBe(1);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('state=closed')
    );
  });

  it('should handle errors gracefully', async () => {
    fetchMock.mockRejectOnce(new Error('Network error'));

    const { result } = renderHook(() => useIssuesPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.issues).toEqual([]);
  });

  it('should refresh issues when refresh is called', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(mockIssuesResponse(1)))
      .mockResponseOnce(JSON.stringify(mockIssuesResponse(2)))
      .mockResponseOnce(JSON.stringify(mockIssuesResponse(1)));

    const { result } = renderHook(() => useIssuesPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Fetch more to get to page 2
    await act(async () => {
      await result.current.fetchMore();
    });

    expect(result.current.page).toBe(2);
    expect(result.current.issues).toHaveLength(40);

    // Refresh should reset to page 1
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.page).toBe(1);
    expect(result.current.issues).toHaveLength(20);
  });

  it('should not fetch more when already loading', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockIssuesResponse(1)));

    const { result } = renderHook(() => useIssuesPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock a slow response for the second page
    fetchMock.mockResponseOnce(
      () => new Promise(resolve => setTimeout(() => resolve(JSON.stringify(mockIssuesResponse(2))), 100))
    );

    // Try to fetch more multiple times quickly
    await act(async () => {
      // Start first fetchMore
      const promise1 = result.current.fetchMore();
      // Try to call fetchMore again while first is still loading
      const promise2 = result.current.fetchMore();
      const promise3 = result.current.fetchMore();
      
      // Wait for all to complete
      await Promise.all([promise1, promise2, promise3]);
    });

    // Should only have made 2 calls total (initial + one fetchMore)
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should handle no more pages correctly', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(mockIssuesResponse(1, false)));

    const { result } = renderHook(() => useIssuesPagination());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);

    // Try to fetch more
    await act(async () => {
      await result.current.fetchMore();
    });

    // Should not make another request
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should use custom initial values', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockIssuesResponse(1)));

    const { result } = renderHook(() => 
      useIssuesPagination({
        initialState: 'closed',
        initialSort: 'updated',
        initialDirection: 'asc',
        perPage: 50,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('state=closed&sort=updated&direction=asc&page=1&per_page=50')
    );
  });
});