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
    const hasApiKey = !!profile?.openaiApiKey

    return NextResponse.json({ 
      hasApiKey,
      keyAddedAt: profile?.openaiKeyAddedAt 
    })
  } catch (error) {
    console.error('Error checking OpenAI API key status:', error)
    return NextResponse.json(
      { error: 'Failed to check API key status' },
      { status: 500 }
    )
  }
}