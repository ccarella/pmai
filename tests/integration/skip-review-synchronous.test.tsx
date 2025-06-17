import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import CreateIssuePage from '@/app/create/page'
import { showToast } from '@/components/ui/Toast'

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
        onSubmit({ title: 'Test Issue', prompt: 'Test prompt content' })
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
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: '' }
})

describe('Skip Review Synchronous Workflow', () => {
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
  })

  it('should show loading toast during synchronous publish', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo' })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Test Issue\nThis is a test issue',
          summary: { type: 'feature' },
          generatedTitle: 'Test Issue'
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issueUrl: 'https://github.com/owner/repo/issues/123',
          issueNumber: 123,
          title: 'Test Issue'
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

    await waitFor(() => {
      // Should show loading toast first
      expect(showToast).toHaveBeenCalledWith('Publishing to GitHub...', 'info')
    })

    await waitFor(() => {
      // Then show success toast
      expect(showToast).toHaveBeenCalledWith('Issue published successfully!', 'success')
    })
  })

  it('should properly handle network delays during synchronous publish', async () => {
    // Mock API responses with delay
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo' })
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
                issueUrl: 'https://github.com/owner/repo/issues/123',
                issueNumber: 123,
                title: 'Test Issue'
              })
            } as Response), 
            100
          )
        )
      )

    render(<CreateIssuePage />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/skip-review')
    })

    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    // Button should be disabled during submission
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeDisabled()
    })

    // Should complete eventually
    await waitFor(() => {
      expect(window.location.href).toBe('https://github.com/owner/repo/issues/123')
    }, { timeout: 3000 })
  })

  it('should handle GitHub API rate limiting gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo' })
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
        status: 429,
        json: async () => ({ 
          error: 'API rate limit exceeded',
          message: 'Rate limit exceeded'
        })
      } as Response)

    render(<CreateIssuePage />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/skip-review')
    })

    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Failed to publish. Redirecting to preview...', 'error')
      expect(mockPush).toHaveBeenCalledWith('/preview')
    })
  })

  it('should validate all required data before attempting publish', async () => {
    // Test with missing repository
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: null }) // No repo selected
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
      expect(mockFetch).toHaveBeenCalledWith('/api/github/selected-repo')
    })

    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    await waitFor(() => {
      // Should not attempt to publish without a repository
      expect(mockFetch).not.toHaveBeenCalledWith(
        '/api/github/publish',
        expect.any(Object)
      )
      // Should go to preview instead
      expect(mockPush).toHaveBeenCalledWith('/preview')
    })
  })
})