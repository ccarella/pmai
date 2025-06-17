import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import OpenAISettingsPage from '@/app/settings/openai/page'

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => <div {...props}>{children}</div>,
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('OpenAI Settings Page', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  describe('Authentication', () => {
    it('should redirect to settings when unauthenticated', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<OpenAISettingsPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/settings')
      })
    })

    it('should show loading state while checking auth', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<OpenAISettingsPage />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('API Key Management', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: { user: { id: 'user123', email: 'test@example.com' } },
        status: 'authenticated',
      })
    })

    it('should load and display API key status', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          usageStats: {
            totalTokens: 1000,
            totalCost: 0.5,
            lastUsed: '2024-01-01T00:00:00Z',
          }
        }),
      })

      render(<OpenAISettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('API Key Configured')).toBeInTheDocument()
        expect(screen.getByText('Your OpenAI API key is securely stored and encrypted')).toBeInTheDocument()
      })
    })

    it('should show form to add API key when none exists', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ hasApiKey: false, usageStats: null }),
      })

      render(<OpenAISettingsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument()
        expect(screen.getByText('Save API Key')).toBeInTheDocument()
        expect(screen.getByText('Validate Key')).toBeInTheDocument()
      })
    })

    it('should save API key successfully', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hasApiKey: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ usageStats: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<OpenAISettingsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('sk-...')
      const saveButton = screen.getByText('Save API Key')

      fireEvent.change(input, { target: { value: 'sk-test123' } })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/user/openai-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: 'sk-test123' }),
        })
        expect(screen.getByText('API key saved successfully')).toBeInTheDocument()
      })
    })

    it('should validate API key', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hasApiKey: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ usageStats: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ valid: true }),
        })

      render(<OpenAISettingsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('sk-...')
      const validateButton = screen.getByText('Validate Key')

      fireEvent.change(input, { target: { value: 'sk-test123' } })
      fireEvent.click(validateButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/user/openai-key/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: 'sk-test123' }),
        })
        expect(screen.getByText('API key is valid')).toBeInTheDocument()
      })
    })

    it('should handle validation errors', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hasApiKey: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ usageStats: null }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Invalid API key' }),
        })

      render(<OpenAISettingsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('sk-...')
      const validateButton = screen.getByText('Validate Key')

      fireEvent.change(input, { target: { value: 'sk-invalid' } })
      fireEvent.click(validateButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid API key')).toBeInTheDocument()
      })
    })

    it('should remove API key with confirmation', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hasApiKey: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ usageStats: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<OpenAISettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Remove API Key')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Remove API Key'))

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to remove your OpenAI API key?')
        expect(fetch).toHaveBeenCalledWith('/api/user/openai-key', {
          method: 'DELETE',
        })
        expect(screen.getByText('API key removed successfully')).toBeInTheDocument()
      })

      confirmSpy.mockRestore()
    })

    it('should toggle API key visibility', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ hasApiKey: false, usageStats: null }),
      })

      render(<OpenAISettingsPage />)

      await waitFor(() => {
        expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('sk-...') as HTMLInputElement
      const toggleButton = screen.getByRole('button', { name: /eye|visibility/i })

      expect(input.type).toBe('password')

      fireEvent.click(toggleButton)
      expect(input.type).toBe('text')

      fireEvent.click(toggleButton)
      expect(input.type).toBe('password')
    })
  })

  describe('Usage Statistics', () => {
    it('should display usage statistics when available', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: { user: { id: 'user123' } },
        status: 'authenticated',
      })

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hasApiKey: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            usageStats: {
              totalTokens: 12345,
              totalCost: 1.2345,
              lastUsed: '2024-01-15T12:30:00Z',
            }
          }),
        })

      render(<OpenAISettingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Usage Statistics')).toBeInTheDocument()
        expect(screen.getByText('12,345')).toBeInTheDocument() // Total tokens
        expect(screen.getByText('$1.2345')).toBeInTheDocument() // Total cost
        expect(screen.getByText(/Last used:/)).toBeInTheDocument()
      })
    })

    it('should not show usage statistics when no usage', async () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: { user: { id: 'user123' } },
        status: 'authenticated',
      })

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ hasApiKey: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            usageStats: {
              totalTokens: 0,
              totalCost: 0,
              lastUsed: null,
            }
          }),
        })

      render(<OpenAISettingsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Usage Statistics')).not.toBeInTheDocument()
      })
    })
  })
})