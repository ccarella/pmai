import { NextRequest } from 'next/server';
import { POST } from '../route';
import { getServerSession } from 'next-auth';
import { Octokit } from '@octokit/rest';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@octokit/rest');

const mockGetServerSession = getServerSession as jest.Mock;
const mockOctokit = Octokit as jest.MockedClass<typeof Octokit>;

describe('POST /api/github/pr/merge', () => {
  let mockPullsGet: jest.Mock;
  let mockPullsMerge: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPullsGet = jest.fn();
    mockPullsMerge = jest.fn();
    
    mockOctokit.mockImplementation(() => ({
      pulls: { 
        get: mockPullsGet,
        merge: mockPullsMerge
      },
    } as unknown as Octokit));
  });

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/github/pr/merge', {
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

  it('should return 400 if required parameters are missing', async () => {
    mockGetServerSession.mockResolvedValue({ accessToken: 'token123' });

    const request = new NextRequest('http://localhost/api/github/pr/merge', {
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

  it('should return 400 for invalid merge method', async () => {
    mockGetServerSession.mockResolvedValue({ accessToken: 'token123' });

    const request = new NextRequest('http://localhost/api/github/pr/merge', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
        merge_method: 'invalid',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid merge method. Must be "merge", "squash", or "rebase"');
  });

  it('should successfully merge a PR', async () => {
    mockGetServerSession.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockResolvedValue({
      data: {
        mergeable: true,
        draft: false,
      },
    });
    
    mockPullsMerge.mockResolvedValue({
      data: {
        sha: 'abc123',
        merged: true,
        message: 'Pull Request successfully merged',
      },
    });

    const request = new NextRequest('http://localhost/api/github/pr/merge', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
        merge_method: 'merge',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      merged: true,
      message: 'Pull Request successfully merged',
      sha: 'abc123',
    });
    expect(mockPullsMerge).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 123,
      merge_method: 'merge',
    });
  });

  it('should handle different merge methods', async () => {
    mockGetServerSession.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockResolvedValue({
      data: {
        mergeable: true,
        draft: false,
      },
    });
    
    mockPullsMerge.mockResolvedValue({
      data: {
        sha: 'abc123',
        merged: true,
        message: 'Pull Request successfully merged',
      },
    });

    const mergeMethods = ['merge', 'squash', 'rebase'];
    
    for (const method of mergeMethods) {
      const request = new NextRequest('http://localhost/api/github/pr/merge', {
        method: 'POST',
        body: JSON.stringify({
          owner: 'owner',
          repo: 'repo',
          pull_number: 123,
          merge_method: method,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(mockPullsMerge).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
        merge_method: method,
      });
    }
  });

  it('should return 422 if PR is not mergeable', async () => {
    mockGetServerSession.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockResolvedValue({
      data: {
        mergeable: false,
        draft: false,
      },
    });

    const request = new NextRequest('http://localhost/api/github/pr/merge', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Pull request is not mergeable');
    expect(mockPullsMerge).not.toHaveBeenCalled();
  });

  it('should return 422 if PR is a draft', async () => {
    mockGetServerSession.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockResolvedValue({
      data: {
        mergeable: true,
        draft: true,
      },
    });

    const request = new NextRequest('http://localhost/api/github/pr/merge', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Cannot merge a draft pull request');
    expect(mockPullsMerge).not.toHaveBeenCalled();
  });

  it('should handle merge conflict errors', async () => {
    mockGetServerSession.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockResolvedValue({
      data: {
        mergeable: true,
        draft: false,
      },
    });
    
    mockPullsMerge.mockRejectedValue({ status: 409 });

    const request = new NextRequest('http://localhost/api/github/pr/merge', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Head branch was modified. Review and try again.');
  });

  it('should handle PR not found errors', async () => {
    mockGetServerSession.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockRejectedValue({ status: 404 });

    const request = new NextRequest('http://localhost/api/github/pr/merge', {
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

  it('should handle insufficient permissions errors', async () => {
    mockGetServerSession.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockResolvedValue({
      data: {
        mergeable: true,
        draft: false,
      },
    });
    
    mockPullsMerge.mockRejectedValue({ status: 403 });

    const request = new NextRequest('http://localhost/api/github/pr/merge', {
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
    expect(data.error).toBe('Insufficient permissions to merge');
  });

  it('should handle validation errors with custom message', async () => {
    mockGetServerSession.mockResolvedValue({ accessToken: 'token123' });
    
    mockPullsGet.mockResolvedValue({
      data: {
        mergeable: true,
        draft: false,
      },
    });
    
    mockPullsMerge.mockRejectedValue({ 
      status: 422,
      response: {
        data: {
          message: 'Required status checks have not passed'
        }
      }
    });

    const request = new NextRequest('http://localhost/api/github/pr/merge', {
      method: 'POST',
      body: JSON.stringify({
        owner: 'owner',
        repo: 'repo',
        pull_number: 123,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error).toBe('Required status checks have not passed');
  });
});