import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Octokit } from 'octokit';
import { githubConnections } from '@/lib/redis';

export async function GET() {
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

    const { data: labels } = await octokit.rest.issues.listLabelsForRepo({
      owner,
      repo: name,
      per_page: 100, // Get up to 100 labels
    });

    return NextResponse.json({
      labels: labels.map(label => ({
        id: label.id,
        name: label.name,
        color: label.color,
        description: label.description,
      })),
    });
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    );
  }
}