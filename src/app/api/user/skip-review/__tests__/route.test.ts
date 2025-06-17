import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { getServerSession } from 'next-auth'
import { userProfiles } from '@/lib/services/user-storage'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/services/user-storage', () => ({
  userProfiles: {
    getSkipReview: jest.fn(),
    updateSkipReview: jest.fn()
  }
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

describe('/api/user/skip-review', () => {
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
  const mockGetSkipReview = userProfiles.getSkipReview as jest.MockedFunction<typeof userProfiles.getSkipReview>
  const mockUpdateSkipReview = userProfiles.updateSkipReview as jest.MockedFunction<typeof userProfiles.updateSkipReview>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return skipReview setting for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as ReturnType<typeof getServerSession>)
      mockGetSkipReview.mockResolvedValue(true)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ skipReview: true })
      expect(mockGetSkipReview).toHaveBeenCalledWith('user123')
    })

    it('should return false when skipReview is not set', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as ReturnType<typeof getServerSession>)
      mockGetSkipReview.mockResolvedValue(false)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ skipReview: false })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should handle errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as ReturnType<typeof getServerSession>)
      mockGetSkipReview.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch skip review setting' })
    })
  })

  describe('POST', () => {
    it('should update skipReview setting to true', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as ReturnType<typeof getServerSession>)

      const request = new NextRequest('http://localhost/api/user/skip-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipReview: true })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true, skipReview: true })
      expect(mockUpdateSkipReview).toHaveBeenCalledWith('user123', true)
    })

    it('should update skipReview setting to false', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as ReturnType<typeof getServerSession>)

      const request = new NextRequest('http://localhost/api/user/skip-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipReview: false })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true, skipReview: false })
      expect(mockUpdateSkipReview).toHaveBeenCalledWith('user123', false)
    })

    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/user/skip-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipReview: true })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 400 for invalid skipReview value', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as ReturnType<typeof getServerSession>)

      const request = new NextRequest('http://localhost/api/user/skip-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipReview: 'invalid' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Invalid skipReview value' })
    })

    it('should handle errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      } as ReturnType<typeof getServerSession>)
      mockUpdateSkipReview.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/user/skip-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipReview: true })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to update skip review setting' })
    })
  })
})