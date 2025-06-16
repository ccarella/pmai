// Mock dependencies first
jest.mock('next-auth/next')
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
}))
jest.mock('octokit')

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/github/repositories/route'
import { getServerSession } from 'next-auth/next'
import { githubConnections } from '@/lib/redis'
import { Octokit } from 'octokit'

describe('/api/github/repositories', () => {
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

  const mockRepositories = [
    {
      id: 1,
      name: 'repo1',
      full_name: 'owner/repo1',
      description: 'Test repository 1',
      private: false,
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'repo2',
      full_name: 'owner/repo2',
      description: 'Test repository 2',
      private: true,
      updated_at: '2023-01-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return repositories for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(githubConnections.get as jest.Mock).mockResolvedValue(mockConnection)
      
      const mockListForAuthenticatedUser = jest.fn().mockResolvedValue({ data: mockRepositories })
      ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
        rest: {
          repos: {
            listForAuthenticatedUser: mockListForAuthenticatedUser,
          },
        },
      } as any))

      const request = new NextRequest('http://localhost/api/github/repositories')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        repositories: mockRepositories,
        selectedRepo: 'owner/repo',
      })
      expect(mockListForAuthenticatedUser).toHaveBeenCalledWith({
        sort: 'updated',
        per_page: 100,
      })
    })

    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/github/repositories')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 400 if GitHub is not connected', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(githubConnections.get as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/github/repositories')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'GitHub not connected' })
    })

    it('should handle errors from GitHub API', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(githubConnections.get as jest.Mock).mockResolvedValue(mockConnection)
      
      const mockListForAuthenticatedUser = jest.fn().mockRejectedValue(new Error('GitHub API error'))
      ;(Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => ({
        rest: {
          repos: {
            listForAuthenticatedUser: mockListForAuthenticatedUser,
          },
        },
      } as any))

      const request = new NextRequest('http://localhost/api/github/repositories')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch repositories' })
    })
  })

  describe('POST', () => {
    it('should update selected repository for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(githubConnections.updateSelectedRepo as jest.Mock).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost/api/github/repositories', {
        method: 'POST',
        body: JSON.stringify({ selectedRepo: 'owner/newrepo' }),
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(githubConnections.updateSelectedRepo).toHaveBeenCalledWith('user123', 'owner/newrepo')
    })

    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/github/repositories', {
        method: 'POST',
        body: JSON.stringify({ selectedRepo: 'owner/newrepo' }),
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 400 if repository is not provided', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/github/repositories', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Repository required' })
    })

    it('should handle errors when updating repository', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(githubConnections.updateSelectedRepo as jest.Mock).mockRejectedValue(new Error('Update failed'))

      const request = new NextRequest('http://localhost/api/github/repositories', {
        method: 'POST',
        body: JSON.stringify({ selectedRepo: 'owner/newrepo' }),
      })
      
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to save repository' })
    })
  })
})