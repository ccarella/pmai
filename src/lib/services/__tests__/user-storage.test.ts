import { userProfiles } from '@/lib/services/user-storage'
import { redis } from '@/lib/redis'
import { encryptionConfig } from '@/lib/config/encryption'

// Mock redis
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    hdel: jest.fn(),
  },
}))

// Mock encryption config
jest.mock('@/lib/config/encryption', () => ({
  encryptionConfig: {
    initialize: jest.fn(),
    getKey: jest.fn(() => '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
    isUsingTemporaryKey: jest.fn(() => false),
  },
}))

describe('userProfiles', () => {
  const mockUserId = 'test-user-123'
  const mockApiKey = 'sk-test-api-key-123'
  const mockProfile = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('encryption configuration', () => {
    it('should initialize encryption config on module load', () => {
      expect(encryptionConfig.initialize).toHaveBeenCalled()
    })

    it('should use the encryption key from config', () => {
      expect(encryptionConfig.getKey).toHaveBeenCalled()
    })
  })

  describe('get', () => {
    it('should retrieve user profile from redis', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(mockProfile)

      const result = await userProfiles.get(mockUserId)

      expect(redis.get).toHaveBeenCalledWith(`user:${mockUserId}`)
      expect(result).toEqual(mockProfile)
    })

    it('should return null if profile does not exist', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      const result = await userProfiles.get(mockUserId)

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('should save user profile to redis', async () => {
      await userProfiles.set(mockUserId, mockProfile)

      expect(redis.set).toHaveBeenCalledWith(`user:${mockUserId}`, mockProfile)
    })
  })

  describe('delete', () => {
    it('should delete user profile from redis', async () => {
      await userProfiles.delete(mockUserId)

      expect(redis.del).toHaveBeenCalledWith(`user:${mockUserId}`)
    })
  })

  describe('updateOpenAIKey', () => {
    it('should encrypt and store API key for existing user', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(mockProfile)

      await userProfiles.updateOpenAIKey(mockUserId, mockApiKey)

      expect(redis.get).toHaveBeenCalledWith(`user:${mockUserId}`)
      expect(redis.set).toHaveBeenCalledWith(
        `user:${mockUserId}`,
        expect.objectContaining({
          ...mockProfile,
          openaiApiKey: expect.stringMatching(/^[a-f0-9]+:[a-f0-9]+$/), // IV:encrypted format
          openaiKeyAddedAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      )
    })

    it('should create new profile if user does not exist', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      await userProfiles.updateOpenAIKey(mockUserId, mockApiKey)

      expect(redis.set).toHaveBeenCalledWith(
        `user:${mockUserId}`,
        expect.objectContaining({
          id: mockUserId,
          email: '',
          openaiApiKey: expect.stringMatching(/^[a-f0-9]+:[a-f0-9]+$/),
          openaiKeyAddedAt: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      )
    })
  })

  describe('removeOpenAIKey', () => {
    it('should remove API key from existing profile', async () => {
      const profileWithKey = {
        ...mockProfile,
        openaiApiKey: 'encrypted-key',
        openaiKeyAddedAt: '2024-01-01T00:00:00Z',
      }
      ;(redis.get as jest.Mock).mockResolvedValue(profileWithKey)

      await userProfiles.removeOpenAIKey(mockUserId)

      expect(redis.set).toHaveBeenCalledWith(
        `user:${mockUserId}`,
        expect.objectContaining({
          ...mockProfile,
          updatedAt: expect.any(String),
        })
      )
      
      const savedProfile = (redis.set as jest.Mock).mock.calls[0][1]
      expect(savedProfile.openaiApiKey).toBeUndefined()
      expect(savedProfile.openaiKeyAddedAt).toBeUndefined()
    })

    it('should do nothing if profile does not exist', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      await userProfiles.removeOpenAIKey(mockUserId)

      expect(redis.set).not.toHaveBeenCalled()
    })
  })

  describe('getOpenAIKey', () => {
    it('should decrypt and return API key', async () => {
      // Create a real encrypted key using the mock encryption key
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto')
      const algorithm = 'aes-256-cbc'
      const key = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex')
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv(algorithm, key, iv)
      let encrypted = cipher.update(mockApiKey, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      const encryptedKey = iv.toString('hex') + ':' + encrypted

      const profileWithKey = {
        ...mockProfile,
        openaiApiKey: encryptedKey,
      }
      ;(redis.get as jest.Mock).mockResolvedValue(profileWithKey)

      const result = await userProfiles.getOpenAIKey(mockUserId)

      expect(result).toBe(mockApiKey)
    })

    it('should return null if no API key exists', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(mockProfile)

      const result = await userProfiles.getOpenAIKey(mockUserId)

      expect(result).toBeNull()
    })

    it('should return null if decryption fails', async () => {
      const profileWithKey = {
        ...mockProfile,
        openaiApiKey: 'invalid-encrypted-data',
      }
      ;(redis.get as jest.Mock).mockResolvedValue(profileWithKey)

      const result = await userProfiles.getOpenAIKey(mockUserId)

      expect(result).toBeNull()
    })
  })

  describe('updateUsageStats', () => {
    it('should update usage statistics for existing user', async () => {
      const profileWithStats = {
        ...mockProfile,
        usageStats: {
          totalTokens: 100,
          totalCost: 0.01,
          lastUsed: '2024-01-01T00:00:00Z',
        },
      }
      ;(redis.get as jest.Mock).mockResolvedValue(profileWithStats)

      await userProfiles.updateUsageStats(mockUserId, 50, 0.005)

      expect(redis.set).toHaveBeenCalledWith(
        `user:${mockUserId}`,
        expect.objectContaining({
          ...profileWithStats,
          usageStats: {
            totalTokens: 150,
            totalCost: 0.015,
            lastUsed: expect.any(String),
          },
          updatedAt: expect.any(String),
        })
      )
    })

    it('should initialize usage stats if not present', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(mockProfile)

      await userProfiles.updateUsageStats(mockUserId, 50, 0.005)

      expect(redis.set).toHaveBeenCalledWith(
        `user:${mockUserId}`,
        expect.objectContaining({
          ...mockProfile,
          usageStats: {
            totalTokens: 50,
            totalCost: 0.005,
            lastUsed: expect.any(String),
          },
          updatedAt: expect.any(String),
        })
      )
    })
  })

  describe('createOrUpdate', () => {
    it('should create new profile if not exists', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(null)

      const newData = {
        email: 'new@example.com',
        name: 'New User',
      }

      await userProfiles.createOrUpdate(mockUserId, newData)

      expect(redis.set).toHaveBeenCalledWith(
        `user:${mockUserId}`,
        expect.objectContaining({
          id: mockUserId,
          ...newData,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      )
    })

    it('should update existing profile', async () => {
      ;(redis.get as jest.Mock).mockResolvedValue(mockProfile)

      const updates = {
        name: 'Updated Name',
        image: 'https://example.com/avatar.jpg',
      }

      await userProfiles.createOrUpdate(mockUserId, updates)

      expect(redis.set).toHaveBeenCalledWith(
        `user:${mockUserId}`,
        expect.objectContaining({
          ...mockProfile,
          ...updates,
          id: mockUserId, // Should not change
          updatedAt: expect.any(String),
        })
      )
    })
  })
})