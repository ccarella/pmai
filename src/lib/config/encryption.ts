import crypto from 'crypto'

export class EncryptionConfig {
  private static instance: EncryptionConfig
  private encryptionKey: string
  private isInitialized = false
  private isBuildPhase = false

  private constructor() {
    this.encryptionKey = ''
    // Detect if we're in the build phase
    this.isBuildPhase = process.env.NODE_ENV === 'production' && 
                       typeof window === 'undefined' && 
                       !process.env.ENCRYPTION_KEY
  }

  static getInstance(): EncryptionConfig {
    if (!EncryptionConfig.instance) {
      EncryptionConfig.instance = new EncryptionConfig()
    }
    return EncryptionConfig.instance
  }

  initialize(): void {
    if (this.isInitialized) return

    const key = process.env.ENCRYPTION_KEY

    if (!key) {
      // During build phase, use a placeholder key
      if (this.isBuildPhase) {
        console.warn('⚠️  Using placeholder key during build phase')
        this.encryptionKey = '0'.repeat(64) // Valid format placeholder
        this.isInitialized = true
        return
      }
      
      console.error('⚠️  ENCRYPTION_KEY is not set!')
      console.error('Run "npm run generate-key" to generate a secure encryption key.')
      console.error('Then add it to your .env.local file or environment variables.')
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY must be set in production')
      } else {
        console.warn('⚠️  Using temporary key for development - DO NOT use in production!')
        this.encryptionKey = crypto.randomBytes(32).toString('hex')
      }
    } else if (!/^[a-f0-9]{64}$/i.test(key)) {
      throw new Error(
        'ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes). ' +
        'Use "npm run generate-key" to generate a valid key.'
      )
    } else {
      this.encryptionKey = key
      if (!this.isBuildPhase) {
        console.log('✅ Encryption key loaded successfully')
      }
    }

    this.isInitialized = true
  }

  getKey(): string {
    if (!this.isInitialized) {
      this.initialize()
    }
    return this.encryptionKey
  }

  isUsingTemporaryKey(): boolean {
    return !process.env.ENCRYPTION_KEY && process.env.NODE_ENV !== 'production'
  }
}

export const encryptionConfig = EncryptionConfig.getInstance()