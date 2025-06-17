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

    const skipReview = await userProfiles.getSkipReview(session.user.id)
    
    return NextResponse.json({ skipReview })
  } catch (error) {
    console.error('Error fetching skip review setting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skip review setting' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { skipReview } = await request.json()
    
    if (typeof skipReview !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid skipReview value' },
        { status: 400 }
      )
    }

    await userProfiles.updateSkipReview(session.user.id, skipReview)
    
    return NextResponse.json({ success: true, skipReview })
  } catch (error) {
    console.error('Error updating skip review setting:', error)
    return NextResponse.json(
      { error: 'Failed to update skip review setting' },
      { status: 500 }
    )
  }
}