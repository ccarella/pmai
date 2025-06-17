import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { jobQueue, CreateAndPublishIssuePayload } from '@/lib/services/job-queue';
import { isRedisConfigured } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, prompt, repository, generatedContent } = body;

    if (!prompt || !repository) {
      return NextResponse.json(
        { error: 'Prompt and repository are required' },
        { status: 400 }
      );
    }

    // Create job payload
    const payload: CreateAndPublishIssuePayload = {
      title: title || '',
      prompt,
      repository,
      generatedContent,
    };

    // Create job in queue
    const job = await jobQueue.createJob(
      session.user.id,
      'create-and-publish-issue',
      payload
    );

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}