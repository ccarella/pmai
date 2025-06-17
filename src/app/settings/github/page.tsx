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
  const [addedRepos, setAddedRepos] = useState<string[]>([])
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
      // Fetch all repositories
      const reposResponse = await fetch('/api/github/repositories')
      if (reposResponse.ok) {
        const reposData = await reposResponse.json()
        setRepositories(reposData.repositories)
        setSelectedRepo(reposData.selectedRepo)
      }

      // Fetch added repositories
      const addedResponse = await fetch('/api/github/added-repos')
      if (addedResponse.ok) {
        const addedData = await addedResponse.json()
        setAddedRepos(addedData.repositories.map((r: Repository) => r.full_name))
      }
    } catch (error) {
      console.error('Error fetching repositories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRepo = async (repoFullName: string) => {
    setSaving(true)
    try {
      // Add repository to the list
      const addResponse = await fetch('/api/github/added-repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', repoFullName }),
      })

      if (addResponse.ok) {
        setAddedRepos([...addedRepos, repoFullName])
        
        // If this is the first repo being added, also select it
        if (addedRepos.length === 0) {
          const selectResponse = await fetch('/api/github/repositories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedRepo: repoFullName }),
          })
          if (selectResponse.ok) {
            setSelectedRepo(repoFullName)
          }
        }
      }
    } catch (error) {
      console.error('Error adding repository:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveRepo = async (repoFullName: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/github/added-repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', repoFullName }),
      })
      
      if (response.ok) {
        setAddedRepos(addedRepos.filter(r => r !== repoFullName))
        if (selectedRepo === repoFullName) {
          setSelectedRepo(null)
        }
      }
    } catch (error) {
      console.error('Error removing repository:', error)
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
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        className="max-w-4xl mx-auto space-y-6 sm:space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Manage Repositories</h1>
          <p className="text-sm sm:text-base text-muted">Add repositories to your quick access list</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-card-bg border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base min-h-[44px]"
          />

          <div className="grid gap-4">
            {filteredRepos.map((repo) => (
              <Card
                key={repo.id}
                className={`p-3 sm:p-4 transition-colors ${
                  addedRepos.includes(repo.full_name)
                    ? 'border-primary bg-primary/10'
                    : 'hover:border-card-hover cursor-pointer'
                }`}
                onClick={() => !addedRepos.includes(repo.full_name) && handleAddRepo(repo.full_name)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{repo.name}</h3>
                      {repo.private && (
                        <span className="text-xs px-1.5 sm:px-2 py-0.5 bg-muted/20 text-muted rounded">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted break-all">{repo.full_name}</p>
                    {repo.description && (
                      <p className="text-xs sm:text-sm text-muted mt-2 line-clamp-2">{repo.description}</p>
                    )}
                    <p className="text-xs text-muted">
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {addedRepos.includes(repo.full_name) && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {selectedRepo === repo.full_name && (
                        <svg className="w-5 h-5 text-accent mt-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRepo(repo.full_name);
                        }}
                        className="p-2 -m-1 rounded hover:bg-error/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Remove from list"
                      >
                        <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {filteredRepos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm sm:text-base text-muted">No repositories found</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <Link href="/settings" className="w-full sm:w-auto">
            <Button variant="ghost" className="w-full sm:w-auto">
              Back to Settings
            </Button>
          </Link>
          {addedRepos.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <p className="text-xs sm:text-sm text-muted self-center text-center sm:text-left">
                {addedRepos.length} {addedRepos.length === 1 ? 'repository' : 'repositories'} added
              </p>
              <Button
                onClick={() => router.push('/')}
                loading={saving}
                className="min-h-[44px]"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}