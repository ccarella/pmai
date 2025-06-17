import { userProfiles } from '@/lib/services/user-storage'
import { redis } from '@/lib/redis'

// Mock redis
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

describe('Skip Review Feature', () => {
  const mockRedis = redis as jest.Mocked<typeof redis>
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('updateSkipReview', () => {
    it('should save skipReview preference to user profile', async () => {
      const existingProfile = {
        id: mockUserId,
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
      mockRedis.get.mockResolvedValue(existingProfile)

      await userProfiles.updateSkipReview(mockUserId, true)

      expect(mockRedis.set).toHaveBeenCalledWith(
        `user:${mockUserId}`,
        expect.objectContaining({
          ...existingProfile,
          skipReview: true,
          updatedAt: expect.any(String)
        })
      )
    })
  })

  describe('getSkipReview', () => {
    it('should retrieve skipReview preference from user profile', async () => {
      mockRedis.get.mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        skipReview: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      })

      const result = await userProfiles.getSkipReview(mockUserId)
      
      expect(result).toBe(true)
    })

    it('should return false when skipReview is not set', async () => {
      mockRedis.get.mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      })

      const result = await userProfiles.getSkipReview(mockUserId)
      
      expect(result).toBe(false)
    })
  })
})