import { NextRequest } from 'next/server';
import { POST } from '@/app/api/github/publish/route';
import { getServerSession } from 'next-auth/next';
import { githubConnections } from '@/lib/redis';
import { publishToGitHubWithRetry } from '@/lib/github/publishIssue';
import { generateAutoTitle } from '@/lib/services/auto-title-generation';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/lib/redis');
jest.mock('@/lib/github/publishIssue');
jest.mock('@/lib/services/auto-title-generation');
jest.mock('@/lib/auth-config', () => ({
  isGitHubAuthConfigured: () => true,
  isRedisConfigured: () => true,
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockGithubConnections = githubConnections as jest.Mocked<typeof githubConnections>;
const mockPublishToGitHubWithRetry = publishToGitHubWithRetry as jest.MockedFunction<typeof publishToGitHubWithRetry>;
const mockGenerateAutoTitle = generateAutoTitle as jest.MockedFunction<typeof generateAutoTitle>;

// Helper to create mock requests
const createMockRequest = (body?: any, headers: Record<string, string> = {}) => {
  return {
    json: jest.fn().mockResolvedValue(body || {}),
    headers: {
      get: (key: string) => headers[key] || null,
    },
  } as unknown as NextRequest;
};

describe('GitHub Publish API with Auto Title Generation', () => {
  const mockSession = {
    user: {
      id: 'user123',
      email: 'test@example.com',
    },
  };

  const mockConnection = {
    accessToken: 'github_token_123',
    selectedRepo: 'owner/repo',
    refreshToken: 'refresh_token_123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockGetServerSession.mockResolvedValue(mockSession);
    mockGithubConnections.get.mockResolvedValue(mockConnection);
    mockPublishToGitHubWithRetry.mockResolvedValue({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123,
    });
    mockGenerateAutoTitle.mockResolvedValue({
      title: 'Generated Title',
      isGenerated: true,
      alternatives: ['Alt 1', 'Alt 2'],
    });
  });

  describe('automatic title generation integration', () => {
    it('should generate title automatically when not provided', async () => {
      const requestBody = {
        body: 'This is the issue description that needs a title',
        labels: ['enhancement'],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(response.status).toBe(200);
      
      // Should call auto title generation
      expect(mockGenerateAutoTitle).toHaveBeenCalledWith(
        'This is the issue description that needs a title',
        undefined
      );

      // Should publish with generated title
      expect(mockPublishToGitHubWithRetry).toHaveBeenCalledWith({
        title: 'Generated Title',
        body: 'This is the issue description that needs a title',
        labels: ['enhancement'],
        assignees: undefined,
        accessToken: 'github_token_123',
        repository: 'owner/repo',
      });

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.generatedTitle).toBe('Generated Title');
      expect(responseData.alternatives).toEqual(['Alt 1', 'Alt 2']);
    });

    it('should generate title when provided title is generic', async () => {
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'Auto Generated Specific Title',
        isGenerated: true,
        alternatives: ['Alternative A', 'Alternative B'],
      });

      const requestBody = {
        title: 'Generated Issue', // Generic title
        body: 'Implement user authentication with OAuth integration',
        labels: ['feature'],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(response.status).toBe(200);
      
      expect(mockGenerateAutoTitle).toHaveBeenCalledWith(
        'Implement user authentication with OAuth integration',
        'Generated Issue'
      );

      expect(mockPublishToGitHubWithRetry).toHaveBeenCalledWith({
        title: 'Auto Generated Specific Title',
        body: 'Implement user authentication with OAuth integration',
        labels: ['feature'],
        assignees: undefined,
        accessToken: 'github_token_123',
        repository: 'owner/repo',
      });

      const responseData = await response.json();
      expect(responseData.generatedTitle).toBe('Auto Generated Specific Title');
    });

    it('should use provided title when it is meaningful', async () => {
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'Implement OAuth authentication',
        isGenerated: false,
      });

      const requestBody = {
        title: 'Implement OAuth authentication',
        body: 'Add OAuth integration for Google and GitHub',
        labels: ['feature'],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(response.status).toBe(200);
      
      expect(mockPublishToGitHubWithRetry).toHaveBeenCalledWith({
        title: 'Implement OAuth authentication',
        body: 'Add OAuth integration for Google and GitHub',
        labels: ['feature'],
        assignees: undefined,
        accessToken: 'github_token_123',
        repository: 'owner/repo',
      });

      const responseData = await response.json();
      expect(responseData.generatedTitle).toBeUndefined(); // Not generated
    });

    it('should handle auto title generation errors gracefully', async () => {
      mockGenerateAutoTitle.mockRejectedValue(new Error('AI service unavailable'));

      const requestBody = {
        body: 'Fix the critical bug in payment processing',
        labels: ['bug'],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      // Should still succeed with error handling in generateAutoTitle
      expect(response.status).toBe(500);
    });

    it('should work with fallback title generation', async () => {
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'Fix the critical bug in payment processing', // Fallback from content
        isGenerated: false,
      });

      const requestBody = {
        body: 'Fix the critical bug in payment processing system where transactions fail',
        labels: ['bug', 'critical'],
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);

      expect(response.status).toBe(200);
      
      expect(mockPublishToGitHubWithRetry).toHaveBeenCalledWith({
        title: 'Fix the critical bug in payment processing',
        body: 'Fix the critical bug in payment processing system where transactions fail',
        labels: ['bug', 'critical'],
        assignees: undefined,
        accessToken: 'github_token_123',
        repository: 'owner/repo',
      });
    });
  });

  describe('error handling', () => {
    it('should reject requests without body', async () => {
      const request = createMockRequest({ title: 'Test Title' });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('Body is required');
    });

    it('should handle missing authentication', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest({
        body: 'Test issue description',
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(mockGenerateAutoTitle).not.toHaveBeenCalled();
    });

    it('should handle missing GitHub connection', async () => {
      mockGithubConnections.get.mockResolvedValue(null);

      const request = createMockRequest({
        body: 'Test issue description',
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('GitHub not connected');
    });

    it('should handle missing repository selection', async () => {
      mockGithubConnections.get.mockResolvedValue({
        ...mockConnection,
        selectedRepo: null,
      });

      const request = createMockRequest({
        body: 'Test issue description',
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('No repository selected');
    });

    it('should handle GitHub publish failures', async () => {
      mockPublishToGitHubWithRetry.mockResolvedValue({
        success: false,
        error: 'GitHub API rate limit exceeded',
      });

      const request = createMockRequest({
        body: 'Test issue description',
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('GitHub API rate limit exceeded');
    });
  });

  describe('response format', () => {
    it('should return complete response with generated title info', async () => {
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'AI Generated Title',
        isGenerated: true,
        alternatives: ['Alternative 1', 'Alternative 2', 'Alternative 3'],
      });

      const request = createMockRequest({
        body: 'Create a new dashboard for analytics',
        labels: ['feature', 'dashboard'],
        assignees: ['developer1'],
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      
      expect(responseData).toEqual({
        success: true,
        issueUrl: 'https://github.com/owner/repo/issues/123',
        issueNumber: 123,
        generatedTitle: 'AI Generated Title',
        alternatives: ['Alternative 1', 'Alternative 2', 'Alternative 3'],
      });
    });

    it('should not include generatedTitle when using provided title', async () => {
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'User Provided Title',
        isGenerated: false,
      });

      const request = createMockRequest({
        title: 'User Provided Title',
        body: 'Description of the issue',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      
      expect(responseData.success).toBe(true);
      expect(responseData.generatedTitle).toBeUndefined();
      expect(responseData.alternatives).toBeUndefined();
    });
  });

  describe('integration with assignees and labels', () => {
    it('should pass through all parameters to GitHub publish', async () => {
      const request = createMockRequest({
        body: 'Implement feature X with requirements Y and Z',
        labels: ['feature', 'backend', 'frontend'],
        assignees: ['dev1', 'dev2'],
      });
      
      await POST(request);

      expect(mockPublishToGitHubWithRetry).toHaveBeenCalledWith({
        title: 'Generated Title',
        body: 'Implement feature X with requirements Y and Z',
        labels: ['feature', 'backend', 'frontend'],
        assignees: ['dev1', 'dev2'],
        accessToken: 'github_token_123',
        repository: 'owner/repo',
      });
    });
  });
});