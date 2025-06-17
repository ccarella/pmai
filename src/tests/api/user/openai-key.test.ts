import { POST, DELETE } from '@/app/api/user/openai-key/route'
import { GET as GET_STATUS } from '@/app/api/user/openai-key/status/route'
import { POST as VALIDATE } from '@/app/api/user/openai-key/validate/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { userProfiles } from '@/lib/services/user-storage'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/services/user-storage', () => ({
  userProfiles: {
    updateOpenAIKey: jest.fn(),
    removeOpenAIKey: jest.fn(),
    get: jest.fn(),
    getOpenAIKey: jest.fn(),
  }
}))

jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    models: {
      list: jest.fn().mockResolvedValue({ data: [] })
    }
  }))
}))

describe('/api/user/openai-key', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should save API key for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      })

      const request = new NextRequest('http://localhost:3000/api/user/openai-key', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'sk-test123' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(userProfiles.updateOpenAIKey).toHaveBeenCalledWith('user123', 'sk-test123')
    })

    it('should reject invalid API key format', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' }
      })

      const request = new NextRequest('http://localhost:3000/api/user/openai-key', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'invalid-key' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid OpenAI API key format')
      expect(userProfiles.updateOpenAIKey).not.toHaveBeenCalled()
    })

    it('should require authentication', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/user/openai-key', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'sk-test123' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(userProfiles.updateOpenAIKey).not.toHaveBeenCalled()
    })
  })

  describe('DELETE', () => {
    it('should remove API key for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' }
      })

      const request = new NextRequest('http://localhost:3000/api/user/openai-key', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(userProfiles.removeOpenAIKey).toHaveBeenCalledWith('user123')
    })

    it('should require authentication', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/user/openai-key', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(userProfiles.removeOpenAIKey).not.toHaveBeenCalled()
    })
  })

  describe('GET /status', () => {
    it('should return API key status for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' }
      })

      ;(userProfiles.get as jest.Mock).mockResolvedValue({
        id: 'user123',
        openaiApiKey: 'encrypted-key',
        openaiKeyAddedAt: '2024-01-01T00:00:00Z',
      })

      const request = new NextRequest('http://localhost:3000/api/user/openai-key/status')

      const response = await GET_STATUS(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasApiKey).toBe(true)
      expect(data.keyAddedAt).toBe('2024-01-01T00:00:00Z')
    })

    it('should return false if no API key', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' }
      })

      ;(userProfiles.get as jest.Mock).mockResolvedValue({
        id: 'user123',
      })

      const request = new NextRequest('http://localhost:3000/api/user/openai-key/status')

      const response = await GET_STATUS(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasApiKey).toBe(false)
      expect(data.keyAddedAt).toBeUndefined()
    })
  })

  describe('POST /validate', () => {
    it('should validate API key successfully', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' }
      })

      const request = new NextRequest('http://localhost:3000/api/user/openai-key/validate', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'sk-test123' }),
      })

      const response = await VALIDATE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
    })

    it('should reject invalid API key', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' }
      })

      // Mock OpenAI to throw 401 error
      const OpenAI = jest.requireMock('openai').default
      OpenAI.mockImplementation(() => ({
        models: {
          list: jest.fn().mockRejectedValue({ status: 401 })
        }
      }))

      const request = new NextRequest('http://localhost:3000/api/user/openai-key/validate', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'sk-invalid' }),
      })

      const response = await VALIDATE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid API key')
    })
  })
})