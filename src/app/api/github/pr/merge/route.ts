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

    const { owner, repo, pull_number, merge_method = 'merge' } = await request.json();

    if (!owner || !repo || !pull_number) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate merge method
    if (!['merge', 'squash', 'rebase'].includes(merge_method)) {
      return NextResponse.json(
        { error: 'Invalid merge method. Must be "merge", "squash", or "rebase"' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: connection.accessToken,
    });

    // First, check if the PR is mergeable
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: Number(pull_number),
    });

    if (!pr.mergeable) {
      return NextResponse.json(
        { error: 'Pull request is not mergeable' },
        { status: 422 }
      );
    }

    if (pr.draft) {
      return NextResponse.json(
        { error: 'Cannot merge a draft pull request' },
        { status: 422 }
      );
    }

    // Attempt to merge the PR
    try {
      const { data: mergeResult } = await octokit.pulls.merge({
        owner,
        repo,
        pull_number: Number(pull_number),
        merge_method: merge_method as 'merge' | 'squash' | 'rebase',
      });

      return NextResponse.json({
        merged: true,
        message: mergeResult.message,
        sha: mergeResult.sha,
      });
    } catch (mergeError) {
      // Handle specific merge errors
      const mergeErrorStatus = (mergeError as { status?: number })?.status;
      const mergeErrorResponse = (mergeError as { response?: { data?: { message?: string } } })?.response;
      
      if (mergeErrorStatus === 405) {
        return NextResponse.json(
          { error: 'Pull request is not mergeable' },
          { status: 405 }
        );
      }
      
      if (mergeErrorStatus === 409) {
        return NextResponse.json(
          { error: 'Head branch was modified. Review and try again.' },
          { status: 409 }
        );
      }

      if (mergeErrorStatus === 422) {
        return NextResponse.json(
          { error: mergeErrorResponse?.data?.message || 'Merge validation failed' },
          { status: 422 }
        );
      }

      throw mergeError;
    }
  } catch (error) {
    console.error('Error merging PR:', error);
    
    const errorStatus = (error as { status?: number })?.status;
    
    if (errorStatus === 404) {
      return NextResponse.json(
        { error: 'Pull request not found' },
        { status: 404 }
      );
    }
    
    if (errorStatus === 403) {
      return NextResponse.json(
        { error: 'Insufficient permissions to merge' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to merge pull request' },
      { status: 500 }
    );
  }
}