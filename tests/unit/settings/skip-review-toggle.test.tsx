import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import SettingsPage from '@/app/settings/page'

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn()
}))

jest.mock('@/components/providers/OnboardingProvider', () => ({
  useOnboarding: () => ({
    status: null,
    isComplete: true
  })
}))

jest.mock('@/lib/services/onboarding', () => ({
  getOnboardingSteps: jest.fn(() => [])
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

jest.mock('@/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <div>Theme Toggle</div>
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}))

// Mock fetch
global.fetch = jest.fn()

describe('Settings Page - Skip Review Toggle', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue({
      data: { 
        user: { 
          id: 'user123', 
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg'
        } 
      },
      status: 'authenticated'
    })
  })

  it('should display skip review toggle when authenticated', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: [] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo' })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: false })
      } as Response)

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Issue Creation')).toBeInTheDocument()
      expect(screen.getByText('Skip Review')).toBeInTheDocument()
      expect(screen.getByText('Directly publish issues to GitHub without the review step (synchronous)')).toBeInTheDocument()
    })

    const switchElement = screen.getByRole('switch', { name: /skip-review/i })
    expect(switchElement).toBeInTheDocument()
    expect(switchElement).toHaveAttribute('aria-checked', 'false')
  })

  it('should toggle skip review setting', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: [] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo' })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: false })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, skipReview: true })
      } as Response)

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /skip-review/i })).toBeInTheDocument()
    })

    const switchElement = screen.getByRole('switch', { name: /skip-review/i })
    fireEvent.click(switchElement)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/skip-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipReview: true })
      })
    })
  })

  it('should load initial skip review state', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: [] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo' })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: true })
      } as Response)

    render(<SettingsPage />)

    await waitFor(() => {
      const switchElement = screen.getByRole('switch', { name: /skip-review/i })
      expect(switchElement).toHaveAttribute('aria-checked', 'true')
    })
  })

  it('should disable toggle when not authenticated', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ repositories: [] })
    } as Response)

    render(<SettingsPage />)

    // Skip review section should not be visible when not authenticated
    expect(screen.queryByText('Issue Creation')).not.toBeInTheDocument()
    expect(screen.queryByText('Skip Review')).not.toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: [] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo' })
      } as Response)
      .mockRejectedValueOnce(new Error('Network error'))

    render(<SettingsPage />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching skip review setting:',
        expect.any(Error)
      )
    })

    // Toggle should still be rendered with default false value
    const switchElement = screen.getByRole('switch', { name: /skip-review/i })
    expect(switchElement).toHaveAttribute('aria-checked', 'false')

    consoleErrorSpy.mockRestore()
  })

  it('should handle toggle update errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ repositories: [] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ selectedRepo: 'owner/repo' })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ skipReview: false })
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to update' })
      } as Response)

    render(<SettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /skip-review/i })).toBeInTheDocument()
    })

    const switchElement = screen.getByRole('switch', { name: /skip-review/i })
    fireEvent.click(switchElement)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update skip review setting')
      // Switch should remain in original state on error
      expect(switchElement).toHaveAttribute('aria-checked', 'false')
    })

    consoleErrorSpy.mockRestore()
  })
})