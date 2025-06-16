'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import GitHubTroubleshooting from './troubleshooting'

interface DebugInfo {
  session: {
    exists: boolean
    user: {
      id: string
      name: string | null | undefined
      email: string | null | undefined
    } | null
  }
  connection: {
    exists: boolean
    hasAccessToken: boolean
  }
  scopes: {
    requested: string[]
    granted: string[]
    error?: string
  }
  privateRepoAccess: {
    tested: boolean
    success: boolean
    repoCount: number
    error: string | null
  }
  rateLimit?: {
    limit: number
    remaining: number
    reset: string
    error?: string
  }
  error?: string
}

export default function GitHubAuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  const fetchDebugInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/debug/github-auth')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setDebugInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch debug info')
    } finally {
      setLoading(false)
    }
  }

  const hasRepoScope = debugInfo?.scopes.granted.includes('repo')

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">GitHub Auth Debug</h1>
          <p className="text-muted">Diagnose GitHub authentication and scope issues</p>
        </div>

        {loading && (
          <Card className="p-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-6 border-error">
            <p className="text-error">Error: {error}</p>
          </Card>
        )}

        {debugInfo && (
          <div className="space-y-6">
            {/* Session Info */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Session Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Session exists:</span>
                  <span className={debugInfo.session.exists ? 'text-success' : 'text-error'}>
                    {debugInfo.session.exists ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                {debugInfo.session.user && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted">User ID:</span>
                      <span className="text-foreground font-mono text-sm">{debugInfo.session.user.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Name:</span>
                      <span className="text-foreground">{debugInfo.session.user.name}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Connection Info */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">GitHub Connection</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Connection exists:</span>
                  <span className={debugInfo.connection.exists ? 'text-success' : 'text-error'}>
                    {debugInfo.connection.exists ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Has access token:</span>
                  <span className={debugInfo.connection.hasAccessToken ? 'text-success' : 'text-error'}>
                    {debugInfo.connection.hasAccessToken ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>
            </Card>

            {/* OAuth Scopes */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">OAuth Scopes</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-muted mb-2">Requested scopes:</p>
                  <div className="flex flex-wrap gap-2">
                    {debugInfo.scopes.requested.map((scope) => (
                      <span key={scope} className="px-2 py-1 bg-card-hover rounded text-sm font-mono">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted mb-2">Granted scopes:</p>
                  <div className="flex flex-wrap gap-2">
                    {debugInfo.scopes.granted.length > 0 ? (
                      debugInfo.scopes.granted.map((scope) => (
                        <span
                          key={scope}
                          className={`px-2 py-1 rounded text-sm font-mono ${
                            scope === 'repo' ? 'bg-success/20 text-success' : 'bg-card-hover'
                          }`}
                        >
                          {scope}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">No scopes found</span>
                    )}
                  </div>
                  {debugInfo.scopes.error && (
                    <p className="text-error text-sm mt-2">{debugInfo.scopes.error}</p>
                  )}
                </div>
                <div className="mt-4 p-4 bg-card-hover rounded">
                  <p className="text-sm">
                    <span className="font-semibold">repo scope status:</span>{' '}
                    {hasRepoScope ? (
                      <span className="text-success">✓ Granted - You should see private repos</span>
                    ) : (
                      <span className="text-error">✗ Missing - This is why you can&apos;t see private repos!</span>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            {/* Private Repo Access Test */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Private Repository Access Test</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted">Test performed:</span>
                  <span className={debugInfo.privateRepoAccess.tested ? 'text-success' : 'text-error'}>
                    {debugInfo.privateRepoAccess.tested ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Access successful:</span>
                  <span className={debugInfo.privateRepoAccess.success ? 'text-success' : 'text-error'}>
                    {debugInfo.privateRepoAccess.success ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Private repos found:</span>
                  <span className="text-foreground font-semibold">{debugInfo.privateRepoAccess.repoCount}</span>
                </div>
                {debugInfo.privateRepoAccess.error && (
                  <p className="text-error text-sm mt-2">{debugInfo.privateRepoAccess.error}</p>
                )}
              </div>
            </Card>

            {/* Rate Limit */}
            {debugInfo.rateLimit && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">API Rate Limit</h2>
                <div className="space-y-2">
                  {debugInfo.rateLimit.error ? (
                    <p className="text-error">{debugInfo.rateLimit.error}</p>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted">Limit:</span>
                        <span className="text-foreground">{debugInfo.rateLimit.limit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Remaining:</span>
                        <span className="text-foreground">{debugInfo.rateLimit.remaining}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Resets at:</span>
                        <span className="text-foreground text-sm">
                          {new Date(debugInfo.rateLimit.reset).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}

            {/* Actions */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex gap-4">
                  <Button onClick={fetchDebugInfo} variant="secondary">
                    Refresh Debug Info
                  </Button>
                  {!hasRepoScope && (
                    <Link href="/settings">
                      <Button>Re-authenticate with GitHub</Button>
                    </Link>
                  )}
                </div>
                <Link href="/settings">
                  <Button variant="ghost">Back to Settings</Button>
                </Link>
              </div>
            </Card>

            {/* Troubleshooting Guide - Show when no repo scope */}
            {!hasRepoScope && <GitHubTroubleshooting />}

            {/* Raw Data */}
            <details className="cursor-pointer">
              <summary className="text-muted hover:text-foreground">View raw debug data</summary>
              <Card className="p-4 mt-2">
                <pre className="text-xs overflow-auto text-muted">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </Card>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}