import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { githubConnections } from '@/lib/redis'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connection = await githubConnections.get(session.user.id)
    
    return NextResponse.json({
      selectedRepo: connection?.selectedRepo || null,
    })
  } catch (error) {
    console.error('Error fetching selected repo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch selected repository' },
      { status: 500 }
    )
  }
}