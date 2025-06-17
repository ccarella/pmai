import { GET, POST } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { githubConnections } from '@/lib/redis';
import { Octokit } from 'octokit';
import { isGitHubAuthConfigured, isRedisConfigured } from '@/lib/auth-config';
import { withCacheHeaders, CACHE_CONFIGS } from '@/lib/utils/cache-headers';

jest.mock('next-auth/next');
jest.mock('@/lib/redis');
jest.mock('octokit');
jest.mock('@/lib/auth-config');
jest.mock('@/lib/utils/cache-headers');

describe('/api/github/repositories', () => {
  const mockSession = {
    user: {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  const mockConnection = {
    id: 'user123',
    userId: 'user123',
    accessToken: 'test-access-token',
    selectedRepo: 'owner/repo',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  const mockRepositories = [
    {
      id: 1,
      name: 'repo1',
      full_name: 'user/repo1',
      private: false,
      updated_at: '2024-01-01',
    },
    {
      id: 2,
      name: 'repo2',
      full_name: 'user/repo2',
      private: true,
      updated_at: '2024-01-02',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (isGitHubAuthConfigured as jest.Mock).mockReturnValue(true);
    (isRedisConfigured as jest.Mock).mockReturnValue(true);
    (withCacheHeaders as jest.Mock).mockImplementation((response) => response);
  });

  describe('GET', () => {
    it('should return 503 when GitHub auth is not configured', async () => {
      (isGitHubAuthConfigured as jest.Mock).mockReturnValue(false);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({ error: 'GitHub integration not configured' });
    });

    it('should return 503 when Redis is not configured', async () => {
      (isRedisConfigured as jest.Mock).mockReturnValue(false);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({ error: 'GitHub integration not configured' });
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when GitHub is not connected', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'GitHub not connected' });
    });

    it('should successfully fetch repositories', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue(mockConnection);

      const mockOctokit = {
        rest: {
          repos: {
            listForAuthenticatedUser: jest.fn().mockResolvedValue({
              data: mockRepositories,
            }),
          },
        },
      };
      (Octokit as jest.Mock).mockImplementation(() => mockOctokit);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        repositories: mockRepositories,
        selectedRepo: 'owner/repo',
      });

      expect(mockOctokit.rest.repos.listForAuthenticatedUser).toHaveBeenCalledWith({
        sort: 'updated',
        per_page: 100,
        visibility: 'all',
        affiliation: 'owner,collaborator,organization_member',
      });

      expect(withCacheHeaders).toHaveBeenCalledWith(
        expect.any(NextResponse),
        CACHE_CONFIGS.PRIVATE
      );
    });

    it('should handle null selectedRepo', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue({
        ...mockConnection,
        selectedRepo: null,
      });

      const mockOctokit = {
        rest: {
          repos: {
            listForAuthenticatedUser: jest.fn().mockResolvedValue({
              data: mockRepositories,
            }),
          },
        },
      };
      (Octokit as jest.Mock).mockImplementation(() => mockOctokit);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.selectedRepo).toBeNull();
    });

    it('should handle Octokit errors', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue(mockConnection);

      const mockOctokit = {
        rest: {
          repos: {
            listForAuthenticatedUser: jest.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      };
      (Octokit as jest.Mock).mockImplementation(() => mockOctokit);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch repositories' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching repositories:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('POST', () => {
    const createRequest = (body: unknown) => {
      return {
        json: async () => body,
      } as NextRequest;
    };

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = createRequest({ selectedRepo: 'owner/repo' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when selectedRepo is missing', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const request = createRequest({ selectedRepo: null });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Repository required' });
    });

    it('should successfully save selected repository', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.updateSelectedRepo as jest.Mock).mockResolvedValue(undefined);

      const request = createRequest({ selectedRepo: 'owner/new-repo' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(githubConnections.updateSelectedRepo).toHaveBeenCalledWith(
        'user123',
        'owner/new-repo'
      );
    });

    it('should handle errors when saving repository', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.updateSelectedRepo as jest.Mock).mockRejectedValue(
        new Error('Redis Error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = createRequest({ selectedRepo: 'owner/repo' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to save repository' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving repository:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in request', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const request = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as NextRequest;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to save repository' });

      consoleSpy.mockRestore();
    });
  });
});