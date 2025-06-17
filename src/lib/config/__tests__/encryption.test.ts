import { EncryptionConfig } from '@/lib/config/encryption'

describe('EncryptionConfig', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleLogSpy: jest.SpyInstance
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = EncryptionConfig.getInstance()
      const instance2 = EncryptionConfig.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('initialize', () => {
    it('should use environment key when valid', () => {
      const validKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      process.env.ENCRYPTION_KEY = validKey

      // @ts-expect-error accessing private constructor for testing
      const config = new EncryptionConfig()
      config.initialize()

      expect(config.getKey()).toBe(validKey)
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Encryption key loaded successfully')
    })

    it('should throw error for invalid key format', () => {
      process.env.ENCRYPTION_KEY = 'invalid-key'

      // @ts-expect-error accessing private constructor for testing
      const config = new EncryptionConfig()
      
      expect(() => config.initialize()).toThrow(
        'ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)'
      )
    })

    it('should throw error in production without key', () => {
      delete process.env.ENCRYPTION_KEY
      process.env.NODE_ENV = 'production'

      // @ts-expect-error accessing private constructor for testing
      const config = new EncryptionConfig()
      
      expect(() => config.initialize()).toThrow('ENCRYPTION_KEY must be set in production')
    })

    it('should use temporary key in development without key', () => {
      delete process.env.ENCRYPTION_KEY
      process.env.NODE_ENV = 'development'

      // @ts-expect-error accessing private constructor for testing
      const config = new EncryptionConfig()
      config.initialize()

      expect(consoleErrorSpy).toHaveBeenCalledWith('⚠️  ENCRYPTION_KEY is not set!')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️  Using temporary key for development - DO NOT use in production!'
      )
      expect(config.getKey()).toMatch(/^[a-f0-9]{64}$/i)
    })

    it('should not reinitialize if already initialized', () => {
      const validKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      process.env.ENCRYPTION_KEY = validKey

      // @ts-expect-error accessing private constructor for testing
      const config = new EncryptionConfig()
      config.initialize()
      consoleLogSpy.mockClear()
      
      config.initialize()
      
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })

  describe('getKey', () => {
    it('should initialize if not already initialized', () => {
      const validKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      process.env.ENCRYPTION_KEY = validKey

      // @ts-expect-error accessing private constructor for testing
      const config = new EncryptionConfig()
      const key = config.getKey()

      expect(key).toBe(validKey)
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Encryption key loaded successfully')
    })
  })

  describe('isUsingTemporaryKey', () => {
    it('should return false when ENCRYPTION_KEY is set', () => {
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

      // @ts-expect-error accessing private constructor for testing
      const config = new EncryptionConfig()
      expect(config.isUsingTemporaryKey()).toBe(false)
    })

    it('should return true in development without key', () => {
      delete process.env.ENCRYPTION_KEY
      process.env.NODE_ENV = 'development'

      // @ts-expect-error accessing private constructor for testing
      const config = new EncryptionConfig()
      expect(config.isUsingTemporaryKey()).toBe(true)
    })

    it('should return false in production (would throw before reaching this)', () => {
      delete process.env.ENCRYPTION_KEY
      process.env.NODE_ENV = 'production'

      // @ts-expect-error accessing private constructor for testing
      const config = new EncryptionConfig()
      expect(config.isUsingTemporaryKey()).toBe(false)
    })
  })
})