import { JobProcessor } from '../job-processor';
import { jobQueue } from '../job-queue';
import { generateAutoTitle } from '../auto-title-generation';
import { publishToGitHubWithRetry } from '@/lib/github/publishIssue';
import { githubConnections } from '@/lib/redis';
import { userStorageService } from '../user-storage';
import { OpenAI } from 'openai';

// Mock dependencies
jest.mock('../job-queue');
jest.mock('../auto-title-generation');
jest.mock('@/lib/github/publishIssue');
jest.mock('@/lib/redis');
jest.mock('../user-storage', () => ({
  userStorageService: {
    getOpenAIKey: jest.fn(),
    updateUsageStats: jest.fn(),
  }
}));
jest.mock('openai', () => ({
  OpenAI: jest.fn(),
}));

describe('JobProcessor', () => {
  let processor: JobProcessor;
  const mockJobQueue = jobQueue as jest.Mocked<typeof jobQueue>;
  const mockGenerateAutoTitle = generateAutoTitle as jest.MockedFunction<typeof generateAutoTitle>;
  const mockPublishToGitHub = publishToGitHubWithRetry as jest.MockedFunction<typeof publishToGitHubWithRetry>;
  const mockGithubConnections = githubConnections as jest.Mocked<typeof githubConnections>;
  const mockUserStorage = userStorageService as jest.Mocked<typeof userStorageService>;

  beforeEach(() => {
    processor = new JobProcessor();
    jest.clearAllMocks();

    // Setup default OpenAI mock
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            markdown: '# Test Issue\n\nThis is a test issue.',
            summary: { type: 'feature', priority: 'high', complexity: 'medium' }
          })
        }
      }]
    });

    (OpenAI as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }));
  });

  describe('processCreateAndPublishIssue', () => {
    const jobId = 'test-job-id';
    const userId = 'user-123';
    const payload = {
      title: 'Test Issue',
      prompt: 'Create a test issue',
      repository: 'owner/repo',
    };

    it('should successfully process a job', async () => {
      // Setup mocks
      mockUserStorage.getOpenAIKey.mockResolvedValue('test-api-key');
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'Generated Title',
        isGenerated: true,
        alternatives: ['Alt 1', 'Alt 2'],
      });
      mockGithubConnections.get.mockResolvedValue({
        id: 'connection-id',
        userId,
        accessToken: 'github-token',
        selectedRepo: 'owner/repo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockPublishToGitHub.mockResolvedValue({
        success: true,
        issueUrl: 'https://github.com/owner/repo/issues/123',
        issueNumber: 123,
      });

      await processor.processCreateAndPublishIssue(jobId, userId, payload);

      // Verify job status was updated to processing
      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(jobId, 'processing');

      // Verify OpenAI was called
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });

      // Verify title generation
      expect(mockGenerateAutoTitle).toHaveBeenCalledWith(
        expect.stringContaining('Test Issue'),
        'Test Issue'
      );

      // Verify GitHub publishing
      expect(mockPublishToGitHub).toHaveBeenCalledWith({
        title: 'Generated Title',
        body: expect.stringContaining('Test Issue'),
        labels: ['feature'],
        accessToken: 'github-token',
        repository: 'owner/repo',
      });

      // Verify usage tracking
      expect(mockUserStorage.updateUsageStats).toHaveBeenCalledWith(userId, 'create-issue');

      // Verify job completion
      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        jobId,
        'completed',
        {
          issueUrl: 'https://github.com/owner/repo/issues/123',
          issueNumber: 123,
          repository: 'owner/repo',
          title: 'Generated Title',
        }
      );
    });

    it('should fail when OpenAI key is missing', async () => {
      mockUserStorage.getOpenAIKey.mockResolvedValue(null);
      mockJobQueue.getJob.mockResolvedValue({
        id: jobId,
        userId,
        type: 'create-and-publish-issue',
        status: 'processing',
        payload,
        retryCount: 3,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await processor.processCreateAndPublishIssue(jobId, userId, payload);

      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        jobId,
        'failed',
        undefined,
        'OpenAI API key not found'
      );
    });

    it('should fail when GitHub is not connected', async () => {
      mockUserStorage.getOpenAIKey.mockResolvedValue('test-api-key');
      mockGithubConnections.get.mockResolvedValue(null);
      mockJobQueue.getJob.mockResolvedValue({
        id: jobId,
        userId,
        type: 'create-and-publish-issue',
        status: 'processing',
        payload,
        retryCount: 3,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await processor.processCreateAndPublishIssue(jobId, userId, payload);

      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        jobId,
        'failed',
        undefined,
        'GitHub not connected'
      );
    });

    it('should retry on transient failures', async () => {
      mockUserStorage.getOpenAIKey.mockResolvedValue('test-api-key');
      mockGithubConnections.get.mockResolvedValue({
        id: 'connection-id',
        userId,
        accessToken: 'github-token',
        selectedRepo: 'owner/repo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockPublishToGitHub.mockRejectedValue(new Error('Network error'));
      mockJobQueue.getJob.mockResolvedValue({
        id: jobId,
        userId,
        type: 'create-and-publish-issue',
        status: 'processing',
        payload,
        retryCount: 1,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await processor.processCreateAndPublishIssue(jobId, userId, payload);

      expect(mockJobQueue.retryJob).toHaveBeenCalledWith(jobId);
      expect(mockJobQueue.updateJobStatus).not.toHaveBeenCalledWith(
        jobId,
        'failed',
        expect.anything(),
        expect.anything()
      );
    });

    it('should handle OpenAI API errors', async () => {
      mockUserStorage.getOpenAIKey.mockResolvedValue('test-api-key');
      
      const mockCreate = jest.fn().mockRejectedValue(new Error('OpenAI API error'));
      (OpenAI as jest.Mock).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      mockJobQueue.getJob.mockResolvedValue({
        id: jobId,
        userId,
        type: 'create-and-publish-issue',
        status: 'processing',
        payload,
        retryCount: 1,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await processor.processCreateAndPublishIssue(jobId, userId, payload);

      expect(mockJobQueue.retryJob).toHaveBeenCalledWith(jobId);
    });
  });

  describe('processNextJob', () => {
    it('should process a pending job', async () => {
      const job = {
        id: 'test-job-id',
        userId: 'user-123',
        type: 'create-and-publish-issue' as const,
        status: 'pending' as const,
        payload: {
          title: 'Test',
          prompt: 'Test prompt',
          repository: 'owner/repo',
        },
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockJobQueue.getNextPendingJob.mockResolvedValue(job);
      mockUserStorage.getOpenAIKey.mockResolvedValue('test-api-key');
      mockGithubConnections.get.mockResolvedValue({
        id: 'connection-id',
        userId: 'user-123',
        accessToken: 'github-token',
        selectedRepo: 'owner/repo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockPublishToGitHub.mockResolvedValue({
        success: true,
        issueUrl: 'https://github.com/owner/repo/issues/123',
        issueNumber: 123,
      });

      const result = await processor.processNextJob();

      expect(result).toBe(true);
      expect(mockJobQueue.getNextPendingJob).toHaveBeenCalled();
    });

    it('should return false when no pending jobs', async () => {
      mockJobQueue.getNextPendingJob.mockResolvedValue(null);

      const result = await processor.processNextJob();

      expect(result).toBe(false);
    });

    it('should handle unknown job types', async () => {
      const job = {
        id: 'test-job-id',
        userId: 'user-123',
        type: 'unknown-type' as Job['type'],
        status: 'pending' as const,
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockJobQueue.getNextPendingJob.mockResolvedValue(job);

      const result = await processor.processNextJob();

      expect(result).toBe(true);
      expect(mockJobQueue.updateJobStatus).toHaveBeenCalledWith(
        'test-job-id',
        'failed',
        undefined,
        'Unknown job type'
      );
    });
  });

  describe('processPendingJobs', () => {
    it('should process multiple jobs', async () => {
      mockJobQueue.getNextPendingJob
        .mockResolvedValueOnce({
          id: 'job-1',
          userId: 'user-123',
          type: 'create-and-publish-issue',
          status: 'pending',
          payload: { title: 'Test 1', prompt: 'Prompt 1', repository: 'owner/repo' },
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          id: 'job-2',
          userId: 'user-456',
          type: 'create-and-publish-issue',
          status: 'pending',
          payload: { title: 'Test 2', prompt: 'Prompt 2', repository: 'owner/repo' },
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .mockResolvedValueOnce(null);

      // Setup successful processing mocks
      mockUserStorage.getOpenAIKey.mockResolvedValue('test-api-key');
      mockGithubConnections.get.mockResolvedValue({
        id: 'connection-id',
        userId: 'user-123',
        accessToken: 'github-token',
        selectedRepo: 'owner/repo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockPublishToGitHub.mockResolvedValue({
        success: true,
        issueUrl: 'https://github.com/owner/repo/issues/123',
        issueNumber: 123,
      });

      const count = await processor.processPendingJobs(5);

      expect(count).toBe(2);
      expect(mockJobQueue.getNextPendingJob).toHaveBeenCalledTimes(3);
    });

    it('should respect max jobs limit', async () => {
      mockJobQueue.getNextPendingJob.mockResolvedValue({
        id: 'job-1',
        userId: 'user-123',
        type: 'create-and-publish-issue',
        status: 'pending',
        payload: { title: 'Test', prompt: 'Prompt', repository: 'owner/repo' },
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Setup successful processing mocks
      mockUserStorage.getOpenAIKey.mockResolvedValue('test-api-key');
      mockGithubConnections.get.mockResolvedValue({
        id: 'connection-id',
        userId: 'user-123',
        accessToken: 'github-token',
        selectedRepo: 'owner/repo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      mockPublishToGitHub.mockResolvedValue({
        success: true,
        issueUrl: 'https://github.com/owner/repo/issues/123',
        issueNumber: 123,
      });

      const count = await processor.processPendingJobs(2);

      expect(count).toBe(2);
      expect(mockJobQueue.getNextPendingJob).toHaveBeenCalledTimes(2);
    });
  });
});