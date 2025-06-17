'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Switch } from '@/components/ui/Switch'
import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animations/variants'
import Link from 'next/link'
import { useOnboarding } from '@/components/providers/OnboardingProvider'
import { getOnboardingSteps } from '@/lib/services/onboarding'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const { status: onboardingStatus, isComplete: isOnboardingComplete } = useOnboarding()
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [githubConfigured, setGithubConfigured] = useState(true)
  const [skipReview, setSkipReview] = useState(false)
  const [skipReviewLoading, setSkipReviewLoading] = useState(false)

  useEffect(() => {
    // Check GitHub configuration status
    checkGitHubConfig()
    
    // Fetch selected repository if user is signed in
    if (session?.user?.id) {
      fetchSelectedRepo()
      fetchSkipReviewSetting()
    }
  }, [session])

  const checkGitHubConfig = async () => {
    try {
      const response = await fetch('/api/github/repositories')
      if (response.status === 503) {
        setGithubConfigured(false)
      }
    } catch (error) {
      console.error('Error checking GitHub config:', error)
    }
  }

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

  const fetchSkipReviewSetting = async () => {
    try {
      const response = await fetch('/api/user/skip-review')
      if (response.ok) {
        const data = await response.json()
        setSkipReview(data.skipReview)
      }
    } catch (error) {
      console.error('Error fetching skip review setting:', error)
    }
  }

  const handleSkipReviewToggle = async (checked: boolean) => {
    setSkipReviewLoading(true)
    try {
      const response = await fetch('/api/user/skip-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skipReview: checked }),
      })
      
      if (response.ok) {
        setSkipReview(checked)
      } else {
        console.error('Failed to update skip review setting')
      }
    } catch (error) {
      console.error('Error updating skip review setting:', error)
    } finally {
      setSkipReviewLoading(false)
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="w-full max-w-2xl space-y-6 sm:space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Settings</h1>
          <p className="text-sm sm:text-base text-muted px-2">Connect your GitHub account to publish issues directly</p>
        </div>

        {onboardingStatus && !isOnboardingComplete && !onboardingStatus.completedAt && !onboardingStatus.skippedAt && (
          <Card className="p-4 sm:p-6 bg-accent/10 border-accent/30">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Complete Your Setup</h2>
              <p className="text-sm text-muted">
                You&apos;re almost ready! Complete these steps to start creating AI-powered GitHub issues:
              </p>
              <div className="space-y-2">
                {onboardingStatus && getOnboardingSteps(onboardingStatus).map((step) => (
                  <div key={step.id} className="flex items-center gap-3 text-sm">
                    {step.completed ? (
                      <svg className="w-5 h-5 text-success flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
                    )}
                    <span className={step.completed ? 'text-success' : 'text-muted'}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/onboarding">
                <Button variant="primary" size="sm" className="mt-2">
                  Continue Setup
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Appearance</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted">Choose your preferred theme</p>
              <ThemeToggle />
            </div>
          </div>
        </Card>

        {session && (
          <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Issue Creation</h2>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label htmlFor="skip-review" className="text-sm sm:text-base text-foreground font-medium">
                    Skip Review
                  </label>
                  <p className="text-sm text-muted">
                    Directly publish issues to GitHub without the review step
                  </p>
                </div>
                <Switch
                  id="skip-review"
                  checked={skipReview}
                  onCheckedChange={handleSkipReviewToggle}
                  disabled={skipReviewLoading || !session}
                />
              </div>
            </div>
          </Card>
        )}

        {session && (
          <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">OpenAI Configuration</h2>
              <p className="text-sm sm:text-base text-muted">
                Configure your personal OpenAI API key for AI-enhanced features
              </p>
              <Link href="/settings/openai">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Manage OpenAI Settings
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">GitHub Connection</h2>
            
            {!githubConfigured ? (
              <div className="space-y-4">
                <div className="p-3 sm:p-4 bg-warning/10 border border-warning/30 rounded-md">
                  <p className="text-warning font-medium">GitHub integration not configured</p>
                  <p className="text-sm text-warning/80 mt-1">
                    The application owner needs to set up GitHub OAuth credentials in the environment variables.
                  </p>
                </div>
                <Link href="/">
                  <Button variant="secondary">
                    Back to Home
                  </Button>
                </Link>
              </div>
            ) : status === 'loading' ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : session ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-card-hover rounded-lg gap-3">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {session.user?.image && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={session.user.image}
                          alt={session.user.name || 'GitHub avatar'}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                        />
                      </>
                    )}
                    <div>
                      <p className="font-medium text-sm sm:text-base text-foreground">{session.user?.name}</p>
                      <p className="text-xs sm:text-sm text-muted break-all">{session.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <span className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-success">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Connected</span>
                    </span>
                  </div>
                </div>

                {selectedRepo && (
                  <div className="p-3 sm:p-4 bg-card-hover rounded-lg">
                    <p className="text-xs sm:text-sm text-muted mb-1">Selected Repository</p>
                    <p className="font-medium text-sm sm:text-base text-foreground break-all">{selectedRepo}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Link href="/settings/github" className="w-full sm:w-auto">
                      <Button variant="secondary" className="w-full sm:w-auto">
                        Manage Repositories
                      </Button>
                    </Link>
                    <Link href="/debug/github-auth" className="w-full sm:w-auto">
                      <Button variant="ghost" size="sm" className="w-full sm:w-auto min-h-[44px]">
                        Debug Auth
                      </Button>
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    loading={loading}
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm sm:text-base text-muted">
                  Connect your GitHub account to publish issues directly to your repositories.
                </p>
                <Button
                  onClick={handleSignIn}
                  loading={loading}
                  className="w-full min-h-[44px]"
                >
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  Connect with GitHub
                </Button>
              </div>
            )}
          </div>
        </Card>

        {session && (
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Account</h2>
              <p className="text-sm sm:text-base text-muted">
                Sign out from your account
              </p>
              <Button
                variant="secondary"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full sm:w-auto"
              >
                Sign Out
              </Button>
            </div>
          </Card>
        )}

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