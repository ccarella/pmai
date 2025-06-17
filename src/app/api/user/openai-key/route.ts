import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { userProfiles } from '@/lib/services/user-storage'
import { resetOnboarding } from '@/lib/services/onboarding'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { apiKey } = await request.json()
    
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 400 }
      )
    }

    // Basic validation - OpenAI keys start with 'sk-'
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key format' },
        { status: 400 }
      )
    }

    // Store the encrypted API key
    await userProfiles.updateOpenAIKey(session.user.id, apiKey)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving OpenAI API key:', error)
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await userProfiles.removeOpenAIKey(session.user.id)
    await resetOnboarding(session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing OpenAI API key:', error)
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: 500 }
    )
  }
}