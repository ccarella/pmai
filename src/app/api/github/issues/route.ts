import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Octokit } from 'octokit';
import { githubConnections } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
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

    const octokit = new Octokit({
      auth: connection.accessToken,
    });

    const selectedRepo = connection.selectedRepo;

    if (!selectedRepo) {
      return NextResponse.json(
        { error: 'No repository selected' },
        { status: 400 }
      );
    }

    const [owner, name] = selectedRepo.split('/');

    const searchParams = req.nextUrl.searchParams;
    const state = searchParams.get('state') || 'open';
    const labels = searchParams.get('labels') || undefined;
    const sort = searchParams.get('sort') || 'created';
    const direction = searchParams.get('direction') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '20');

    const { data: issues, headers } = await octokit.rest.issues.listForRepo({
      owner,
      repo: name,
      state: state as 'open' | 'closed' | 'all',
      labels,
      sort: sort as 'created' | 'updated' | 'comments',
      direction: direction as 'asc' | 'desc',
      page,
      per_page,
    });

    const linkHeader = headers.link;
    const pagination = parseLinkHeader(linkHeader);

    return NextResponse.json({
      issues: issues.map(issue => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at,
        body: issue.body,
        user: {
          login: issue.user?.login,
          avatar_url: issue.user?.avatar_url,
        },
        labels: issue.labels,
        comments: issue.comments,
        html_url: issue.html_url,
        pull_request: issue.pull_request ? (
          typeof issue.pull_request === 'object' ? issue.pull_request : true
        ) : undefined,
      })),
      pagination: {
        ...pagination,
        page,
        per_page,
      },
      repository: {
        owner,
        name,
      },
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { issueNumber } = body;

    if (!issueNumber) {
      return NextResponse.json(
        { error: 'Issue number is required' },
        { status: 400 }
      );
    }

    const connection = await githubConnections.get(session.user.id);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: connection.accessToken,
    });

    const selectedRepo = connection.selectedRepo;

    if (!selectedRepo) {
      return NextResponse.json(
        { error: 'No repository selected' },
        { status: 400 }
      );
    }

    const [owner, name] = selectedRepo.split('/');

    const { data: issue } = await octokit.rest.issues.get({
      owner,
      repo: name,
      issue_number: issueNumber,
    });

    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo: name,
      issue_number: issueNumber,
    });

    return NextResponse.json({
      issue: {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at,
        body: issue.body,
        user: {
          login: issue.user?.login,
          avatar_url: issue.user?.avatar_url,
        },
        labels: issue.labels,
        comments: issue.comments,
        html_url: issue.html_url,
        pull_request: issue.pull_request ? (
          typeof issue.pull_request === 'object' ? issue.pull_request : true
        ) : undefined,
      },
      comments: comments.map(comment => ({
        id: comment.id,
        body: comment.body,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: {
          login: comment.user?.login,
          avatar_url: comment.user?.avatar_url,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching issue details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issue details' },
      { status: 500 }
    );
  }
}

function parseLinkHeader(linkHeader: string | undefined) {
  if (!linkHeader) return {};

  const links: Record<string, number> = {};
  const regex = /<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="(\w+)"/g;
  let match;

  while ((match = regex.exec(linkHeader)) !== null) {
    links[match[2]] = parseInt(match[1]);
  }

  return links;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { issueNumber, title, body: issueBody, labels } = body;

    if (!issueNumber) {
      return NextResponse.json(
        { error: 'Issue number is required' },
        { status: 400 }
      );
    }

    // Check if at least one field to update is provided
    if (!title && !issueBody && !labels) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }

    const connection = await githubConnections.get(session.user.id);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({
      auth: connection.accessToken,
    });

    const selectedRepo = connection.selectedRepo;

    if (!selectedRepo) {
      return NextResponse.json(
        { error: 'No repository selected' },
        { status: 400 }
      );
    }

    const [owner, name] = selectedRepo.split('/');

    // Update issue title and/or body
    if (title || issueBody) {
      const updateData: { title?: string; body?: string } = {};
      if (title) updateData.title = title;
      if (issueBody) updateData.body = issueBody;

      await octokit.rest.issues.update({
        owner,
        repo: name,
        issue_number: issueNumber,
        ...updateData,
      });
    }

    // Update labels if provided
    if (labels !== undefined) {
      await octokit.rest.issues.setLabels({
        owner,
        repo: name,
        issue_number: issueNumber,
        labels: labels,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}