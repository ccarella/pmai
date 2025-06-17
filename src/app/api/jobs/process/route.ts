import { NextRequest, NextResponse } from 'next/server';
import { jobProcessor } from '@/lib/services/job-processor';
import { isRedisConfigured } from '@/lib/auth-config';

// This route can be called by Vercel Cron or an external service
// In production, you should add authentication (e.g., secret key)
export async function POST(request: NextRequest) {
  if (!isRedisConfigured()) {
    return NextResponse.json(
      { error: 'Job queue not configured' },
      { status: 503 }
    );
  }

  // Verify cron secret if provided
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Process up to 5 jobs per request to avoid timeout
    const processedCount = await jobProcessor.processPendingJobs(5);

    return NextResponse.json({
      success: true,
      processedCount,
    });
  } catch (error) {
    console.error('Error processing jobs:', error);
    return NextResponse.json(
      { error: 'Failed to process jobs' },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}