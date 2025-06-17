import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Octokit } from '@octokit/rest';
import { githubConnections } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const connection = await githubConnections.get(session.user.id);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 400 }
      );
    }

    const { owner, repo, pull_number } = await request.json();

    if (!owner || !repo || !pull_number) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: connection.accessToken,
    });

    // Get PR details to check mergeability
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: Number(pull_number),
    });

    // GitHub may not immediately calculate mergeability, so we might need to retry
    let attempts = 0;
    let mergeableData = pr;
    
    while (mergeableData.mergeable === null && attempts < 5) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      const { data: updatedPr } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: Number(pull_number),
      });
      mergeableData = updatedPr;
      attempts++;
    }

    // Get combined status for more detailed information
    const { data: combinedStatus } = await octokit.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: pr.head.sha,
    });

    // Check if all required status checks have passed
    const allChecksPassed = combinedStatus.state === 'success' || combinedStatus.state === 'pending';

    // Determine the merge state reason
    let merge_state_reason = '';
    if (pr.draft) {
      merge_state_reason = 'This pull request is still a draft';
    } else if (!mergeableData.mergeable) {
      merge_state_reason = 'This pull request has conflicts that must be resolved';
    } else if (!allChecksPassed && combinedStatus.state === 'failure') {
      merge_state_reason = 'Some checks have failed';
    } else if (combinedStatus.state === 'pending') {
      merge_state_reason = 'Checks are still running';
    }

    return NextResponse.json({
      mergeable: mergeableData.mergeable || false,
      mergeable_state: mergeableData.mergeable_state || 'unknown',
      merge_state_reason,
      checks_state: combinedStatus.state,
      draft: pr.draft,
    });
  } catch (error) {
    console.error('Error checking PR mergeability:', error);
    
    const errorStatus = (error as { status?: number })?.status;
    
    if (errorStatus === 404) {
      return NextResponse.json(
        { error: 'Pull request not found' },
        { status: 404 }
      );
    }
    
    if (errorStatus === 403) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to check PR mergeability' },
      { status: 500 }
    );
  }
}