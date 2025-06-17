import { GET } from '../route';
import { getServerSession } from 'next-auth/next';
import { githubConnections } from '@/lib/redis';
import { isGitHubAuthConfigured, isRedisConfigured } from '@/lib/auth-config';

jest.mock('next-auth/next');
jest.mock('@/lib/redis');
jest.mock('@/lib/auth-config');

describe('/api/github/selected-repo', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    (isGitHubAuthConfigured as jest.Mock).mockReturnValue(true);
    (isRedisConfigured as jest.Mock).mockReturnValue(true);
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

    it('should return selected repository when connected', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue(mockConnection);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        selectedRepo: 'owner/repo',
      });
      expect(githubConnections.get).toHaveBeenCalledWith('user123');
    });

    it('should return null when no repository is selected', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue({
        ...mockConnection,
        selectedRepo: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        selectedRepo: null,
      });
    });

    it('should return null when GitHub is not connected', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        selectedRepo: null,
      });
    });

    it('should handle errors gracefully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (githubConnections.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch selected repository' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching selected repo:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle session with missing user ID', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });
});