import { redis } from '@/lib/redis'
import crypto from 'crypto'
import { encryptionConfig } from '@/lib/config/encryption'

export interface UserProfile {
  id: string
  email: string
  name?: string
  image?: string
  openaiApiKey?: string // Encrypted
  openaiKeyAddedAt?: string
  usageStats?: {
    totalTokens: number
    totalCost: number
    lastUsed?: string
  }
  createdAt: string
  updatedAt: string
}

// Get encryption key lazily to avoid initialization during build
function getEncryptionKey(): string {
  return encryptionConfig.getKey()
}

// Simple encryption/decryption for API keys
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const encryptionKey = getEncryptionKey()
  const key = Buffer.from(encryptionKey.slice(0, 64), 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const encryptionKey = getEncryptionKey()
  const key = Buffer.from(encryptionKey.slice(0, 64), 'hex')
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift()!, 'hex')
  const encryptedText = textParts.join(':')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

export const userProfiles = {
  async get(userId: string): Promise<UserProfile | null> {
    const data = await redis.get(`user:${userId}`)
    return data as UserProfile | null
  },

  async set(userId: string, profile: UserProfile): Promise<void> {
    await redis.set(`user:${userId}`, profile)
  },

  async delete(userId: string): Promise<void> {
    await redis.del(`user:${userId}`)
  },

  async updateOpenAIKey(userId: string, apiKey: string): Promise<void> {
    let profile = await userProfiles.get(userId)
    
    if (!profile) {
      // Create a new profile if it doesn't exist
      profile = {
        id: userId,
        email: '', // Will be updated on next login
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    // Encrypt and store the API key
    profile.openaiApiKey = encrypt(apiKey)
    profile.openaiKeyAddedAt = new Date().toISOString()
    profile.updatedAt = new Date().toISOString()
    
    await userProfiles.set(userId, profile)
  },

  async removeOpenAIKey(userId: string): Promise<void> {
    const profile = await userProfiles.get(userId)
    if (profile) {
      delete profile.openaiApiKey
      delete profile.openaiKeyAddedAt
      profile.updatedAt = new Date().toISOString()
      await userProfiles.set(userId, profile)
    }
    await redis.hdel(`onboarding:${userId}`, 'completedAt')
  },

  async getOpenAIKey(userId: string): Promise<string | null> {
    const profile = await userProfiles.get(userId)
    if (profile?.openaiApiKey) {
      try {
        return decrypt(profile.openaiApiKey)
      } catch (error) {
        console.error('Failed to decrypt OpenAI API key:', error)
        return null
      }
    }
    return null
  },

  async updateUsageStats(
    userId: string, 
    tokens: number, 
    cost: number
  ): Promise<void> {
    const profile = await userProfiles.get(userId)
    if (profile) {
      if (!profile.usageStats) {
        profile.usageStats = {
          totalTokens: 0,
          totalCost: 0
        }
      }
      
      profile.usageStats.totalTokens += tokens
      profile.usageStats.totalCost += cost
      profile.usageStats.lastUsed = new Date().toISOString()
      profile.updatedAt = new Date().toISOString()
      
      await userProfiles.set(userId, profile)
    }
  },

  async createOrUpdate(userId: string, data: Partial<UserProfile>): Promise<void> {
    let profile = await userProfiles.get(userId)
    
    if (!profile) {
      profile = {
        id: userId,
        email: data.email || '',
        name: data.name,
        image: data.image,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } else {
      // Update existing profile
      profile = {
        ...profile,
        ...data,
        id: userId, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      }
    }
    
    await userProfiles.set(userId, profile)
  }
}