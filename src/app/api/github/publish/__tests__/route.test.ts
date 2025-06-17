import { POST } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { githubConnections } from '@/lib/redis';
import { publishToGitHubWithRetry } from '@/lib/github/publishIssue';
import { isGitHubAuthConfigured, isRedisConfigured } from '@/lib/auth-config';
import { generateAutoTitle } from '@/lib/services/auto-title-generation';

jest.mock('next-auth/next');
jest.mock('@/lib/redis');
jest.mock('@/lib/github/publishIssue');
jest.mock('@/lib/auth-config');
jest.mock('@/lib/services/auto-title-generation');

describe('/api/github/publish', () => {
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

  const createRequest = (body: unknown) => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (isGitHubAuthConfigured as jest.Mock).mockReturnValue(true);
    (isRedisConfigured as jest.Mock).mockReturnValue(true);
    (generateAutoTitle as jest.Mock).mockResolvedValue({
      title: 'Generated Title',
      isGenerated: true,
      alternatives: ['Alt 1', 'Alt 2'],
    });
  });

  describe('POST', () => {
    it('should return 503 when GitHub auth is not configured', async () => {
      (isGitHubAuthConfigured as jest.Mock).mockReturnValue(false);

      const request = createRequest({ body: 'Issue body' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({ error: 'GitHub integration not configured' });
    });

    it('should return 503 when Redis is not configured', async () => {
      (isRedisConfigured as jest.Mock).mockReturnValue(false);

      const request = createRequest({ body: 'Issue body' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({ error: 'GitHub integration not configured' });
    });

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = createRequest({ body: 'Issue body' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 when body is missing', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const request = createRequest({ title: 'Title' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Body is required' });
    });

    it('should return 400 when GitHub is not connected', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue(null);

      const request = createRequest({ body: 'Issue body' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'GitHub not connected' });
    });

    it('should return 400 when no repository is selected', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue({
        ...mockConnection,
        selectedRepo: null,
      });

      const request = createRequest({ body: 'Issue body' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'No repository selected' });
    });

    it('should successfully publish an issue with auto-generated title', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue(mockConnection);
      (publishToGitHubWithRetry as jest.Mock).mockResolvedValue({
        success: true,
        issueUrl: 'https://github.com/owner/repo/issues/123',
        issueNumber: 123,
      });

      const request = createRequest({
        body: 'Issue body content',
        labels: ['bug', 'enhancement'],
        assignees: ['user1'],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        issueUrl: 'https://github.com/owner/repo/issues/123',
        issueNumber: 123,
        generatedTitle: 'Generated Title',
        alternatives: ['Alt 1', 'Alt 2'],
      });

      expect(generateAutoTitle).toHaveBeenCalledWith('Issue body content', undefined);
      expect(publishToGitHubWithRetry).toHaveBeenCalledWith({
        title: 'Generated Title',
        body: 'Issue body content',
        labels: ['bug', 'enhancement'],
        assignees: ['user1'],
        accessToken: 'test-access-token',
        repository: 'owner/repo',
      });
    });

    it('should use provided title when not generic', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue(mockConnection);
      (generateAutoTitle as jest.Mock).mockResolvedValue({
        title: 'Custom Title',
        isGenerated: false,
        alternatives: [],
      });
      (publishToGitHubWithRetry as jest.Mock).mockResolvedValue({
        success: true,
        issueUrl: 'https://github.com/owner/repo/issues/124',
        issueNumber: 124,
      });

      const request = createRequest({
        title: 'Custom Title',
        body: 'Issue body content',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        issueUrl: 'https://github.com/owner/repo/issues/124',
        issueNumber: 124,
        // generatedTitle is undefined when isGenerated is false
        alternatives: [],
      });

      expect(generateAutoTitle).toHaveBeenCalledWith('Issue body content', 'Custom Title');
    });

    it('should handle publish failure', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue(mockConnection);
      (publishToGitHubWithRetry as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded',
      });

      const request = createRequest({
        title: 'Test Issue',
        body: 'Issue body',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Rate limit exceeded' });
    });

    it('should handle errors during publishing', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue(mockConnection);
      (publishToGitHubWithRetry as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = createRequest({
        title: 'Test Issue',
        body: 'Issue body',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to publish issue' });
      expect(consoleSpy).toHaveBeenCalledWith('Error in publish API:', expect.any(Error));

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
      expect(data).toEqual({ error: 'Failed to publish issue' });

      consoleSpy.mockRestore();
    });
  });
});