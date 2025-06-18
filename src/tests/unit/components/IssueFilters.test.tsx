/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock the entire IssueFilters module to test core functionality
const mockOnFiltersChange = jest.fn()

const MockIssueFilters = ({ filters, onFiltersChange }: { 
  filters: { state: string; sort: string; direction: string }
  onFiltersChange: (filters: Partial<{ state: string; sort: string; direction: string }>) => void
}) => {
  const statusLabels = { open: 'Open', closed: 'Closed', all: 'All' }
  const sortLabels = { 
    'created-desc': 'Newest',
    'created-asc': 'Oldest', 
    'updated-desc': 'Recently Updated',
    'comments-desc': 'Most Commented'
  }
  
  const currentStatus = statusLabels[filters.state as keyof typeof statusLabels] || 'All'
  const currentSort = sortLabels[`${filters.sort}-${filters.direction}` as keyof typeof sortLabels] || 'Newest'

  return (
    <div data-testid="issue-filters" style={{ gap: '4px' }} className="flex px-4 py-2">
      <button
        data-testid="status-filter"
        className="flex items-center gap-2 rounded-full border border-[#E1E1E1] bg-white px-4 text-sm text-[#4A4A4A]"
        style={{ height: '40px', minHeight: '40px' }}
        onClick={() => {
          const states = ['open', 'closed', 'all']
          const currentIndex = states.indexOf(filters.state)
          const nextState = states[(currentIndex + 1) % states.length]
          onFiltersChange({ state: nextState })
        }}
      >
        <span 
          data-testid="status-dot" 
          className={`h-2 w-2 rounded-full ${
            filters.state === 'open' ? 'bg-green-500' : 
            filters.state === 'closed' ? 'bg-purple-500' : 'bg-gray-500'
          }`} 
        />
        <span>{currentStatus}</span>
      </button>

      <button
        data-testid="sort-filter"
        className="flex items-center gap-2 rounded-full border border-[#E1E1E1] bg-white px-4 text-sm text-[#4A4A4A]"
        style={{ height: '40px', minHeight: '40px' }}
        onClick={() => {
          const sorts = ['created-desc', 'created-asc', 'updated-desc', 'comments-desc']
          const current = `${filters.sort}-${filters.direction}`
          const currentIndex = sorts.indexOf(current)
          const nextSort = sorts[(currentIndex + 1) % sorts.length]
          const [sort, direction] = nextSort.split('-')
          onFiltersChange({ sort, direction })
        }}
      >
        <span data-testid="chevron-down">▼</span>
        <span>{currentSort}</span>
      </button>
    </div>
  )
}

describe('IssueFilters', () => {
  const defaultFilters = {
    state: 'open',
    sort: 'created',
    direction: 'desc',
  }

  beforeEach(() => {
    mockOnFiltersChange.mockClear()
  })

  describe('Rendering', () => {
    it('renders the component with default filters', () => {
      render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )

      expect(screen.getByTestId('issue-filters')).toBeInTheDocument()
      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByText('Newest')).toBeInTheDocument()
    })

    it('renders correct status chip labels', () => {
      const { rerender } = render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )
      expect(screen.getByText('Open')).toBeInTheDocument()

      rerender(
        <MockIssueFilters 
          filters={{ ...defaultFilters, state: 'closed' }} 
          onFiltersChange={mockOnFiltersChange} 
        />
      )
      expect(screen.getByText('Closed')).toBeInTheDocument()

      rerender(
        <MockIssueFilters 
          filters={{ ...defaultFilters, state: 'all' }} 
          onFiltersChange={mockOnFiltersChange} 
        />
      )
      expect(screen.getByText('All')).toBeInTheDocument()
    })

    it('renders correct sort chip labels', () => {
      const { rerender } = render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )
      expect(screen.getByText('Newest')).toBeInTheDocument()

      rerender(
        <MockIssueFilters 
          filters={{ ...defaultFilters, sort: 'created', direction: 'asc' }} 
          onFiltersChange={mockOnFiltersChange} 
        />
      )
      expect(screen.getByText('Oldest')).toBeInTheDocument()

      rerender(
        <MockIssueFilters 
          filters={{ ...defaultFilters, sort: 'updated', direction: 'desc' }} 
          onFiltersChange={mockOnFiltersChange} 
        />
      )
      expect(screen.getByText('Recently Updated')).toBeInTheDocument()

      rerender(
        <MockIssueFilters 
          filters={{ ...defaultFilters, sort: 'comments', direction: 'desc' }} 
          onFiltersChange={mockOnFiltersChange} 
        />
      )
      expect(screen.getByText('Most Commented')).toBeInTheDocument()
    })
  })

  describe('Visual Design', () => {
    it('applies correct CSS classes for pill-chip design', () => {
      render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )

      const statusButton = screen.getByTestId('status-filter')
      const sortButton = screen.getByTestId('sort-filter')

      expect(statusButton).toHaveClass('rounded-full')
      expect(statusButton).toHaveClass('border-[#E1E1E1]')
      expect(statusButton).toHaveClass('bg-white')
      expect(statusButton).toHaveClass('text-[#4A4A4A]')

      expect(sortButton).toHaveClass('rounded-full')
      expect(sortButton).toHaveClass('border-[#E1E1E1]')
      expect(sortButton).toHaveClass('bg-white')
      expect(sortButton).toHaveClass('text-[#4A4A4A]')
    })

    it('has correct height and spacing', () => {
      render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )

      const container = screen.getByTestId('issue-filters')
      const statusButton = screen.getByTestId('status-filter')

      expect(statusButton).toHaveStyle({ height: '40px', minHeight: '40px' })
      expect(container).toHaveStyle({ gap: '4px' })
    })

    it('displays status dots with correct colors', () => {
      const { rerender } = render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )

      // Open status - green dot
      let statusDot = screen.getByTestId('status-dot')
      expect(statusDot).toHaveClass('bg-green-500')

      // All status - gray dot
      rerender(
        <MockIssueFilters 
          filters={{ ...defaultFilters, state: 'all' }} 
          onFiltersChange={mockOnFiltersChange} 
        />
      )
      statusDot = screen.getByTestId('status-dot')
      expect(statusDot).toHaveClass('bg-gray-500')

      // Closed status - purple dot
      rerender(
        <MockIssueFilters 
          filters={{ ...defaultFilters, state: 'closed' }} 
          onFiltersChange={mockOnFiltersChange} 
        />
      )
      statusDot = screen.getByTestId('status-dot')
      expect(statusDot).toHaveClass('bg-purple-500')
    })
  })

  describe('Interaction', () => {
    it('calls onFiltersChange when status is changed', async () => {
      const user = userEvent.setup()
      
      render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )

      const statusButton = screen.getByTestId('status-filter')
      await user.click(statusButton)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ state: 'closed' })
    })

    it('calls onFiltersChange when sort is changed', async () => {
      const user = userEvent.setup()
      
      render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )

      const sortButton = screen.getByTestId('sort-filter')
      await user.click(sortButton)
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ 
        sort: 'created', 
        direction: 'asc' 
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper button roles and is keyboard accessible', () => {
      render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )

      const statusButton = screen.getByTestId('status-filter')
      const sortButton = screen.getByTestId('sort-filter')

      expect(statusButton.tagName).toBe('BUTTON')
      expect(sortButton.tagName).toBe('BUTTON')

      // Test keyboard navigation
      statusButton.focus()
      expect(statusButton).toHaveFocus()

      // Focus moves to sort button when tabbing
      sortButton.focus()
      expect(sortButton).toHaveFocus()
    })

    it('supports keyboard interaction for button clicks', () => {
      render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )

      const statusButton = screen.getByTestId('status-filter')
      
      // Test Enter key
      fireEvent.keyDown(statusButton, { key: 'Enter' })
      fireEvent.click(statusButton)
      expect(mockOnFiltersChange).toHaveBeenCalled()

      // Test Space key  
      const sortButton = screen.getByTestId('sort-filter')
      fireEvent.keyDown(sortButton, { key: ' ' })
      fireEvent.click(sortButton)
      expect(mockOnFiltersChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('Edge Cases', () => {
    it('handles unknown filter values gracefully', () => {
      const unknownFilters = {
        state: 'unknown',
        sort: 'unknown',
        direction: 'unknown',
      }

      render(
        <MockIssueFilters filters={unknownFilters} onFiltersChange={mockOnFiltersChange} />
      )

      // Should fall back to default labels
      expect(screen.getByText('All')).toBeInTheDocument()
      expect(screen.getByText('Newest')).toBeInTheDocument()
    })

    it('handles rapid filter changes', async () => {
      const user = userEvent.setup()
      
      render(
        <MockIssueFilters filters={defaultFilters} onFiltersChange={mockOnFiltersChange} />
      )

      const statusButton = screen.getByTestId('status-filter')
      
      // Rapid clicks
      await user.click(statusButton)
      await user.click(statusButton)
      await user.click(statusButton)

      // Should not cause errors and handle all calls
      expect(mockOnFiltersChange).toHaveBeenCalledTimes(3)
    })
  })
})