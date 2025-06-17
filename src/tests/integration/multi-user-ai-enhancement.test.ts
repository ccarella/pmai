import { POST as enhanceRoute } from '@/app/api/enhance/route'
import { POST as generateTitleRoute } from '@/app/api/generate-title/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { userProfiles } from '@/lib/services/user-storage'
import { AIEnhancementService } from '@/lib/services/ai-enhancement'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/services/user-storage', () => ({
  userProfiles: {
    getOpenAIKey: jest.fn(),
    updateUsageStats: jest.fn(),
    get: jest.fn(),
  }
}))

jest.mock('@/lib/services/ai-enhancement')

jest.mock('@/lib/utils/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({
    allowed: true,
    remaining: 19,
    resetAt: Date.now() + 3600000,
  }),
  getRateLimitHeaders: jest.fn().mockReturnValue({})
}))

describe('Multi-User AI Enhancement Integration', () => {
  const mockFormData = {
    type: 'feature',
    title: 'Test Feature',
    description: 'Test description',
    context: {
      businessValue: 'Test value',
      targetUsers: 'Test users',
      successCriteria: 'Test criteria',
    },
    implementation: {
      requirements: 'Test requirements',
      dependencies: [],
      approach: 'Test approach',
      affectedFiles: [],
    },
    technical: {
      components: ['TestComponent'],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.OPENAI_API_KEY = 'sk-system-key'
  })

  describe('Enhancement API with User-Specific Keys', () => {
    it('should use user-specific API key when available', async () => {
      // Setup authenticated user with API key
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', email: 'test@example.com' }
      })

      ;(userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('sk-user-key')

      const mockEnhanceIssue = jest.fn().mockResolvedValue({
        acceptanceCriteria: ['Test criteria'],
        edgeCases: ['Test edge case'],
        technicalConsiderations: ['Test consideration'],
        finalPrompt: 'Test prompt',
      })

      const mockGetUsageStats = jest.fn().mockReturnValue({
        totalTokens: 100,
        requestCount: 1,
        estimatedCost: 0.01,
      })

      ;(AIEnhancementService as jest.Mock).mockImplementation(() => ({
        enhanceIssue: mockEnhanceIssue,
        getUsageStats: mockGetUsageStats,
      }))

      const request = new NextRequest('http://localhost:3000/api/enhance', {
        method: 'POST',
        body: JSON.stringify({ formData: mockFormData }),
      })

      const response = await enhanceRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(AIEnhancementService).toHaveBeenCalledWith('sk-user-key')
      expect(mockEnhanceIssue).toHaveBeenCalledWith(mockFormData)
      expect(userProfiles.updateUsageStats).toHaveBeenCalledWith('user123', 100, 0.01)
      expect(data.enhancements).toBeDefined()
    })

    it('should fall back to system API key when user has no key', async () => {
      // Setup authenticated user without API key
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user456', email: 'nokey@example.com' }
      })

      ;(userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue(null)

      const mockEnhanceIssue = jest.fn().mockResolvedValue({
        acceptanceCriteria: ['System criteria'],
        edgeCases: ['System edge case'],
        technicalConsiderations: ['System consideration'],
        finalPrompt: 'System prompt',
      })

      const mockGetUsageStats = jest.fn().mockReturnValue({
        totalTokens: 50,
        requestCount: 1,
        estimatedCost: 0.005,
      })

      ;(AIEnhancementService as jest.Mock).mockImplementation(() => ({
        enhanceIssue: mockEnhanceIssue,
        getUsageStats: mockGetUsageStats,
      }))

      const request = new NextRequest('http://localhost:3000/api/enhance', {
        method: 'POST',
        body: JSON.stringify({ formData: mockFormData }),
      })

      const response = await enhanceRoute(request)
      await response.json()

      expect(response.status).toBe(200)
      expect(AIEnhancementService).toHaveBeenCalledWith('sk-system-key')
      expect(userProfiles.updateUsageStats).toHaveBeenCalledWith('user456', 50, 0.005)
    })

    it('should work for unauthenticated users with system key', async () => {
      // No session
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const mockEnhanceIssue = jest.fn().mockResolvedValue({
        acceptanceCriteria: ['Public criteria'],
        edgeCases: ['Public edge case'],
        technicalConsiderations: ['Public consideration'],
        finalPrompt: 'Public prompt',
      })

      const mockGetUsageStats = jest.fn().mockReturnValue({
        totalTokens: 75,
        requestCount: 1,
        estimatedCost: 0.0075,
      })

      ;(AIEnhancementService as jest.Mock).mockImplementation(() => ({
        enhanceIssue: mockEnhanceIssue,
        getUsageStats: mockGetUsageStats,
      }))

      const request = new NextRequest('http://localhost:3000/api/enhance', {
        method: 'POST',
        body: JSON.stringify({ formData: mockFormData }),
      })

      const response = await enhanceRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(AIEnhancementService).toHaveBeenCalledWith('sk-system-key')
      expect(userProfiles.updateUsageStats).not.toHaveBeenCalled()
      expect(data.enhancements).toBeDefined()
    })

    it('should return default enhancements when no API keys available', async () => {
      // Remove system API key
      delete process.env.OPENAI_API_KEY

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user789' }
      })

      ;(userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/enhance', {
        method: 'POST',
        body: JSON.stringify({ formData: mockFormData }),
      })

      const response = await enhanceRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(AIEnhancementService).not.toHaveBeenCalled()
      expect(data.enhancements).toBeDefined()
      expect(data.enhancements.acceptanceCriteria).toContain('The feature works as described in the requirements')
      expect(data.usage.totalTokens).toBe(0)
    })
  })

  describe('Title Generation with User-Specific Keys', () => {
    it('should use user-specific API key for title generation', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' }
      })

      ;(userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('sk-user-key')

      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    title: 'Generated Title',
                    alternatives: ['Alt 1', 'Alt 2'],
                  })
                }
              }],
              usage: {
                total_tokens: 50,
              }
            })
          }
        }
      }

      ;(AIEnhancementService as jest.Mock).mockImplementation(() => ({
        openai: mockOpenAI,
        usage: { totalTokens: 0, requestCount: 0, estimatedCost: 0 },
        getUsageStats: jest.fn().mockReturnValue({
          totalTokens: 50,
          requestCount: 1,
          estimatedCost: 0.001,
        })
      }))

      const request = new NextRequest('http://localhost:3000/api/generate-title', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Create a feature for dark mode toggle' }),
      })

      const response = await generateTitleRoute(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(AIEnhancementService).toHaveBeenCalledWith('sk-user-key')
      expect(data.title).toBe('Generated Title')
      expect(data.isGenerated).toBe(true)
      expect(userProfiles.updateUsageStats).toHaveBeenCalledWith('user123', 50, 0.001)
    })
  })

  describe('Usage Tracking', () => {
    it('should track usage across multiple requests for same user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123' }
      })

      ;(userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('sk-user-key')

      const mockEnhanceIssue = jest.fn().mockResolvedValue({
        acceptanceCriteria: ['Test'],
        edgeCases: ['Test'],
        technicalConsiderations: ['Test'],
        finalPrompt: 'Test',
      })

      let totalTokens = 0
      const mockGetUsageStats = jest.fn().mockImplementation(() => {
        totalTokens += 100
        return {
          totalTokens,
          requestCount: totalTokens / 100,
          estimatedCost: totalTokens * 0.0001,
        }
      })

      ;(AIEnhancementService as jest.Mock).mockImplementation(() => ({
        enhanceIssue: mockEnhanceIssue,
        getUsageStats: mockGetUsageStats,
      }))

      // First request
      const request1 = new NextRequest('http://localhost:3000/api/enhance', {
        method: 'POST',
        body: JSON.stringify({ formData: mockFormData }),
      })

      await enhanceRoute(request1)

      expect(userProfiles.updateUsageStats).toHaveBeenCalledWith('user123', 100, 0.01)

      // Second request
      const request2 = new NextRequest('http://localhost:3000/api/enhance', {
        method: 'POST',
        body: JSON.stringify({ formData: mockFormData }),
      })

      await enhanceRoute(request2)

      expect(userProfiles.updateUsageStats).toHaveBeenCalledWith('user123', 200, 0.02)
      expect(userProfiles.updateUsageStats).toHaveBeenCalledTimes(2)
    })

    it('should not track usage for unauthenticated users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const mockEnhanceIssue = jest.fn().mockResolvedValue({
        acceptanceCriteria: ['Test'],
        edgeCases: ['Test'],
        technicalConsiderations: ['Test'],
        finalPrompt: 'Test',
      })

      ;(AIEnhancementService as jest.Mock).mockImplementation(() => ({
        enhanceIssue: mockEnhanceIssue,
        getUsageStats: jest.fn().mockReturnValue({
          totalTokens: 100,
          requestCount: 1,
          estimatedCost: 0.01,
        })
      }))

      const request = new NextRequest('http://localhost:3000/api/enhance', {
        method: 'POST',
        body: JSON.stringify({ formData: mockFormData }),
      })

      await enhanceRoute(request)

      expect(userProfiles.updateUsageStats).not.toHaveBeenCalled()
    })
  })
})