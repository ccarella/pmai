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

describe('Skip Review Workflow', () => {
  const mockPush = jest.fn()
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'user123', email: 'test@example.com' } }
    })
  })

  it('should navigate to preview page when skip review is disabled', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: false })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: null })
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

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/skip-review')
    })

    // Submit form
    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/preview')
      expect(localStorage.getItem('created-issue')).toBeTruthy()
    })
  })

  it('should publish directly to GitHub when skip review is enabled', async () => {
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
          markdown: '# Test Issue',
          summary: { type: 'feature' },
          generatedTitle: 'Test Issue'
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issueUrl: 'https://github.com/owner/repo/issues/123'
        })
      } as Response)

    render(<CreateIssuePage />)

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/skip-review')
      expect(mockFetch).toHaveBeenCalledWith('/api/github/selected-repo')
    })

    // Submit form
    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    await waitFor(() => {
      // Should call GitHub publish API
      expect(mockFetch).toHaveBeenCalledWith('/api/github/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Issue',
          body: '# Test Issue',
          repository: 'owner/repo',
          labels: ['feature']
        })
      })

      // Should show success toast
      expect(showToast).toHaveBeenCalledWith('Issue published successfully!', 'success')

      // Should navigate to success page
      expect(mockPush).toHaveBeenCalledWith('/create/success')
      expect(localStorage.getItem('published-issue')).toBeTruthy()
    })
  })

  it('should fall back to preview when GitHub publish fails', async () => {
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
          markdown: '# Test Issue',
          summary: { type: 'feature' },
          generatedTitle: 'Test Issue'
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to publish' })
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
      // Should still navigate to preview on failure
      expect(mockPush).toHaveBeenCalledWith('/preview')
      expect(localStorage.getItem('created-issue')).toBeTruthy()
      
      // Should not show success toast
      expect(showToast).not.toHaveBeenCalled()
    })
  })

  it('should not skip review when no repository is selected', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: null })
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

    // Submit form
    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    await waitFor(() => {
      // Should navigate to preview when no repo is selected
      expect(mockPush).toHaveBeenCalledWith('/preview')
      expect(mockFetch).not.toHaveBeenCalledWith(
        '/api/github/publish',
        expect.any(Object)
      )
    })
  })

  it('should not skip review when user is not authenticated', async () => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null })

    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
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

    // Submit form
    const submitButton = screen.getByText('Create Issue')
    fireEvent.click(submitButton)

    await waitFor(() => {
      // Should navigate to preview when not authenticated
      expect(mockPush).toHaveBeenCalledWith('/preview')
      expect(mockFetch).not.toHaveBeenCalledWith(
        '/api/github/publish',
        expect.any(Object)
      )
    })
  })
})