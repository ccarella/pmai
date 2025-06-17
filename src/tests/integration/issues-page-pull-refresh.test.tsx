import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SessionProvider, Session } from 'next-auth/react';
import '@testing-library/jest-dom';
import IssuesPage from '@/app/issues/page';
import { useSession } from 'next-auth/react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/hooks/useRepositoryChange', () => ({
  useRepositoryChange: jest.fn(),
}));
jest.mock('@/hooks/usePullToRefresh');
jest.mock('@/components/IssuesList', () => ({
  IssuesList: ({ issues }: { issues: Array<{ id: number; title: string }> }) => (
    <div>
      Issues List: {issues.length} items
      {issues.map((issue: { id: number; title: string }) => (
        <div key={issue.id}>{issue.title}</div>
      ))}
    </div>
  ),
}));
jest.mock('@/components/IssueDetail', () => ({
  IssueDetail: ({ issue }: { issue: { title: string } }) => <div>Issue Detail: {issue.title}</div>,
}));
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div>Loading...</div>,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('IssuesPage - Pull to Refresh', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
  const mockUsePullToRefresh = usePullToRefresh as jest.MockedFunction<typeof usePullToRefresh>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for usePullToRefresh
    mockUsePullToRefresh.mockReturnValue({
      containerRef: { current: null },
      isRefreshing: false,
      pullDistance: 0,
      isPulling: false,
    });
  });

  it('should render with pull-to-refresh component', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', name: 'Test User' }, expires: '' } as Session,
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        issues: [
          { id: 1, title: 'Issue 1', state: 'open' },
          { id: 2, title: 'Issue 2', state: 'open' },
        ],
        repository: { owner: 'test', name: 'repo' },
      }),
    });

    render(
      <SessionProvider session={null}>
        <IssuesPage />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('GitHub Issues')).toBeInTheDocument();
    });

    // Verify pull-to-refresh hook was called
    expect(mockUsePullToRefresh).toHaveBeenCalledWith({
      onRefresh: expect.any(Function),
      threshold: 80,
      refreshTimeout: 1000,
    });
  });

  it('should handle pull-to-refresh action', async () => {
      let capturedOnRefresh: () => Promise<void>;

    mockUsePullToRefresh.mockImplementation(({ onRefresh }) => {
      capturedOnRefresh = onRefresh;
      return {
        containerRef: { current: null } as React.RefObject<HTMLDivElement>,
        isRefreshing: false,
        pullDistance: 0,
        isPulling: false,
      };
    });

    mockUseSession.mockReturnValue({
      data: { user: { id: '1', name: 'Test User' }, expires: '' } as Session,
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [{ id: 1, title: 'Initial Issue', state: 'open' }],
          repository: { owner: 'test', name: 'repo' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [
            { id: 1, title: 'Initial Issue', state: 'open' },
            { id: 2, title: 'New Issue', state: 'open' },
          ],
          repository: { owner: 'test', name: 'repo' },
        }),
      });

    render(
      <SessionProvider session={null}>
        <IssuesPage />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Issues List: 1 items')).toBeInTheDocument();
    });

    // Simulate pull-to-refresh
    await act(async () => {
      await capturedOnRefresh();
    });

    // Verify API was called again
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/github/issues?state=open&sort=created&direction=desc'
    );
  });

  it('should show refreshing state', async () => {
    mockUsePullToRefresh.mockReturnValue({
      containerRef: { current: null },
      isRefreshing: true,
      pullDistance: 80,
      isPulling: false,
    });

    mockUseSession.mockReturnValue({
      data: { user: { id: '1', name: 'Test User' }, expires: '' } as Session,
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        issues: [],
        repository: { owner: 'test', name: 'repo' },
      }),
    });

    const { container } = render(
      <SessionProvider session={null}>
        <IssuesPage />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('GitHub Issues')).toBeInTheDocument();
    });

    // Check that PullToRefresh component receives the correct props
    const pullToRefreshElement = container.querySelector('[class*="relative"]');
    expect(pullToRefreshElement).toBeInTheDocument();
  });

  it('should show pulling state', async () => {
    mockUsePullToRefresh.mockReturnValue({
      containerRef: { current: null },
      isRefreshing: false,
      pullDistance: 40,
      isPulling: true,
    });

    mockUseSession.mockReturnValue({
      data: { user: { id: '1', name: 'Test User' }, expires: '' } as Session,
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        issues: [],
        repository: { owner: 'test', name: 'repo' },
      }),
    });

    render(
      <SessionProvider session={null}>
        <IssuesPage />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('GitHub Issues')).toBeInTheDocument();
    });

    // Verify container has correct class
    const container = screen.getByText('GitHub Issues').closest('.overflow-y-auto');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('min-h-screen');
  });

  it('should handle refresh errors', async () => {
    let capturedOnRefresh: () => Promise<void>;

    mockUsePullToRefresh.mockImplementation(({ onRefresh }) => {
      capturedOnRefresh = onRefresh;
      return {
        containerRef: { current: null } as React.RefObject<HTMLDivElement>,
        isRefreshing: false,
        pullDistance: 0,
        isPulling: false,
      };
    });

    mockUseSession.mockReturnValue({
      data: { user: { id: '1', name: 'Test User' }, expires: '' } as Session,
      status: 'authenticated',
      update: jest.fn(),
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issues: [],
          repository: { owner: 'test', name: 'repo' },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to refresh' }),
      });

    render(
      <SessionProvider session={null}>
        <IssuesPage />
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('GitHub Issues')).toBeInTheDocument();
    });

    // Simulate pull-to-refresh with error
    await act(async () => {
      await capturedOnRefresh();
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to refresh')).toBeInTheDocument();
    });
  });
});