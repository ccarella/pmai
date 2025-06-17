import { redis } from '@/lib/redis';
import { randomUUID } from 'crypto';

export interface Job<T = unknown> {
  id: string;
  userId: string;
  type: 'create-and-publish-issue';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: T;
  result?: unknown;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateAndPublishIssuePayload {
  title: string;
  prompt: string;
  repository: string;
  generatedContent?: {
    markdown: string;
    summary: {
      type: string;
      priority: string;
      complexity: string;
    };
  };
}

export interface CreateAndPublishIssueResult {
  issueUrl: string;
  issueNumber: number;
  repository: string;
  title: string;
}

const JOB_KEY_PREFIX = 'job:';
const USER_JOBS_KEY_PREFIX = 'user-jobs:';
const PENDING_JOBS_KEY = 'pending-jobs';
const JOB_TTL = 24 * 60 * 60; // 24 hours in seconds

export class JobQueue {
  async createJob<T>(
    userId: string,
    type: Job['type'],
    payload: T,
    maxRetries = 3
  ): Promise<Job<T>> {
    const job: Job<T> = {
      id: randomUUID(),
      userId,
      type,
      status: 'pending',
      payload,
      retryCount: 0,
      maxRetries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save job to Redis
    await redis.setex(`${JOB_KEY_PREFIX}${job.id}`, JOB_TTL, JSON.stringify(job));
    
    // Add to pending jobs set
    await redis.zadd(PENDING_JOBS_KEY, {
      score: Date.now(),
      member: job.id,
    });
    
    // Add to user's jobs list
    await redis.lpush(`${USER_JOBS_KEY_PREFIX}${userId}`, job.id);
    await redis.expire(`${USER_JOBS_KEY_PREFIX}${userId}`, JOB_TTL);

    return job;
  }

  async getJob<T = unknown>(jobId: string): Promise<Job<T> | null> {
    const data = await redis.get(`${JOB_KEY_PREFIX}${jobId}`);
    if (!data) return null;
    return JSON.parse(data as string) as Job<T>;
  }

  async updateJob<T = unknown>(jobId: string, updates: Partial<Job<T>>): Promise<void> {
    const job = await this.getJob<T>(jobId);
    if (!job) throw new Error('Job not found');

    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await redis.setex(`${JOB_KEY_PREFIX}${jobId}`, JOB_TTL, JSON.stringify(updatedJob));
  }

  async updateJobStatus(
    jobId: string,
    status: Job['status'],
    result?: unknown,
    error?: string
  ): Promise<void> {
    const updates: Partial<Job> = { status };
    
    if (result) updates.result = result;
    if (error) updates.error = error;
    if (status === 'completed' || status === 'failed') {
      updates.completedAt = new Date().toISOString();
      // Remove from pending jobs
      await redis.zrem(PENDING_JOBS_KEY, jobId);
    }

    await this.updateJob(jobId, updates);
  }

  async getNextPendingJob(): Promise<Job | null> {
    // Get the oldest pending job
    const jobIds = await redis.zrange(PENDING_JOBS_KEY, 0, 0);
    if (!jobIds || jobIds.length === 0) return null;

    const jobId = jobIds[0] as string;
    const job = await this.getJob(jobId);
    
    if (!job) {
      // Remove invalid job from pending set
      await redis.zrem(PENDING_JOBS_KEY, jobId);
      return null;
    }

    return job;
  }

  async getUserJobs(userId: string, limit = 10): Promise<Job[]> {
    const jobIds = await redis.lrange(`${USER_JOBS_KEY_PREFIX}${userId}`, 0, limit - 1);
    const jobs = await Promise.all(
      jobIds.map(id => this.getJob(id as string))
    );
    
    return jobs.filter((job): job is Job => job !== null);
  }

  async retryJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) throw new Error('Job not found');

    if (job.retryCount >= job.maxRetries) {
      await this.updateJobStatus(jobId, 'failed', undefined, 'Max retries exceeded');
      return;
    }

    await this.updateJob(jobId, {
      status: 'pending',
      retryCount: job.retryCount + 1,
      error: undefined,
    });

    // Re-add to pending jobs
    await redis.zadd(PENDING_JOBS_KEY, {
      score: Date.now(),
      member: jobId,
    });
  }

  async cleanupOldJobs(): Promise<void> {
    // This could be called periodically to clean up old completed/failed jobs
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    // Remove old jobs from pending set
    await redis.zremrangebyscore(PENDING_JOBS_KEY, 0, cutoffTime);
  }
}

export const jobQueue = new JobQueue();