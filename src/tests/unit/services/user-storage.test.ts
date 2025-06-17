import { userProfiles } from '@/lib/services/user-storage'
import { redis } from '@/lib/redis'

// Mock redis
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    hdel: jest.fn(),
  }
}))

// Mock crypto for consistent encryption
jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto')
  return {
    ...actual,
    randomBytes: jest.fn(() => Buffer.from('test-iv-1234567890123456', 'hex')),
    createCipheriv: jest.fn(() => ({
      update: jest.fn(() => 'encrypted-part1'),
      final: jest.fn(() => 'encrypted-part2'),
    })),
    createDecipheriv: jest.fn(() => ({
      update: jest.fn(() => 'sk-test123'),
      final: jest.fn(() => ''),
    })),
  }
})

describe('UserProfiles Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('get', () => {
    it('should retrieve user profile from Redis', async () => {
      const mockProfile = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      ;(redis.get as jest.Mock).mockResolvedValue(mockProfile)

      const result = await userProfiles.get('user123')

      expect(redis.get).toHaveBeenCalledWith('user:user123')
      expect(result).toEqual(mockProfile)
    })

    it('should return null if user not found', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      const result = await userProfiles.get('nonexistent')

      expect(redis.get).toHaveBeenCalledWith('user:nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should store user profile in Redis', async () => {
      const profile = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      await userProfiles.set('user123', profile)

      expect(redis.set).toHaveBeenCalledWith('user:user123', profile)
    })
  })

  describe('updateOpenAIKey', () => {
    it('should encrypt and store API key for existing user', async () => {
      const existingProfile = {
        id: 'user123',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      ;(redis.get as jest.Mock).mockResolvedValue(existingProfile)

      await userProfiles.updateOpenAIKey('user123', 'sk-test123')

      expect(redis.get).toHaveBeenCalledWith('user:user123')
      expect(redis.set).toHaveBeenCalledWith(
        'user:user123',
        expect.objectContaining({
          id: 'user123',
          email: 'test@example.com',
          openaiApiKey: expect.stringContaining('encrypted'),
          openaiKeyAddedAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      )
    })

    it('should create new profile if user does not exist', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      await userProfiles.updateOpenAIKey('newuser', 'sk-test123')

      expect(redis.set).toHaveBeenCalledWith(
        'user:newuser',
        expect.objectContaining({
          id: 'newuser',
          email: '',
          openaiApiKey: expect.stringContaining('encrypted'),
          openaiKeyAddedAt: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      )
    })
  })

  describe('removeOpenAIKey', () => {
    it('should remove API key from user profile', async () => {
      const profile = {
        id: 'user123',
        email: 'test@example.com',
        openaiApiKey: 'encrypted-key',
        openaiKeyAddedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      ;(redis.get as jest.Mock).mockResolvedValue(profile)

      await userProfiles.removeOpenAIKey('user123')

      expect(redis.set).toHaveBeenCalledWith(
        'user:user123',
        expect.objectContaining({
          id: 'user123',
          email: 'test@example.com',
          updatedAt: expect.any(String),
        })
      )

      const setCall = (redis.set as jest.Mock).mock.calls[0][1]
      expect(setCall.openaiApiKey).toBeUndefined()
      expect(setCall.openaiKeyAddedAt).toBeUndefined()
      expect(redis.hdel).toHaveBeenCalledWith('onboarding:user123', 'completedAt')
    })
  })

  describe('getOpenAIKey', () => {
    it('should decrypt and return API key', async () => {
      const profile = {
        id: 'user123',
        openaiApiKey: 'test-iv-1234567890123456:encrypted-data',
      }

      ;(redis.get as jest.Mock).mockResolvedValue(profile)

      const result = await userProfiles.getOpenAIKey('user123')

      expect(result).toBe('sk-test123')
    })

    it('should return null if no API key exists', async () => {
      const profile = {
        id: 'user123',
        email: 'test@example.com',
      }

      ;(redis.get as jest.Mock).mockResolvedValue(profile)

      const result = await userProfiles.getOpenAIKey('user123')

      expect(result).toBeNull()
    })

    it('should return null if user does not exist', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      const result = await userProfiles.getOpenAIKey('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('updateUsageStats', () => {
    it('should update usage statistics', async () => {
      const profile = {
        id: 'user123',
        email: 'test@example.com',
        usageStats: {
          totalTokens: 1000,
          totalCost: 0.5,
          lastUsed: '2024-01-01T00:00:00Z',
        },
      }

      ;(redis.get as jest.Mock).mockResolvedValue(profile)

      await userProfiles.updateUsageStats('user123', 500, 0.25)

      expect(redis.set).toHaveBeenCalledWith(
        'user:user123',
        expect.objectContaining({
          usageStats: {
            totalTokens: 1500,
            totalCost: 0.75,
            lastUsed: expect.any(String),
          },
        })
      )
    })

    it('should initialize usage stats if not present', async () => {
      const profile = {
        id: 'user123',
        email: 'test@example.com',
      }

      ;(redis.get as jest.Mock).mockResolvedValue(profile)

      await userProfiles.updateUsageStats('user123', 100, 0.05)

      expect(redis.set).toHaveBeenCalledWith(
        'user:user123',
        expect.objectContaining({
          usageStats: {
            totalTokens: 100,
            totalCost: 0.05,
            lastUsed: expect.any(String),
          },
        })
      )
    })
  })

  describe('createOrUpdate', () => {
    it('should create new profile if not exists', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      await userProfiles.createOrUpdate('newuser', {
        email: 'new@example.com',
        name: 'New User',
        image: 'https://example.com/avatar.jpg',
      })

      expect(redis.set).toHaveBeenCalledWith(
        'user:newuser',
        expect.objectContaining({
          id: 'newuser',
          email: 'new@example.com',
          name: 'New User',
          image: 'https://example.com/avatar.jpg',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      )
    })

    it('should update existing profile', async () => {
      const existingProfile = {
        id: 'user123',
        email: 'old@example.com',
        name: 'Old Name',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      ;(redis.get as jest.Mock).mockResolvedValue(existingProfile)

      await userProfiles.createOrUpdate('user123', {
        name: 'New Name',
        image: 'https://example.com/new-avatar.jpg',
      })

      expect(redis.set).toHaveBeenCalledWith(
        'user:user123',
        expect.objectContaining({
          id: 'user123',
          email: 'old@example.com',
          name: 'New Name',
          image: 'https://example.com/new-avatar.jpg',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: expect.any(String),
        })
      )
    })
  })
})