import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/lib/redis');
jest.mock('@/lib/github/pr-status');

// Import after mocking
const { POST } = require('../route');
const { githubConnections } = require('@/lib/redis');
const prStatusModule = require('@/lib/github/pr-status');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockGithubConnections = githubConnections as jest.Mocked<typeof githubConnections>;
const mockFetchPRTestStatus = jest.spyOn(prStatusModule, 'fetchPRTestStatus');

describe('/api/github/pr-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/github/pr-status', {
      method: 'POST',
      body: JSON.stringify({ issueNumbers: [123] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Not authenticated' });
  });

  it('returns 400 when GitHub is not connected', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user123' },
    } as Awaited<ReturnType<typeof getServerSession>>);
    mockGithubConnections.get.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/github/pr-status', {
      method: 'POST',
      body: JSON.stringify({ issueNumbers: [123] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'GitHub not connected' });
  });

  it('returns 400 when issueNumbers is not provided', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user123' },
    } as Awaited<ReturnType<typeof getServerSession>>);
    mockGithubConnections.get.mockResolvedValue({
      accessToken: 'token123',
      selectedRepo: 'owner/repo',
    });

    const req = new NextRequest('http://localhost/api/github/pr-status', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Issue numbers array is required' });
  });

  it('returns 400 when no repository is selected', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user123' },
    } as Awaited<ReturnType<typeof getServerSession>>);
    mockGithubConnections.get.mockResolvedValue({
      accessToken: 'token123',
      selectedRepo: null,
    });

    const req = new NextRequest('http://localhost/api/github/pr-status', {
      method: 'POST',
      body: JSON.stringify({ issueNumbers: [123] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'No repository selected' });
  });

  it('successfully fetches PR statuses', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user123' },
    } as Awaited<ReturnType<typeof getServerSession>>);
    mockGithubConnections.get.mockResolvedValue({
      accessToken: 'token123',
      selectedRepo: 'owner/repo',
    });
    mockFetchPRTestStatus
      .mockResolvedValueOnce('success')
      .mockResolvedValueOnce('pending')
      .mockResolvedValueOnce('failure');

    const req = new NextRequest('http://localhost/api/github/pr-status', {
      method: 'POST',
      body: JSON.stringify({ issueNumbers: [123, 124, 125] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      statuses: {
        123: 'success',
        124: 'pending',
        125: 'failure',
      },
    });

    expect(mockFetchPRTestStatus).toHaveBeenCalledTimes(3);
    expect(mockFetchPRTestStatus).toHaveBeenCalledWith('owner', 'repo', 123, 'token123');
    expect(mockFetchPRTestStatus).toHaveBeenCalledWith('owner', 'repo', 124, 'token123');
    expect(mockFetchPRTestStatus).toHaveBeenCalledWith('owner', 'repo', 125, 'token123');
  });

  it('handles errors gracefully', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user123' },
    } as Awaited<ReturnType<typeof getServerSession>>);
    mockGithubConnections.get.mockRejectedValue(new Error('Database error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const req = new NextRequest('http://localhost/api/github/pr-status', {
      method: 'POST',
      body: JSON.stringify({ issueNumbers: [123] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch PR statuses' });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching PR statuses:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});