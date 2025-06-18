import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import CreateIssuePage from '@/app/create/page'
import { showToast } from '@/components/ui/Toast'
import { useRepository } from '@/contexts/RepositoryContext'
import { mockLocation } from '../__mocks__/location'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}))

jest.mock('@/lib/hooks/useOnboardingGuard', () => ({
  useOnboardingGuard: jest.fn()
}))

jest.mock('@/components/ui/Toast', () => ({
  showToast: jest.fn()
}))

jest.mock('@/contexts/RepositoryContext', () => ({
  useRepository: jest.fn()
}))

jest.mock('@/hooks/useRepositoryChange', () => ({
  useRepositoryChange: jest.fn()
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

// Mock SmartPromptForm
jest.mock('@/components/forms/SmartPromptForm', () => ({
  SmartPromptForm: ({ onSubmit, isSubmitting }: any) => (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ title: 'Test Story Issue', prompt: 'Create a user story for login feature' })
      }}
    >
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Issue'}
      </button>
    </form>
  )
}))

// Mock fetch
global.fetch = jest.fn()

// Mock window.location
mockLocation()

describe('Skip Review Bug Fix - Issue #97', () => {
  const mockPush = jest.fn()
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    window.location.href = ''
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'user123', email: 'test@example.com' } }
    })
    ;(useRepository as jest.Mock).mockReturnValue({
      selectedRepo: 'owner/repo',
      addedRepos: [],
      isLoading: false,
      switchRepository: jest.fn(),
      refreshRepositories: jest.fn()
    })
  })

  it('should successfully create and publish story with skip review enabled', async () => {
    // Mock API responses
    mockFetch
      // Skip review setting
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)
      // Create issue
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Test Story Issue\nCreate a user story for login feature',
          summary: { type: 'story', priority: 'high', estimatedEffort: 'medium' },
          generatedTitle: 'Test Story Issue',
          claudePrompt: 'Implement the following story...'
        })
      } as Response)
      // Publish to GitHub
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          issueUrl: 'https://github.com/owner/repo/issues/123',
          issueNumber: 123,
          title: 'Test Story Issue'
        })
      } as Response)

    render(<CreateIssuePage />)

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/skip-review')
    })

    // Submit form
    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeDisabled()
    })

    // Should show publishing toast
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Publishing to GitHub...', 'info')
    })

    // Should show success toast
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Issue published successfully!', 'success')
    })

    // Should redirect to GitHub issue
    await waitFor(() => {
      expect(window.location.href).toBe('https://github.com/owner/repo/issues/123')
    })

    // Verify localStorage was updated
    const publishedIssue = JSON.parse(localStorage.getItem('published-issue') || '{}')
    expect(publishedIssue).toEqual({
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123,
      title: 'Test Story Issue',
      repository: 'owner/repo'
    })
  })

  it('should handle missing issueUrl in publish response gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Test Issue',
          summary: { type: 'feature' },
          generatedTitle: 'Test Issue'
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          // Missing issueUrl
          issueNumber: 123,
          title: 'Test Issue'
        })
      } as Response)

    render(<CreateIssuePage />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/skip-review')
    })

    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    // Should fall back to preview
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Failed to publish. Redirecting to preview...', 'error')
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/preview')
    })

    // Verify created issue was stored for preview
    const createdIssue = JSON.parse(localStorage.getItem('created-issue') || '{}')
    expect(createdIssue.markdown).toBe('# Test Issue')
  })

  it('should maintain loading state throughout the entire publish process', async () => {
    // Add delay to publish response to test loading state
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Test Issue',
          summary: { type: 'feature' },
          generatedTitle: 'Test Issue'
        })
      } as Response)
      .mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => 
            resolve({
              ok: true,
              json: async () => ({
                success: true,
                issueUrl: 'https://github.com/owner/repo/issues/123',
                issueNumber: 123,
                title: 'Test Issue'
              })
            } as Response), 
            500 // 500ms delay
          )
        )
      )

    render(<CreateIssuePage />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/skip-review')
    })

    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    // Button should remain disabled during entire process
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeDisabled()
    })

    // Wait for publish to complete
    await waitFor(() => {
      expect(window.location.href).toBe('https://github.com/owner/repo/issues/123')
    }, { timeout: 1000 })
  })

  it('should handle publish API errors correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Test Issue',
          summary: { type: 'feature' },
          generatedTitle: 'Test Issue'
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ 
          error: 'Repository not found or access denied'
        })
      } as Response)

    render(<CreateIssuePage />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/skip-review')
    })

    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    // Should show error toast
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Failed to publish. Redirecting to preview...', 'error')
    })

    // Should redirect to preview
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/preview')
    })

    // Button should be re-enabled after error
    await waitFor(() => {
      expect(screen.getByText('Create Issue')).not.toBeDisabled()
    })
  })

  it('should not attempt to publish when no repository is selected', async () => {
    ;(useRepository as jest.Mock).mockReturnValue({
      selectedRepo: null, // No repository selected
      addedRepos: [],
      isLoading: false,
      switchRepository: jest.fn(),
      refreshRepositories: jest.fn()
    })

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Test Issue',
          summary: { type: 'feature' },
          generatedTitle: 'Test Issue'
        })
      } as Response)

    render(<CreateIssuePage />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/skip-review')
    })

    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    // Should go directly to preview
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/preview')
    })

    // Should not attempt to publish
    expect(mockFetch).not.toHaveBeenCalledWith(
      '/api/github/publish',
      expect.any(Object)
    )
  })
})