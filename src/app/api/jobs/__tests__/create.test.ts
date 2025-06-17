import { POST } from '../create/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { jobQueue } from '@/lib/services/job-queue';
import { isRedisConfigured } from '@/lib/auth-config';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/lib/services/job-queue');
jest.mock('@/lib/auth-config');

describe('POST /api/jobs/create', () => {
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
  const mockJobQueue = jobQueue as jest.Mocked<typeof jobQueue>;
  const mockIsRedisConfigured = isRedisConfigured as jest.MockedFunction<typeof isRedisConfigured>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRedisConfigured.mockReturnValue(true);
  });

  it('should create a job successfully', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    });

    mockJobQueue.createJob.mockResolvedValue({
      id: 'job-123',
      userId: 'user-123',
      type: 'create-and-publish-issue',
      status: 'pending',
      payload: {
        title: 'Test Issue',
        prompt: 'Create a test issue',
        repository: 'owner/repo',
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Issue',
        prompt: 'Create a test issue',
        repository: 'owner/repo',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      jobId: 'job-123',
      status: 'pending',
    });

    expect(mockJobQueue.createJob).toHaveBeenCalledWith(
      'user-123',
      'create-and-publish-issue',
      {
        title: 'Test Issue',
        prompt: 'Create a test issue',
        repository: 'owner/repo',
      }
    );
  });

  it('should handle missing title gracefully', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    });

    mockJobQueue.createJob.mockResolvedValue({
      id: 'job-123',
      userId: 'user-123',
      type: 'create-and-publish-issue',
      status: 'pending',
      payload: {
        title: '',
        prompt: 'Create a test issue',
        repository: 'owner/repo',
      },
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a test issue',
        repository: 'owner/repo',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    expect(mockJobQueue.createJob).toHaveBeenCalledWith(
      'user-123',
      'create-and-publish-issue',
      {
        title: '',
        prompt: 'Create a test issue',
        repository: 'owner/repo',
      }
    );
  });

  it('should return 401 for unauthenticated requests', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/jobs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Issue',
        prompt: 'Create a test issue',
        repository: 'owner/repo',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(mockJobQueue.createJob).not.toHaveBeenCalled();
  });

  it('should return 400 for missing required fields', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    });

    const request = new NextRequest('http://localhost:3000/api/jobs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Issue',
        // Missing prompt and repository
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Prompt and repository are required' });
    expect(mockJobQueue.createJob).not.toHaveBeenCalled();
  });

  it('should return 503 when Redis is not configured', async () => {
    mockIsRedisConfigured.mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/jobs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Issue',
        prompt: 'Create a test issue',
        repository: 'owner/repo',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data).toEqual({ error: 'Job queue not configured' });
    expect(mockJobQueue.createJob).not.toHaveBeenCalled();
  });

  it('should handle job creation errors', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    });

    mockJobQueue.createJob.mockRejectedValue(new Error('Redis connection failed'));

    const request = new NextRequest('http://localhost:3000/api/jobs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Issue',
        prompt: 'Create a test issue',
        repository: 'owner/repo',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to create job' });
  });
});