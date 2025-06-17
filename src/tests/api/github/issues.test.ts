import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/github/issues/route';
import { getServerSession } from 'next-auth/next';
import { Octokit } from '@octokit/rest';
import { redis } from '@/lib/redis';

jest.mock('next-auth/next');
jest.mock('@octokit/rest');
jest.mock('@/lib/redis');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockOctokit = Octokit as jest.MockedClass<typeof Octokit>;
const mockRedis = redis as jest.Mocked<typeof redis>;

describe('/api/github/issues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/github/issues');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Not authenticated' });
    });

    it('should return 400 if no repository is selected', async () => {
      mockGetServerSession.mockResolvedValue({
        accessToken: 'test-token',
        user: { email: 'test@example.com' },
      } as ReturnType<typeof getServerSession>);
      mockRedis.get.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/github/issues');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'No repository selected' });
    });

    it('should fetch and return issues successfully', async () => {
      const mockIssues = [
        {
          id: 1,
          number: 1,
          title: 'Test Issue',
          state: 'open',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          closed_at: null,
          body: 'Test body',
          user: { login: 'testuser', avatar_url: 'https://example.com/avatar.jpg' },
          labels: [],
          comments: 0,
          html_url: 'https://github.com/test/repo/issues/1',
        },
      ];

      mockGetServerSession.mockResolvedValue({
        accessToken: 'test-token',
        user: { email: 'test@example.com' },
      } as ReturnType<typeof getServerSession>);

      mockRedis.get.mockResolvedValue({
        owner: 'testowner',
        name: 'testrepo',
      });

      const mockListForRepo = jest.fn().mockResolvedValue({
        data: mockIssues,
        headers: { link: '<https://api.github.com/repos/test/repo/issues?page=2>; rel="next"' },
      });

      mockOctokit.prototype.issues = {
        listForRepo: mockListForRepo,
      } as Partial<Octokit['issues']>;

      const req = new NextRequest('http://localhost:3000/api/github/issues?state=open&sort=created');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockListForRepo).toHaveBeenCalledWith({
        owner: 'testowner',
        repo: 'testrepo',
        state: 'open',
        labels: undefined,
        sort: 'created',
        direction: 'desc',
        page: 1,
        per_page: 20,
      });
      expect(data.issues).toHaveLength(1);
      expect(data.repository).toEqual({ owner: 'testowner', name: 'testrepo' });
    });

    it('should handle errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        accessToken: 'test-token',
        user: { email: 'test@example.com' },
      } as ReturnType<typeof getServerSession>);

      mockRedis.get.mockResolvedValue({
        owner: 'testowner',
        name: 'testrepo',
      });

      mockOctokit.prototype.issues = {
        listForRepo: jest.fn().mockRejectedValue(new Error('API Error')),
      } as Partial<Octokit['issues']>;

      const req = new NextRequest('http://localhost:3000/api/github/issues');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch issues' });
    });
  });

  describe('POST', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/github/issues', {
        method: 'POST',
        body: JSON.stringify({ issueNumber: 1 }),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Not authenticated' });
    });

    it('should return 400 if no issue number is provided', async () => {
      mockGetServerSession.mockResolvedValue({
        accessToken: 'test-token',
        user: { email: 'test@example.com' },
      } as ReturnType<typeof getServerSession>);

      const req = new NextRequest('http://localhost:3000/api/github/issues', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Issue number is required' });
    });

    it('should fetch issue details and comments successfully', async () => {
      const mockIssue = {
        id: 1,
        number: 1,
        title: 'Test Issue',
        state: 'open',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        closed_at: null,
        body: 'Test body',
        user: { login: 'testuser', avatar_url: 'https://example.com/avatar.jpg' },
        labels: [],
        comments: 1,
        html_url: 'https://github.com/test/repo/issues/1',
      };

      const mockComments = [
        {
          id: 1,
          body: 'Test comment',
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
          user: { login: 'commenter', avatar_url: 'https://example.com/avatar2.jpg' },
        },
      ];

      mockGetServerSession.mockResolvedValue({
        accessToken: 'test-token',
        user: { email: 'test@example.com' },
      } as ReturnType<typeof getServerSession>);

      mockRedis.get.mockResolvedValue({
        owner: 'testowner',
        name: 'testrepo',
      });

      const mockGet = jest.fn().mockResolvedValue({ data: mockIssue });
      const mockListComments = jest.fn().mockResolvedValue({ data: mockComments });

      mockOctokit.prototype.issues = {
        get: mockGet,
        listComments: mockListComments,
      } as Partial<Octokit['issues']>;

      const req = new NextRequest('http://localhost:3000/api/github/issues', {
        method: 'POST',
        body: JSON.stringify({ issueNumber: 1 }),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGet).toHaveBeenCalledWith({
        owner: 'testowner',
        repo: 'testrepo',
        issue_number: 1,
      });
      expect(mockListComments).toHaveBeenCalledWith({
        owner: 'testowner',
        repo: 'testrepo',
        issue_number: 1,
      });
      expect(data.issue).toBeDefined();
      expect(data.comments).toHaveLength(1);
    });
  });
});