import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { githubConnections } from '@/lib/redis'
import { publishToGitHubWithRetry } from '@/lib/github/publishIssue'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, body, labels, assignees } = await request.json()

    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    const connection = await githubConnections.get(session.user.id)
    
    if (!connection) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 400 }
      )
    }

    if (!connection.selectedRepo) {
      return NextResponse.json(
        { error: 'No repository selected' },
        { status: 400 }
      )
    }

    const result = await publishToGitHubWithRetry({
      title,
      body,
      labels,
      assignees,
      accessToken: connection.accessToken,
      repository: connection.selectedRepo,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      issueUrl: result.issueUrl,
      issueNumber: result.issueNumber,
    })
  } catch (error) {
    console.error('Error in publish API:', error)
    return NextResponse.json(
      { error: 'Failed to publish issue' },
      { status: 500 }
    )
  }
}