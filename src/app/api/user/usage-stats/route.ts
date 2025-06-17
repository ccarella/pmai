import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { userProfiles } from '@/lib/services/user-storage'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const profile = await userProfiles.get(session.user.id)

    return NextResponse.json({ 
      usageStats: profile?.usageStats || {
        totalTokens: 0,
        totalCost: 0,
        lastUsed: null
      }
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    )
  }
}