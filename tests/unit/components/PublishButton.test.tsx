import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PublishButton } from '@/components/PublishButton'
import { useSession } from 'next-auth/react'

// Mock next-auth
jest.mock('next-auth/react')

// Mock fetch
global.fetch = jest.fn()

describe('PublishButton', () => {
  const mockProps = {
    title: 'Test Issue Title',
    body: 'Test issue body content',
    labels: ['feature', 'enhancement'],
    onSuccess: jest.fn(),
    onError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated',
    })
  })

  it('should render the publish button', () => {
    render(<PublishButton {...mockProps} />)
    
    const button = screen.getByRole('button', { name: /publish to github/i })
    expect(button).toBeInTheDocument()
  })

  it('should show error when user is not authenticated', async () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<PublishButton {...mockProps} />)
    
    const button = screen.getByRole('button', { name: /publish to github/i })
    fireEvent.click(button)

    // The error will be set immediately
    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalledWith('Please connect your GitHub account in Settings')
    })
  })

  it('should successfully publish an issue', async () => {
    const mockResponse = {
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
      issueNumber: 123,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<PublishButton {...mockProps} />)
    
    const button = screen.getByRole('button', { name: /publish to github/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Published!')).toBeInTheDocument()
      expect(screen.getByText('View on GitHub →')).toBeInTheDocument()
      expect(mockProps.onSuccess).toHaveBeenCalledWith(mockResponse.issueUrl)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/github/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: mockProps.title,
        body: mockProps.body,
        labels: mockProps.labels,
      }),
    })
  })

  it('should handle API errors', async () => {
    const errorMessage = 'Repository not found'
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    })

    render(<PublishButton {...mockProps} />)
    
    const button = screen.getByRole('button', { name: /publish to github/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(mockProps.onError).toHaveBeenCalledWith(errorMessage)
    })
  })

  it('should handle network errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<PublishButton {...mockProps} />)
    
    const button = screen.getByRole('button', { name: /publish to github/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(mockProps.onError).toHaveBeenCalledWith('Network error')
    })
  })

  it('should show loading state while publishing', async () => {
    let resolvePromise: any
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    ;(global.fetch as jest.Mock).mockReturnValueOnce(promise)

    render(<PublishButton {...mockProps} />)
    
    const button = screen.getByRole('button', { name: /publish to github/i })
    fireEvent.click(button)

    // Button should be in loading state
    expect(button).toBeDisabled()
    
    // Resolve the promise
    resolvePromise({
      ok: true,
      json: async () => ({
        success: true,
        issueUrl: 'https://github.com/owner/repo/issues/123',
      }),
    })

    await waitFor(() => {
      expect(screen.getByText('Published!')).toBeInTheDocument()
    })
  })

  it('should disable button after successful publish', async () => {
    const mockResponse = {
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/123',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<PublishButton {...mockProps} />)
    
    const button = screen.getByRole('button', { name: /publish to github/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Published!')).toBeInTheDocument()
    })

    // Button should not be visible after success
    expect(screen.queryByRole('button', { name: /publish to github/i })).not.toBeInTheDocument()
  })

  it('should render GitHub issue link after successful publish', async () => {
    const issueUrl = 'https://github.com/owner/repo/issues/123'
    const mockResponse = {
      success: true,
      issueUrl,
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<PublishButton {...mockProps} />)
    
    const button = screen.getByRole('button', { name: /publish to github/i })
    fireEvent.click(button)

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /view on github/i })
      expect(link).toHaveAttribute('href', issueUrl)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })
})