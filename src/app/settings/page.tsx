'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animations/variants'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch selected repository if user is signed in
    if (session?.user?.id) {
      fetchSelectedRepo()
    }
  }, [session])

  const fetchSelectedRepo = async () => {
    try {
      const response = await fetch('/api/github/selected-repo')
      if (response.ok) {
        const data = await response.json()
        setSelectedRepo(data.selectedRepo)
      }
    } catch (error) {
      console.error('Error fetching selected repo:', error)
    }
  }

  const handleSignIn = () => {
    setLoading(true)
    signIn('github')
  }

  const handleSignOut = () => {
    setLoading(true)
    signOut({ callbackUrl: '/settings' })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="w-full max-w-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Settings</h1>
          <p className="text-muted">Connect your GitHub account to publish issues directly</p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">GitHub Connection</h2>
            
            {status === 'loading' ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : session ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-card-hover rounded-lg">
                  <div className="flex items-center space-x-4">
                    {session.user?.image && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={session.user.image}
                          alt={session.user.name || 'GitHub avatar'}
                          className="w-10 h-10 rounded-full"
                        />
                      </>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{session.user?.name}</p>
                      <p className="text-sm text-muted">{session.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-2 text-sm text-success">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Connected</span>
                    </span>
                  </div>
                </div>

                {selectedRepo && (
                  <div className="p-4 bg-card-hover rounded-lg">
                    <p className="text-sm text-muted mb-1">Selected Repository</p>
                    <p className="font-medium text-foreground">{selectedRepo}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Link href="/settings/github">
                    <Button variant="secondary">
                      Manage Repositories
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    loading={loading}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted">
                  Connect your GitHub account to publish issues directly to your repositories.
                </p>
                <Button
                  onClick={handleSignIn}
                  loading={loading}
                  className="w-full"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  Connect with GitHub
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost">
              Back to Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}