import { JobQueue, Job, CreateAndPublishIssuePayload } from '../job-queue';
import { redis } from '@/lib/redis';

// Mock Redis
jest.mock('@/lib/redis', () => ({
  redis: {
    setex: jest.fn(),
    get: jest.fn(),
    zadd: jest.fn(),
    zrem: jest.fn(),
    zrange: jest.fn(),
    zremrangebyscore: jest.fn(),
    lpush: jest.fn(),
    lrange: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomUUID: () => 'test-job-id',
}));

describe('JobQueue', () => {
  let jobQueue: JobQueue;
  const mockRedis = redis as jest.Mocked<typeof redis>;

  beforeEach(() => {
    jobQueue = new JobQueue();
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a new job with correct structure', async () => {
      const userId = 'user-123';
      const payload: CreateAndPublishIssuePayload = {
        title: 'Test Issue',
        prompt: 'Test prompt',
        repository: 'owner/repo',
      };

      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.zadd.mockResolvedValue(1);
      mockRedis.lpush.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const job = await jobQueue.createJob(userId, 'create-and-publish-issue', payload);

      expect(job).toMatchObject({
        id: 'test-job-id',
        userId,
        type: 'create-and-publish-issue',
        status: 'pending',
        payload,
        retryCount: 0,
        maxRetries: 3,
      });

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'job:test-job-id',
        86400,
        expect.stringContaining('"id":"test-job-id"')
      );

      expect(mockRedis.zadd).toHaveBeenCalledWith('pending-jobs', {
        score: expect.any(Number),
        member: 'test-job-id',
      });

      expect(mockRedis.lpush).toHaveBeenCalledWith('user-jobs:user-123', 'test-job-id');
    });

    it('should allow custom max retries', async () => {
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.zadd.mockResolvedValue(1);
      mockRedis.lpush.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const job = await jobQueue.createJob('user-123', 'create-and-publish-issue', {}, 5);

      expect(job.maxRetries).toBe(5);
    });
  });

  describe('getJob', () => {
    it('should retrieve an existing job', async () => {
      const jobData: Job = {
        id: 'test-job-id',
        userId: 'user-123',
        type: 'create-and-publish-issue',
        status: 'pending',
        payload: { title: 'Test', prompt: 'Test', repository: 'owner/repo' },
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(jobData));

      const job = await jobQueue.getJob('test-job-id');

      expect(job).toEqual(jobData);
      expect(mockRedis.get).toHaveBeenCalledWith('job:test-job-id');
    });

    it('should return null for non-existent job', async () => {
      mockRedis.get.mockResolvedValue(null);

      const job = await jobQueue.getJob('non-existent');

      expect(job).toBeNull();
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status to processing', async () => {
      const jobData: Job = {
        id: 'test-job-id',
        userId: 'user-123',
        type: 'create-and-publish-issue',
        status: 'pending',
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(jobData));
      mockRedis.setex.mockResolvedValue('OK');

      await jobQueue.updateJobStatus('test-job-id', 'processing');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'job:test-job-id',
        86400,
        expect.stringContaining('"status":"processing"')
      );
    });

    it('should update job status to completed with result', async () => {
      const jobData: Job = {
        id: 'test-job-id',
        userId: 'user-123',
        type: 'create-and-publish-issue',
        status: 'processing',
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = {
        issueUrl: 'https://github.com/owner/repo/issues/123',
        issueNumber: 123,
        repository: 'owner/repo',
        title: 'Test Issue',
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(jobData));
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.zrem.mockResolvedValue(1);

      await jobQueue.updateJobStatus('test-job-id', 'completed', result);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'job:test-job-id',
        86400,
        expect.stringContaining('"status":"completed"')
      );

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'job:test-job-id',
        86400,
        expect.stringContaining('"result":')
      );

      expect(mockRedis.zrem).toHaveBeenCalledWith('pending-jobs', 'test-job-id');
    });

    it('should update job status to failed with error', async () => {
      const jobData: Job = {
        id: 'test-job-id',
        userId: 'user-123',
        type: 'create-and-publish-issue',
        status: 'processing',
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(jobData));
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.zrem.mockResolvedValue(1);

      await jobQueue.updateJobStatus('test-job-id', 'failed', undefined, 'Test error');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'job:test-job-id',
        86400,
        expect.stringContaining('"error":"Test error"')
      );

      expect(mockRedis.zrem).toHaveBeenCalledWith('pending-jobs', 'test-job-id');
    });
  });

  describe('getNextPendingJob', () => {
    it('should return the oldest pending job', async () => {
      const jobData: Job = {
        id: 'test-job-id',
        userId: 'user-123',
        type: 'create-and-publish-issue',
        status: 'pending',
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.zrange.mockResolvedValue(['test-job-id']);
      mockRedis.get.mockResolvedValue(JSON.stringify(jobData));

      const job = await jobQueue.getNextPendingJob();

      expect(job).toEqual(jobData);
      expect(mockRedis.zrange).toHaveBeenCalledWith('pending-jobs', 0, 0);
    });

    it('should return null when no pending jobs', async () => {
      mockRedis.zrange.mockResolvedValue([]);

      const job = await jobQueue.getNextPendingJob();

      expect(job).toBeNull();
    });

    it('should remove invalid jobs from pending set', async () => {
      mockRedis.zrange.mockResolvedValue(['invalid-job-id']);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.zrem.mockResolvedValue(1);

      const job = await jobQueue.getNextPendingJob();

      expect(job).toBeNull();
      expect(mockRedis.zrem).toHaveBeenCalledWith('pending-jobs', 'invalid-job-id');
    });
  });

  describe('retryJob', () => {
    it('should retry a failed job', async () => {
      const jobData: Job = {
        id: 'test-job-id',
        userId: 'user-123',
        type: 'create-and-publish-issue',
        status: 'failed',
        payload: {},
        retryCount: 1,
        maxRetries: 3,
        error: 'Previous error',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(jobData));
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.zadd.mockResolvedValue(1);

      await jobQueue.retryJob('test-job-id');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'job:test-job-id',
        86400,
        expect.stringContaining('"status":"pending"')
      );

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'job:test-job-id',
        86400,
        expect.stringContaining('"retryCount":2')
      );

      expect(mockRedis.zadd).toHaveBeenCalledWith('pending-jobs', {
        score: expect.any(Number),
        member: 'test-job-id',
      });
    });

    it('should mark job as failed when max retries exceeded', async () => {
      const jobData: Job = {
        id: 'test-job-id',
        userId: 'user-123',
        type: 'create-and-publish-issue',
        status: 'failed',
        payload: {},
        retryCount: 3,
        maxRetries: 3,
        error: 'Previous error',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(jobData));
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.zrem.mockResolvedValue(1);

      await jobQueue.retryJob('test-job-id');

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'job:test-job-id',
        86400,
        expect.stringContaining('"error":"Max retries exceeded"')
      );

      expect(mockRedis.zadd).not.toHaveBeenCalled();
    });
  });

  describe('getUserJobs', () => {
    it('should return user jobs', async () => {
      const jobData1: Job = {
        id: 'job-1',
        userId: 'user-123',
        type: 'create-and-publish-issue',
        status: 'completed',
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const jobData2: Job = {
        id: 'job-2',
        userId: 'user-123',
        type: 'create-and-publish-issue',
        status: 'pending',
        payload: {},
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedis.lrange.mockResolvedValue(['job-1', 'job-2']);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(jobData1))
        .mockResolvedValueOnce(JSON.stringify(jobData2));

      const jobs = await jobQueue.getUserJobs('user-123');

      expect(jobs).toEqual([jobData1, jobData2]);
      expect(mockRedis.lrange).toHaveBeenCalledWith('user-jobs:user-123', 0, 9);
    });

    it('should filter out null jobs', async () => {
      mockRedis.lrange.mockResolvedValue(['job-1', 'job-2']);
      mockRedis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify({
          id: 'job-2',
          userId: 'user-123',
          type: 'create-and-publish-issue',
          status: 'pending',
          payload: {},
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

      const jobs = await jobQueue.getUserJobs('user-123');

      expect(jobs).toHaveLength(1);
      expect(jobs[0].id).toBe('job-2');
    });
  });
});