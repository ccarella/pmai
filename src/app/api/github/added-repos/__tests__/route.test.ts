import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import { githubConnections } from '@/lib/redis';
import { Octokit } from 'octokit';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/redis');
jest.mock('octokit');

describe('/api/github/added-repos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when no GitHub connection found', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' },
      });
      (githubConnections.get as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No GitHub connection found');
    });

    it('should return empty array when no repositories are added', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' },
      });
      (githubConnections.get as jest.Mock).mockResolvedValue({
        id: 'conn123',
        userId: 'user123',
        accessToken: 'token123',
        selectedRepo: 'owner/repo',
        addedRepos: [],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        repositories: [],
        selectedRepo: 'owner/repo',
      });
    });

    it('should fetch and return repository details for added repos', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' },
      });
      (githubConnections.get as jest.Mock).mockResolvedValue({
        id: 'conn123',
        userId: 'user123',
        accessToken: 'token123',
        selectedRepo: 'owner/repo1',
        addedRepos: ['owner/repo1', 'owner/repo2'],
      });

      const mockOctokit = {
        repos: {
          get: jest.fn()
            .mockResolvedValueOnce({
              data: {
                id: 1,
                name: 'repo1',
                full_name: 'owner/repo1',
                private: false,
                description: 'First repo',
                updated_at: '2023-01-01',
                html_url: 'https://github.com/owner/repo1',
              },
            })
            .mockResolvedValueOnce({
              data: {
                id: 2,
                name: 'repo2',
                full_name: 'owner/repo2',
                private: true,
                description: 'Second repo',
                updated_at: '2023-01-02',
                html_url: 'https://github.com/owner/repo2',
              },
            }),
        },
      };
      (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit as unknown as InstanceType<typeof Octokit>);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.repositories).toHaveLength(2);
      expect(data.repositories[0]).toEqual({
        id: 1,
        name: 'repo1',
        full_name: 'owner/repo1',
        private: false,
        description: 'First repo',
        updated_at: '2023-01-01',
        html_url: 'https://github.com/owner/repo1',
      });
      expect(data.selectedRepo).toBe('owner/repo1');
    });

    it('should skip repositories that cannot be fetched', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' },
      });
      (githubConnections.get as jest.Mock).mockResolvedValue({
        id: 'conn123',
        userId: 'user123',
        accessToken: 'token123',
        addedRepos: ['owner/repo1', 'owner/deleted-repo'],
      });

      const mockOctokit = {
        repos: {
          get: jest.fn()
            .mockResolvedValueOnce({
              data: {
                id: 1,
                name: 'repo1',
                full_name: 'owner/repo1',
                private: false,
                description: 'First repo',
                updated_at: '2023-01-01',
                html_url: 'https://github.com/owner/repo1',
              },
            })
            .mockRejectedValueOnce(new Error('Not found')),
        },
      };
      (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit as unknown as InstanceType<typeof Octokit>);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.repositories).toHaveLength(1);
      expect(data.repositories[0].name).toBe('repo1');
    });
  });

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/github/added-repos', {
        method: 'POST',
        body: JSON.stringify({ action: 'add', repoFullName: 'owner/repo' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when required fields are missing', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' },
      });

      const request = new NextRequest('http://localhost:3000/api/github/added-repos', {
        method: 'POST',
        body: JSON.stringify({ action: 'add' }), // Missing repoFullName
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 400 for invalid action', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' },
      });

      const request = new NextRequest('http://localhost:3000/api/github/added-repos', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalid', repoFullName: 'owner/repo' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action');
    });

    it('should add repository successfully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' },
      });
      (githubConnections.addRepository as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/github/added-repos', {
        method: 'POST',
        body: JSON.stringify({ action: 'add', repoFullName: 'owner/repo' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(githubConnections.addRepository).toHaveBeenCalledWith('user123', 'owner/repo');
    });

    it('should remove repository successfully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' },
      });
      (githubConnections.removeRepository as jest.Mock).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/github/added-repos', {
        method: 'POST',
        body: JSON.stringify({ action: 'remove', repoFullName: 'owner/repo' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(githubConnections.removeRepository).toHaveBeenCalledWith('user123', 'owner/repo');
    });

    it('should handle errors gracefully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' },
      });
      (githubConnections.addRepository as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/github/added-repos', {
        method: 'POST',
        body: JSON.stringify({ action: 'add', repoFullName: 'owner/repo' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});