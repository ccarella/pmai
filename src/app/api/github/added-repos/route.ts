import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { githubConnections } from '@/lib/redis'
import { Octokit } from 'octokit'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connection = await githubConnections.get(session.user.id)
    
    if (!connection) {
      return NextResponse.json({ error: 'No GitHub connection found' }, { status: 404 })
    }

    if (!connection.addedRepos || connection.addedRepos.length === 0) {
      return NextResponse.json({ repositories: [], selectedRepo: connection.selectedRepo })
    }

    // Fetch repository details for added repos
    const octokit = new Octokit({
      auth: connection.accessToken,
    })

    const repositories = []
    
    for (const repoFullName of connection.addedRepos) {
      try {
        const [owner, repo] = repoFullName.split('/')
        const { data } = await octokit.repos.get({ owner, repo })
        
        repositories.push({
          id: data.id,
          name: data.name,
          full_name: data.full_name,
          private: data.private,
          description: data.description,
          updated_at: data.updated_at,
          html_url: data.html_url,
        })
      } catch (error) {
        // Skip repositories that can't be fetched (might have been deleted or access revoked)
        console.error(`Failed to fetch repository ${repoFullName}:`, error)
      }
    }

    return NextResponse.json({
      repositories,
      selectedRepo: connection.selectedRepo,
    })
  } catch (error) {
    console.error('Error fetching added repositories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, repoFullName } = body

    if (!action || !repoFullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action === 'add') {
      await githubConnections.addRepository(session.user.id, repoFullName)
    } else if (action === 'remove') {
      await githubConnections.removeRepository(session.user.id, repoFullName)
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error managing repositories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}