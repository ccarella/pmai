'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animations/variants'
import Link from 'next/link'

interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  updated_at: string
}

export default function GitHubRepositoriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/settings')
      return
    }
    fetchRepositories()
  }, [session, status, router])

  const fetchRepositories = async () => {
    try {
      const response = await fetch('/api/github/repositories')
      if (response.ok) {
        const data = await response.json()
        setRepositories(data.repositories)
        setSelectedRepo(data.selectedRepo)
      }
    } catch (error) {
      console.error('Error fetching repositories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRepo = async (repoFullName: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/github/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedRepo: repoFullName }),
      })
      
      if (response.ok) {
        setSelectedRepo(repoFullName)
      }
    } catch (error) {
      console.error('Error saving repository:', error)
    } finally {
      setSaving(false)
    }
  }

  const filteredRepos = repositories.filter(repo =>
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Select Repository</h1>
          <p className="text-muted">Choose where to publish your GitHub issues</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-card-bg border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          <div className="grid gap-4">
            {filteredRepos.map((repo) => (
              <Card
                key={repo.id}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedRepo === repo.full_name
                    ? 'border-primary bg-primary/10'
                    : 'hover:border-card-hover'
                }`}
                onClick={() => handleSelectRepo(repo.full_name)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-foreground">{repo.name}</h3>
                      {repo.private && (
                        <span className="text-xs px-2 py-0.5 bg-muted/20 text-muted rounded">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">{repo.full_name}</p>
                    {repo.description && (
                      <p className="text-sm text-muted mt-2">{repo.description}</p>
                    )}
                    <p className="text-xs text-muted">
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedRepo === repo.full_name && (
                    <svg className="w-5 h-5 text-primary mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {filteredRepos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted">No repositories found</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Link href="/settings">
            <Button variant="ghost">
              Back to Settings
            </Button>
          </Link>
          {selectedRepo && (
            <Button
              onClick={() => router.push('/')}
              loading={saving}
            >
              Continue to Create Issue
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}