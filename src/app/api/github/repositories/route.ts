import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { githubConnections } from '@/lib/redis'
import { Octokit } from 'octokit'
import { isGitHubAuthConfigured, isRedisConfigured } from '@/lib/auth-config'
import { withCacheHeaders, CACHE_CONFIGS } from '@/lib/utils/cache-headers'

export async function GET() {
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

    const connection = await githubConnections.get(session.user.id)
    
    if (!connection) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
    }

    const octokit = new Octokit({
      auth: connection.accessToken,
    })

    // Fetch user's repositories (including private ones)
    const { data: repositories } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      visibility: 'all', // Explicitly request all repos including private
      affiliation: 'owner,collaborator,organization_member',
    })

    const response = NextResponse.json({
      repositories,
      selectedRepo: connection.selectedRepo || null,
    })
    
    return withCacheHeaders(response, CACHE_CONFIGS.PRIVATE)
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { selectedRepo } = await request.json()

    if (!selectedRepo) {
      return NextResponse.json({ error: 'Repository required' }, { status: 400 })
    }

    await githubConnections.updateSelectedRepo(session.user.id, selectedRepo)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving repository:', error)
    return NextResponse.json(
      { error: 'Failed to save repository' },
      { status: 500 }
    )
  }
}