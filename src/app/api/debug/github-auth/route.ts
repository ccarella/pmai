import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { githubConnections } from '@/lib/redis'
import { Octokit } from 'octokit'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    const debugInfo: {
      session: {
        exists: boolean
        user: {
          id: string
          name: string
          email: string
        } | null
      }
      connection: {
        exists: boolean
        hasAccessToken: boolean
      }
      scopes: {
        requested: string[]
        granted: string[]
        error?: string
      }
      privateRepoAccess: {
        tested: boolean
        success: boolean
        repoCount: number
        error: string | null
      }
      rateLimit?: {
        limit: number
        remaining: number
        reset: string
        error?: string
      }
      error?: string
    } = {
      session: {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        } : null,
      },
      connection: {
        exists: false,
        hasAccessToken: false,
      },
      scopes: {
        requested: ['read:user', 'user:email', 'repo'],
        granted: [],
      },
      privateRepoAccess: {
        tested: false,
        success: false,
        repoCount: 0,
        error: null,
      },
    }

    if (!session?.user?.id) {
      return NextResponse.json({
        ...debugInfo,
        error: 'No active session',
      })
    }

    const connection = await githubConnections.get(session.user.id)
    
    if (!connection) {
      return NextResponse.json({
        ...debugInfo,
        error: 'No GitHub connection found',
      })
    }

    debugInfo.connection.exists = true
    debugInfo.connection.hasAccessToken = !!connection.accessToken

    if (!connection.accessToken) {
      return NextResponse.json({
        ...debugInfo,
        error: 'No access token found',
      })
    }

    const octokit = new Octokit({
      auth: connection.accessToken,
    })

    // Test the token and get scopes
    try {
      const { headers } = await octokit.request('GET /user')
      const scopesHeader = headers['x-oauth-scopes']
      if (scopesHeader) {
        debugInfo.scopes.granted = scopesHeader.split(',').map((s: string) => s.trim())
      }
    } catch (error) {
      debugInfo.scopes.error = error instanceof Error ? error.message : 'Failed to fetch scopes'
    }

    // Test private repo access
    try {
      debugInfo.privateRepoAccess.tested = true
      const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
        visibility: 'private',
        per_page: 100,
      })
      debugInfo.privateRepoAccess.success = true
      debugInfo.privateRepoAccess.repoCount = repos.length
    } catch (error) {
      debugInfo.privateRepoAccess.success = false
      debugInfo.privateRepoAccess.error = error instanceof Error ? error.message : 'Failed to fetch private repos'
    }

    // Get rate limit info
    try {
      const { data: rateLimit } = await octokit.rest.rateLimit.get()
      debugInfo.rateLimit = {
        limit: rateLimit.rate.limit,
        remaining: rateLimit.rate.remaining,
        reset: new Date(rateLimit.rate.reset * 1000).toISOString(),
      }
    } catch {
      debugInfo.rateLimit = { error: 'Failed to fetch rate limit' }
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}