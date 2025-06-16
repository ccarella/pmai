// Mock dependencies first
jest.mock('next-auth/next')
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
}))
jest.mock('@/lib/github/publishIssue')

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/github/publish/route'
import { getServerSession } from 'next-auth/next'
import { githubConnections } from '@/lib/redis'
import { publishToGitHubWithRetry } from '@/lib/github/publishIssue'

describe('/api/github/publish', () => {
  const mockSession = {
    user: { id: 'user123' },
  }

  const mockConnection = {
    id: 'user123',
    userId: 'user123',
    accessToken: 'ghs_mocktoken',
    selectedRepo: 'owner/repo',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  }

  const mockRequestBody = {
    title: 'Test Issue',
    body: 'Test issue body',
    labels: ['feature'],
    assignees: ['user1'],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully publish an issue', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(githubConnections.get as jest.Mock).mockResolvedValue(mockConnection)
    ;(publishToGitHubWithRetry as jest.Mock).mockResolvedValue({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123,
    })

    const request = new NextRequest('http://localhost/api/github/publish', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123,
    })
    expect(publishToGitHubWithRetry).toHaveBeenCalledWith({
      title: 'Test Issue',
      body: 'Test issue body',
      labels: ['feature'],
      assignees: ['user1'],
      accessToken: 'ghs_mocktoken',
      repository: 'owner/repo',
    })
  })

  it('should return 401 if user is not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/github/publish', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: 'Unauthorized' })
  })

  it('should return 400 if title or body is missing', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const request = new NextRequest('http://localhost/api/github/publish', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }), // Missing body
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Title and body are required' })
  })

  it('should return 400 if GitHub is not connected', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(githubConnections.get as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/github/publish', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'GitHub not connected' })
  })

  it('should return 400 if no repository is selected', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(githubConnections.get as jest.Mock).mockResolvedValue({
      ...mockConnection,
      selectedRepo: undefined,
    })

    const request = new NextRequest('http://localhost/api/github/publish', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'No repository selected' })
  })

  it('should handle publish failures', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(githubConnections.get as jest.Mock).mockResolvedValue(mockConnection)
    ;(publishToGitHubWithRetry as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Repository not found',
    })

    const request = new NextRequest('http://localhost/api/github/publish', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Repository not found' })
  })

  it('should handle unexpected errors', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(githubConnections.get as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/github/publish', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'Failed to publish issue' })
  })

  it('should pass through optional parameters', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(githubConnections.get as jest.Mock).mockResolvedValue(mockConnection)
    ;(publishToGitHubWithRetry as jest.Mock).mockResolvedValue({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123,
    })

    const requestWithoutOptional = new NextRequest('http://localhost/api/github/publish', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Issue',
        body: 'Test body',
      }),
    })

    const response = await POST(requestWithoutOptional)
    await response.json()

    expect(publishToGitHubWithRetry).toHaveBeenCalledWith({
      title: 'Test Issue',
      body: 'Test body',
      labels: undefined,
      assignees: undefined,
      accessToken: 'ghs_mocktoken',
      repository: 'owner/repo',
    })
  })
})