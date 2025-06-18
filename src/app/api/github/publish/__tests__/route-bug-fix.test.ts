import { NextRequest } from 'next/server'
import { POST } from '../route'
import { getServerSession } from 'next-auth'
import { githubConnections } from '@/lib/redis'
import { publishToGitHubWithRetry } from '@/lib/github/publishIssue'
import { generateAutoTitle } from '@/lib/services/auto-title-generation'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

jest.mock('@/lib/redis', () => ({
  githubConnections: {
    get: jest.fn()
  }
}))

jest.mock('@/lib/github/publishIssue', () => ({
  publishToGitHubWithRetry: jest.fn()
}))

jest.mock('@/lib/services/auto-title-generation', () => ({
  generateAutoTitle: jest.fn()
}))

jest.mock('@/lib/auth-config', () => ({
  isGitHubAuthConfigured: () => true,
  isRedisConfigured: () => true
}))

describe('GitHub Publish API - Bug Fix #97', () => {
  const mockSession = {
    user: {
      id: 'user123',
      email: 'test@example.com'
    }
  }

  const mockConnection = {
    accessToken: 'github_token_123',
    selectedRepo: 'owner/repo'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(githubConnections.get as jest.Mock).mockResolvedValue(mockConnection)
  })

  it('should include title field in successful response', async () => {
    const mockTitle = 'Test Story Issue'
    const mockBody = '# Test Story\nAs a user, I want to login'
    
    ;(generateAutoTitle as jest.Mock).mockResolvedValue({
      title: mockTitle,
      isGenerated: false,
      alternatives: []
    })

    ;(publishToGitHubWithRetry as jest.Mock).mockResolvedValue({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123
    })

    const request = new NextRequest('http://localhost:3000/api/github/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: mockTitle,
        body: mockBody
      })
    })

    const response = await POST(request)
    const responseData = await response.json()

    // Verify response includes all required fields
    expect(response.status).toBe(200)
    expect(responseData).toEqual({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123,
      title: mockTitle, // This was missing before the fix
      generatedTitle: undefined,
      alternatives: []
    })
  })

  it('should include generated title when auto-generated', async () => {
    const originalTitle = 'New Issue'
    const generatedTitle = 'Implement User Authentication System'
    const mockBody = 'Create a login system with OAuth support'
    
    ;(generateAutoTitle as jest.Mock).mockResolvedValue({
      title: generatedTitle,
      isGenerated: true,
      alternatives: ['Add OAuth Login', 'Create Authentication Module']
    })

    ;(publishToGitHubWithRetry as jest.Mock).mockResolvedValue({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/124',
      issueNumber: 124
    })

    const request = new NextRequest('http://localhost:3000/api/github/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: originalTitle,
        body: mockBody
      })
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData).toEqual({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/124',
      issueNumber: 124,
      title: generatedTitle, // Should use the generated title
      generatedTitle: generatedTitle, // Should indicate it was generated
      alternatives: ['Add OAuth Login', 'Create Authentication Module']
    })

    // Verify the generated title was used for publishing
    expect(publishToGitHubWithRetry).toHaveBeenCalledWith({
      title: generatedTitle,
      body: mockBody,
      labels: undefined,
      assignees: undefined,
      accessToken: mockConnection.accessToken,
      repository: mockConnection.selectedRepo
    })
  })

  it('should handle missing body error correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/github/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Issue'
        // Missing body
      })
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toEqual({
      error: 'Body is required'
    })
  })

  it('should handle publish failure correctly', async () => {
    ;(generateAutoTitle as jest.Mock).mockResolvedValue({
      title: 'Test Issue',
      isGenerated: false,
      alternatives: []
    })

    ;(publishToGitHubWithRetry as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Repository not found or access denied'
    })

    const request = new NextRequest('http://localhost:3000/api/github/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Issue',
        body: 'Test content'
      })
    })

    const response = await POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toEqual({
      error: 'Repository not found or access denied'
    })
  })
})