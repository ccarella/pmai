'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animations/variants'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OpenAISettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [usageStats, setUsageStats] = useState<{
    totalTokens: number
    totalCost: number
    lastUsed?: string
  } | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchApiKeyStatus()
      fetchUsageStats()
    } else if (status === 'unauthenticated') {
      router.push('/settings')
    }
  }, [session, status, router])

  const fetchApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/user/openai-key/status')
      if (response.ok) {
        const data = await response.json()
        setHasApiKey(data.hasApiKey)
      }
    } catch {
      console.error('Error fetching API key status')
    }
  }

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/user/usage-stats')
      if (response.ok) {
        const data = await response.json()
        setUsageStats(data.usageStats)
      }
    } catch {
      console.error('Error fetching usage stats')
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'API key saved successfully' })
        setApiKey('')
        setHasApiKey(true)
        setShowKey(false)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save API key' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while saving the API key' })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveApiKey = async () => {
    if (!confirm('Are you sure you want to remove your OpenAI API key?')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/openai-key', {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'API key removed successfully' })
        setHasApiKey(false)
        setApiKey('')
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to remove API key' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while removing the API key' })
    } finally {
      setLoading(false)
    }
  }

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/openai-key/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'API key is valid' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Invalid API key' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to validate API key' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="w-full max-w-2xl space-y-6 sm:space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">OpenAI Settings</h1>
          <p className="text-sm sm:text-base text-muted px-2">
            Manage your personal OpenAI API key for AI-enhanced features
          </p>
        </div>

        <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">API Key Management</h2>
            
            {message && (
              <div className={`p-3 sm:p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-success/10 border border-success/30 text-success' 
                  : 'bg-danger/10 border border-danger/30 text-danger'
              }`}>
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            {hasApiKey ? (
              <div className="space-y-4">
                <div className="p-3 sm:p-4 bg-card-hover rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm sm:text-base text-foreground">API Key Configured</p>
                      <p className="text-xs sm:text-sm text-muted mt-1">
                        Your OpenAI API key is securely stored and encrypted
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center space-x-1 text-xs sm:text-sm text-success">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Active</span>
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleRemoveApiKey}
                  loading={loading}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                >
                  Remove API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="apiKey" className="block text-sm font-medium text-foreground">
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input
                      id="apiKey"
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                      {showKey ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted">
                    Get your API key from{' '}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleSaveApiKey}
                    loading={loading}
                    disabled={!apiKey.trim()}
                    className="w-full sm:w-auto"
                  >
                    Save API Key
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={validateApiKey}
                    loading={loading}
                    disabled={!apiKey.trim()}
                    className="w-full sm:w-auto"
                  >
                    Validate Key
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {usageStats && (usageStats.totalTokens > 0 || usageStats.totalCost > 0) && (
          <Card className="p-4 sm:p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Usage Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-card-hover rounded-lg">
                <p className="text-sm text-muted">Total Tokens</p>
                <p className="text-2xl font-bold text-foreground">
                  {usageStats.totalTokens.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-card-hover rounded-lg">
                <p className="text-sm text-muted">Total Cost</p>
                <p className="text-2xl font-bold text-foreground">
                  ${usageStats.totalCost.toFixed(4)}
                </p>
              </div>
            </div>
            {usageStats.lastUsed && (
              <p className="text-sm text-muted">
                Last used: {new Date(usageStats.lastUsed).toLocaleString()}
              </p>
            )}
          </Card>
        )}

        <div className="text-center space-y-2">
          <Link href="/settings">
            <Button variant="ghost">
              Back to Settings
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}