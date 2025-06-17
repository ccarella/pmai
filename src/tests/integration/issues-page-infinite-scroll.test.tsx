import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import IssuesPage from '@/app/issues/page';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

const generateMockIssues = (page: number, perPage: number = 20) => {
  const startId = (page - 1) * perPage + 1;
  return Array.from({ length: perPage }, (_, i) => ({
    id: startId + i,
    number: startId + i,
    title: `Issue ${startId + i}`,
    state: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    closed_at: null,
    body: `Issue body ${startId + i}`,
    user: { login: 'user', avatar_url: 'https://example.com/avatar.jpg' },
    labels: [],
    comments: 0,
    html_url: `https://github.com/test/repo/issues/${startId + i}`,
  }));
};

describe('Issues Page Infinite Scroll', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' }, accessToken: 'test-token' },
      status: 'authenticated',
      update: jest.fn(),
    });
  });

  it('should load more issues when scrolling to bottom', async () => {
    // First page response
    fetchMock.mockResponseOnce(JSON.stringify({
      issues: generateMockIssues(1),
      repository: { owner: 'testowner', name: 'testrepo' },
      pagination: { page: 1, per_page: 20, next: 2 },
    }));

    render(<IssuesPage />);

    await waitFor(() => {
      expect(screen.getByText('Issue 1')).toBeInTheDocument();
      expect(screen.getByText('Issue 20')).toBeInTheDocument();
    });

    // Second page response
    fetchMock.mockResponseOnce(JSON.stringify({
      issues: generateMockIssues(2),
      repository: { owner: 'testowner', name: 'testrepo' },
      pagination: { page: 2, per_page: 20, next: 3 },
    }));

    // Simulate scroll to bottom by finding the infinite scroll component
    const scrollableDiv = document.getElementById('scrollableDiv');
    expect(scrollableDiv).toBeInTheDocument();

    // The InfiniteScroll component will trigger fetchMore when it detects we're at the bottom
    // Since we mocked IntersectionObserver, we need to manually trigger the next fetch
    await act(async () => {
      const infiniteScrollNext = screen.getByText('Issue 20').parentElement?.parentElement?.parentElement;
      if (infiniteScrollNext) {
        // Simulate the InfiniteScroll component detecting we're at the bottom
        fireEvent.scroll(scrollableDiv!, { target: { scrollTop: 1000 } });
      }
    });

    // Wait for second page to load
    await waitFor(() => {
      expect(screen.getByText('Issue 21')).toBeInTheDocument();
      expect(screen.getByText('Issue 40')).toBeInTheDocument();
    });

    // Verify both pages are displayed
    expect(screen.getByText('Issue 1')).toBeInTheDocument();
    expect(screen.getByText('Issue 40')).toBeInTheDocument();
  });

  it('should show end message when no more issues', async () => {
    // First page response with no next page
    fetchMock.mockResponseOnce(JSON.stringify({
      issues: generateMockIssues(1, 5), // Only 5 issues
      repository: { owner: 'testowner', name: 'testrepo' },
      pagination: { page: 1, per_page: 20 }, // No next property
    }));

    render(<IssuesPage />);

    await waitFor(() => {
      expect(screen.getByText('Issue 1')).toBeInTheDocument();
      expect(screen.getByText('Issue 5')).toBeInTheDocument();
    });

    // Should show end message
    expect(screen.getByText('No more issues to load')).toBeInTheDocument();
  });

  it('should show loading spinner while fetching more', async () => {
    // First page response
    fetchMock.mockResponseOnce(JSON.stringify({
      issues: generateMockIssues(1),
      repository: { owner: 'testowner', name: 'testrepo' },
      pagination: { page: 1, per_page: 20, next: 2 },
    }));

    render(<IssuesPage />);

    await waitFor(() => {
      expect(screen.getByText('Issue 1')).toBeInTheDocument();
    });

    // Mock slow response for second page
    let resolveSecondPage: (value: Response) => void;
    const secondPagePromise = new Promise((resolve) => {
      resolveSecondPage = resolve;
    });

    fetchMock.mockImplementationOnce(() => secondPagePromise as Promise<Response>);

    // Trigger load more (this would normally happen via scroll)
    const scrollableDiv = document.getElementById('scrollableDiv');
    fireEvent.scroll(scrollableDiv!, { target: { scrollTop: 1000 } });

    // Should show loading spinner
    await waitFor(() => {
      const spinners = screen.getAllByRole('status');
      expect(spinners.length).toBeGreaterThan(0);
    });

    // Resolve the second page
    act(() => {
      resolveSecondPage!(new Response(JSON.stringify({
        issues: generateMockIssues(2),
        repository: { owner: 'testowner', name: 'testrepo' },
        pagination: { page: 2, per_page: 20, next: 3 },
      })));
    });

    // Wait for second page to load
    await waitFor(() => {
      expect(screen.getByText('Issue 21')).toBeInTheDocument();
    });
  });

  it('should reset pagination when changing sort order', async () => {
    // First page response
    fetchMock.mockResponseOnce(JSON.stringify({
      issues: generateMockIssues(1),
      repository: { owner: 'testowner', name: 'testrepo' },
      pagination: { page: 1, per_page: 20, next: 2 },
    }));

    render(<IssuesPage />);

    await waitFor(() => {
      expect(screen.getByText('Issue 1')).toBeInTheDocument();
    });

    // Second page response
    fetchMock.mockResponseOnce(JSON.stringify({
      issues: generateMockIssues(2),
      repository: { owner: 'testowner', name: 'testrepo' },
      pagination: { page: 2, per_page: 20, next: 3 },
    }));

    // Scroll to load more
    const scrollableDiv = document.getElementById('scrollableDiv');
    fireEvent.scroll(scrollableDiv!, { target: { scrollTop: 1000 } });

    await waitFor(() => {
      expect(screen.getByText('Issue 21')).toBeInTheDocument();
    });

    // Change sort order
    const sortSelect = screen.getByLabelText('Sort issues');
    
    // Mock response for oldest first
    fetchMock.mockResponseOnce(JSON.stringify({
      issues: generateMockIssues(1).reverse(), // Reversed order
      repository: { owner: 'testowner', name: 'testrepo' },
      pagination: { page: 1, per_page: 20, next: 2 },
    }));

    fireEvent.change(sortSelect, { target: { value: 'created-asc' } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining('sort=created&direction=asc'),
        expect.any(Object)
      );
    });

    // Should reset to showing only first page
    await waitFor(() => {
      const issueElements = screen.getAllByText(/^Issue \d+$/);
      expect(issueElements.length).toBeLessThanOrEqual(20);
    });
  });
});