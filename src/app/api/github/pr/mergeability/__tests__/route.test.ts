import { NextRequest } from 'next/server';
import { POST } from '../route';
import { getServerSession } from 'next-auth';
import { Octokit } from '@octokit/rest';
import { githubConnections } from '@/lib/redis';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@octokit/rest');
jest.mock('@/lib/redis', () => ({
  githubConnections: {
    get: jest.fn(),
  },
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockOctokit = Octokit as jest.MockedClass<typeof Octokit>;

describe('POST /api/github/pr/mergeability', () => {
  let mockPullsGet: jest.Mock;
  let mockReposGetCombinedStatusForRef: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPullsGet = jest.fn();
    mockReposGetCombinedStatusForRef = jest.fn();
    
    mockOctokit.mockImplementation(() => ({
      pulls: { get: mockPullsGet },
      repos: { getCombinedStatusForRef: mockReposGetCombinedStatusForRef },
    } as unknown as Octokit));
  });

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/github/pr/mergeability', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return 400 if GitHub not connected', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } });
    githubConnections.get.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/github/pr/mergeability', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('GitHub not connected');
  });

  it('should return 400 if required parameters are missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } });
    githubConnections.get.mockResolvedValue({ accessToken: 'token123' });

    const request = new NextRequest('http://localhost/api/github/pr/mergeability', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        // missing repo and pull_number
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required parameters');
  });

  it('should return mergeable status for a clean PR', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } });
    githubConnections.get.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockResolvedValue({
      data: {
        mergeable: true,
        mergeable_state: 'clean',
        draft: false,
        head: { sha: 'abc123' },
      },
    });
    
    mockReposGetCombinedStatusForRef.mockResolvedValue({
      data: { state: 'success' },
    });

    const request = new NextRequest('http://localhost/api/github/pr/mergeability', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      mergeable: true,
      mergeable_state: 'clean',
      merge_state_reason: '',
      checks_state: 'success',
      draft: false,
    });
  });

  it('should handle draft PRs correctly', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } });
    githubConnections.get.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockResolvedValue({
      data: {
        mergeable: true,
        mergeable_state: 'draft',
        draft: true,
        head: { sha: 'abc123' },
      },
    });
    
    mockReposGetCombinedStatusForRef.mockResolvedValue({
      data: { state: 'success' },
    });

    const request = new NextRequest('http://localhost/api/github/pr/mergeability', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.merge_state_reason).toBe('This pull request is still a draft');
    expect(data.draft).toBe(true);
  });

  it('should handle non-mergeable PRs with conflicts', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } });
    githubConnections.get.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockResolvedValue({
      data: {
        mergeable: false,
        mergeable_state: 'dirty',
        draft: false,
        head: { sha: 'abc123' },
      },
    });
    
    mockReposGetCombinedStatusForRef.mockResolvedValue({
      data: { state: 'success' },
    });

    const request = new NextRequest('http://localhost/api/github/pr/mergeability', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mergeable).toBe(false);
    expect(data.merge_state_reason).toBe('This pull request has conflicts that must be resolved');
  });

  it('should retry when mergeable is null', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } });
    githubConnections.get.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet
      .mockResolvedValueOnce({
        data: {
          mergeable: null,
          mergeable_state: 'unknown',
          draft: false,
          head: { sha: 'abc123' },
        },
      })
      .mockResolvedValueOnce({
        data: {
          mergeable: true,
          mergeable_state: 'clean',
          draft: false,
          head: { sha: 'abc123' },
        },
      });
    
    mockReposGetCombinedStatusForRef.mockResolvedValue({
      data: { state: 'success' },
    });

    const request = new NextRequest('http://localhost/api/github/pr/mergeability', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockPullsGet).toHaveBeenCalledTimes(2);
    expect(data.mergeable).toBe(true);
  });

  it('should handle 404 errors', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } });
    githubConnections.get.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockRejectedValue({ status: 404 });

    const request = new NextRequest('http://localhost/api/github/pr/mergeability', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Pull request not found');
  });

  it('should handle 403 errors', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } });
    githubConnections.get.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockRejectedValue({ status: 403 });

    const request = new NextRequest('http://localhost/api/github/pr/mergeability', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Insufficient permissions');
  });
});