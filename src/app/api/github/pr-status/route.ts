import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { githubConnections } from '@/lib/redis';
import { fetchPRTestStatus } from '@/lib/github/pr-status';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { issueNumbers } = body;

    if (!Array.isArray(issueNumbers) || issueNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Issue numbers array is required' },
        { status: 400 }
      );
    }

    const selectedRepo = connection.selectedRepo;

    if (!selectedRepo) {
      return NextResponse.json(
        { error: 'No repository selected' },
        { status: 400 }
      );
    }

    const [owner, name] = selectedRepo.split('/');

    // Fetch statuses for all issues in parallel
    const statusPromises = issueNumbers.map(async (issueNumber: number) => {
      const status = await fetchPRTestStatus(
        owner,
        name,
        issueNumber,
        connection.accessToken
      );
      return { issueNumber, status };
    });

    const statuses = await Promise.all(statusPromises);

    // Convert array to object for easier lookup
    const statusMap = statuses.reduce((acc, { issueNumber, status }) => {
      acc[issueNumber] = status;
      return acc;
    }, {} as Record<number, string>);

    return NextResponse.json({ statuses: statusMap });
  } catch (error) {
    console.error('Error fetching PR statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PR statuses' },
      { status: 500 }
    );
  }
}