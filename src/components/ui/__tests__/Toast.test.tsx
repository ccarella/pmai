import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ToastContainer, showToast } from '../Toast'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>
}))

describe('Toast', () => {
  beforeEach(() => {
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('ToastContainer', () => {
    it('should render without toasts initially', () => {
      render(<ToastContainer />)
      
      const container = document.querySelector('.fixed.top-4.right-4')
      expect(container).toBeInTheDocument()
      expect(container?.children).toHaveLength(0)
    })

    it('should display toast when showToast is called', async () => {
      render(<ToastContainer />)
      
      act(() => {
        showToast('Test message', 'success')
      })

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument()
      })
    })

    it('should display multiple toasts', async () => {
      render(<ToastContainer />)
      
      act(() => {
        showToast('First toast', 'success')
        showToast('Second toast', 'error')
        showToast('Third toast', 'info')
      })

      await waitFor(() => {
        expect(screen.getByText('First toast')).toBeInTheDocument()
        expect(screen.getByText('Second toast')).toBeInTheDocument()
        expect(screen.getByText('Third toast')).toBeInTheDocument()
      })
    })

    it('should remove toast when dismiss button is clicked', async () => {
      render(<ToastContainer />)
      
      act(() => {
        showToast('Dismissable toast', 'info')
      })

      await waitFor(() => {
        expect(screen.getByText('Dismissable toast')).toBeInTheDocument()
      })

      const dismissButton = screen.getAllByRole('button')[0]
      fireEvent.click(dismissButton)

      await waitFor(() => {
        expect(screen.queryByText('Dismissable toast')).not.toBeInTheDocument()
      })
    })

    it('should auto-dismiss toast after default duration', async () => {
      render(<ToastContainer />)
      
      act(() => {
        showToast('Auto-dismiss toast', 'success')
      })

      await waitFor(() => {
        expect(screen.getByText('Auto-dismiss toast')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(5000) // Default duration
      })

      await waitFor(() => {
        expect(screen.queryByText('Auto-dismiss toast')).not.toBeInTheDocument()
      })
    })

    it('should use custom duration when provided', async () => {
      render(<ToastContainer />)
      
      act(() => {
        showToast('Custom duration toast', 'info', 2000)
      })

      await waitFor(() => {
        expect(screen.getByText('Custom duration toast')).toBeInTheDocument()
      })

      act(() => {
        jest.advanceTimersByTime(1999)
      })

      // Should still be visible
      expect(screen.getByText('Custom duration toast')).toBeInTheDocument()

      act(() => {
        jest.advanceTimersByTime(1)
      })

      await waitFor(() => {
        expect(screen.queryByText('Custom duration toast')).not.toBeInTheDocument()
      })
    })
  })

  describe('showToast', () => {
    it('should dispatch custom event with correct data', () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')
      
      showToast('Test message', 'error', 3000)
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'toast',
          detail: expect.objectContaining({
            id: expect.any(String),
            message: 'Test message',
            type: 'error',
            duration: 3000
          })
        })
      )
      
      dispatchEventSpy.mockRestore()
    })

    it('should use default type info when not specified', () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent')
      
      showToast('Default type message')
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: 'info'
          })
        })
      )
      
      dispatchEventSpy.mockRestore()
    })
  })

  describe('Toast types', () => {
    it('should render success toast with correct styling', async () => {
      render(<ToastContainer />)
      
      act(() => {
        showToast('Success!', 'success')
      })

      await waitFor(() => {
        const toast = screen.getByText('Success!').closest('div')
        expect(toast).toHaveClass('text-success', 'bg-success/10', 'border-success/30')
      })
    })

    it('should render error toast with correct styling', async () => {
      render(<ToastContainer />)
      
      act(() => {
        showToast('Error!', 'error')
      })

      await waitFor(() => {
        const toast = screen.getByText('Error!').closest('div')
        expect(toast).toHaveClass('text-error', 'bg-error/10', 'border-error/30')
      })
    })

    it('should render warning toast with correct styling', async () => {
      render(<ToastContainer />)
      
      act(() => {
        showToast('Warning!', 'warning')
      })

      await waitFor(() => {
        const toast = screen.getByText('Warning!').closest('div')
        expect(toast).toHaveClass('text-warning', 'bg-warning/10', 'border-warning/30')
      })
    })

    it('should render info toast with correct styling', async () => {
      render(<ToastContainer />)
      
      act(() => {
        showToast('Info!', 'info')
      })

      await waitFor(() => {
        const toast = screen.getByText('Info!').closest('div')
        expect(toast).toHaveClass('text-primary', 'bg-primary/10', 'border-primary/30')
      })
    })
  })
})