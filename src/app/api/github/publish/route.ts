import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { githubConnections } from '@/lib/redis'
import { publishToGitHubWithRetry } from '@/lib/github/publishIssue'
import { isGitHubAuthConfigured, isRedisConfigured } from '@/lib/auth-config'
import { generateAutoTitle } from '@/lib/services/auto-title-generation'

export async function POST(request: NextRequest) {
  // Check if GitHub auth is configured
  if (!isGitHubAuthConfigured() || !isRedisConfigured()) {
    return NextResponse.json(
      { error: 'GitHub integration not configured' },
      { status: 503 }
    )
  }

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title: originalTitle, body, labels, assignees } = await request.json()

    if (!body) {
      return NextResponse.json(
        { error: 'Body is required' },
        { status: 400 }
      )
    }

    // Generate title automatically if not provided or is generic
    const titleResult = await generateAutoTitle(body, originalTitle)
    const finalTitle = titleResult.title

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
      title: finalTitle,
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
      generatedTitle: titleResult.isGenerated ? finalTitle : undefined,
      alternatives: titleResult.alternatives,
    })
  } catch (error) {
    console.error('Error in publish API:', error)
    return NextResponse.json(
      { error: 'Failed to publish issue' },
      { status: 500 }
    )
  }
}