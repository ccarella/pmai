import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { jobQueue } from '@/lib/services/job-queue';
import { isRedisConfigured } from '@/lib/auth-config';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  if (!isRedisConfigured()) {
    return NextResponse.json(
      { error: 'Job queue not configured' },
      { status: 503 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await context.params;
    
    // Get job from queue
    const job = await jobQueue.getJob(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify job belongs to user
    if (job.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Return job status and result
    return NextResponse.json({
      id: job.id,
      status: job.status,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}