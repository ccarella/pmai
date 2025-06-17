import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import IssuesPage from '@/app/issues/page';
import { GitHubIssue } from '@/lib/types/github';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

const mockIssuesResponse = {
  issues: [
    {
      id: 1,
      number: 1,
      title: 'First Issue',
      state: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: null,
      body: 'First issue body',
      user: { login: 'user1', avatar_url: 'https://example.com/avatar1.jpg' },
      labels: [],
      comments: 0,
      html_url: 'https://github.com/test/repo/issues/1',
    },
    {
      id: 2,
      number: 2,
      title: 'Second Issue',
      state: 'closed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      closed_at: new Date().toISOString(),
      body: 'Second issue body',
      user: { login: 'user2', avatar_url: 'https://example.com/avatar2.jpg' },
      labels: [{ id: 1, name: 'bug', color: 'ff0000' }],
      comments: 3,
      html_url: 'https://github.com/test/repo/issues/2',
    },
  ],
  repository: { owner: 'testowner', name: 'testrepo' },
  pagination: {},
};

describe('Issues Page Integration', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should show loading state initially', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    render(<IssuesPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show authentication required when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<IssuesPage />);

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Connect GitHub Account')).toBeInTheDocument();
  });

  it('should fetch and display issues when authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' }, accessToken: 'test-token' },
      status: 'authenticated',
      update: jest.fn(),
    });

    fetchMock.mockResponseOnce(JSON.stringify(mockIssuesResponse));

    render(<IssuesPage />);

    await waitFor(() => {
      expect(screen.getByText('GitHub Issues')).toBeInTheDocument();
      expect(screen.getByText('Repository: testowner/testrepo')).toBeInTheDocument();
    });

    expect(screen.getByText('First Issue')).toBeInTheDocument();
    expect(screen.getByText('Second Issue')).toBeInTheDocument();
  });

  it('should show error when no repository is selected', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' }, accessToken: 'test-token' },
      status: 'authenticated',
      update: jest.fn(),
    });

    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'No repository selected' }),
      { status: 400 }
    );

    render(<IssuesPage />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('No repository selected')).toBeInTheDocument();
      expect(screen.getByText('Select Repository')).toBeInTheDocument();
    });
  });

  it('should filter issues by state', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' }, accessToken: 'test-token' },
      status: 'authenticated',
      update: jest.fn(),
    });

    fetchMock.mockResponseOnce(JSON.stringify(mockIssuesResponse));

    render(<IssuesPage />);

    await waitFor(() => {
      expect(screen.getByText('First Issue')).toBeInTheDocument();
    });

    const filterSelect = screen.getByRole('combobox');
    
    fetchMock.mockResponseOnce(
      JSON.stringify({
        ...mockIssuesResponse,
        issues: [mockIssuesResponse.issues[1]], // Only closed issue
      })
    );

    fireEvent.change(filterSelect, { target: { value: 'closed' } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('state=closed'),
        expect.any(Object)
      );
    });
  });

  it('should display issue details when an issue is selected', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' }, accessToken: 'test-token' },
      status: 'authenticated',
      update: jest.fn(),
    });

    fetchMock.mockResponseOnce(JSON.stringify(mockIssuesResponse));

    render(<IssuesPage />);

    await waitFor(() => {
      expect(screen.getByText('First Issue')).toBeInTheDocument();
    });

    expect(screen.getByText('Select an issue from the list to view details')).toBeInTheDocument();

    const firstIssue = screen.getByText('First Issue').closest('div[class*="Card"]');
    fireEvent.click(firstIssue!);

    expect(screen.queryByText('Select an issue from the list to view details')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'First Issue' })).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' }, accessToken: 'test-token' },
      status: 'authenticated',
      update: jest.fn(),
    });

    fetchMock.mockRejectOnce(new Error('Network error'));

    render(<IssuesPage />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    fetchMock.mockResponseOnce(JSON.stringify(mockIssuesResponse));

    fireEvent.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText('First Issue')).toBeInTheDocument();
    });
  });
});