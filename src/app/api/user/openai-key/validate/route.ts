import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

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

    // Test the API key by making a simple API call
    try {
      const openai = new OpenAI({ apiKey })
      
      // Make a minimal API call to validate the key
      await openai.models.list()
      
      return NextResponse.json({ valid: true })
    } catch (openaiError) {
      if ((openaiError as { status?: number })?.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 400 }
        )
      }
      
      throw openaiError
    }
  } catch (error) {
    console.error('Error validating OpenAI API key:', error)
    return NextResponse.json(
      { error: 'Failed to validate API key' },
      { status: 500 }
    )
  }
}