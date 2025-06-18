import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface MockToggleGroupProps {
  children: React.ReactNode
  className?: string
  [key: string]: unknown
}

interface MockToggleGroupItemProps {
  children: React.ReactNode
  className?: string
  value: string
  [key: string]: unknown
}

// Mock Radix UI ToggleGroup
jest.mock('@radix-ui/react-toggle-group', () => ({
  Root: ({ children, className, ...props }: MockToggleGroupProps) => (
    <div data-testid="toggle-group-root" className={className} {...props}>
      {children}
    </div>
  ),
  Item: ({ children, className, value, ...props }: MockToggleGroupItemProps) => (
    <button 
      data-testid={`toggle-group-item-${value}`} 
      className={className} 
      data-value={value}
      {...props}
    >
      {children}
    </button>
  ),
}))

describe('ToggleGroup', () => {
  describe('ToggleGroup Component', () => {
    it('renders with default props', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      )

      expect(screen.getByTestId('toggle-group-root')).toBeInTheDocument()
      expect(screen.getByTestId('toggle-group-item-option1')).toBeInTheDocument()
      expect(screen.getByTestId('toggle-group-item-option2')).toBeInTheDocument()
    })

    it('applies variant classes correctly', () => {
      const { rerender } = render(
        <ToggleGroup type="single" variant="default">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      let root = screen.getByTestId('toggle-group-root')
      expect(root).toHaveClass('bg-transparent')

      rerender(
        <ToggleGroup type="single" variant="outline">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      root = screen.getByTestId('toggle-group-root')
      expect(root).toHaveClass('border', 'border-input', 'bg-transparent')
    })

    it('applies size classes correctly', () => {
      const { rerender } = render(
        <ToggleGroup type="single" size="default">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      let root = screen.getByTestId('toggle-group-root')
      expect(root).toHaveClass('h-10', 'px-3')

      rerender(
        <ToggleGroup type="single" size="sm">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      root = screen.getByTestId('toggle-group-root')
      expect(root).toHaveClass('h-9', 'px-2.5')

      rerender(
        <ToggleGroup type="single" size="lg">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      root = screen.getByTestId('toggle-group-root')
      expect(root).toHaveClass('h-11', 'px-5')
    })

    it('accepts custom className', () => {
      render(
        <ToggleGroup type="single" className="custom-class">
          <ToggleGroupItem value="test">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      const root = screen.getByTestId('toggle-group-root')
      expect(root).toHaveClass('custom-class')
    })
  })

  describe('ToggleGroupItem Component', () => {
    it('renders with correct default classes', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test">Test Item</ToggleGroupItem>
        </ToggleGroup>
      )

      const item = screen.getByTestId('toggle-group-item-test')
      expect(item).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'whitespace-nowrap',
        'rounded-md',
        'text-sm',
        'font-medium',
        'ring-offset-background',
        'transition-colors'
      )
    })

    it('applies variant classes correctly', () => {
      const { rerender } = render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" variant="default">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      let item = screen.getByTestId('toggle-group-item-test')
      expect(item).toHaveClass('bg-transparent')

      rerender(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" variant="outline">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      item = screen.getByTestId('toggle-group-item-test')
      expect(item).toHaveClass('border', 'border-input', 'bg-transparent')
    })

    it('applies size classes correctly', () => {
      const { rerender } = render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" size="default">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      let item = screen.getByTestId('toggle-group-item-test')
      expect(item).toHaveClass('h-10', 'px-3')

      rerender(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" size="sm">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      item = screen.getByTestId('toggle-group-item-test')
      expect(item).toHaveClass('h-9', 'px-2.5')

      rerender(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" size="lg">Test</ToggleGroupItem>
        </ToggleGroup>
      )

      item = screen.getByTestId('toggle-group-item-test')
      expect(item).toHaveClass('h-11', 'px-5')
    })

    it('handles click events', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" onClick={handleClick}>
            Test Item
          </ToggleGroupItem>
        </ToggleGroup>
      )

      const item = screen.getByTestId('toggle-group-item-test')
      await user.click(item)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('is keyboard accessible', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test">Test Item</ToggleGroupItem>
        </ToggleGroup>
      )

      const item = screen.getByTestId('toggle-group-item-test')
      
      item.focus()
      expect(item).toHaveFocus()

      fireEvent.keyDown(item, { key: 'Enter' })
      fireEvent.keyDown(item, { key: ' ' })
      
      // Should not throw errors
      expect(item).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" className="custom-item-class">
            Test
          </ToggleGroupItem>
        </ToggleGroup>
      )

      const item = screen.getByTestId('toggle-group-item-test')
      expect(item).toHaveClass('custom-item-class')
    })
  })

  describe('Integration', () => {
    it('works with multiple items', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="first">First</ToggleGroupItem>
          <ToggleGroupItem value="second">Second</ToggleGroupItem>
          <ToggleGroupItem value="third">Third</ToggleGroupItem>
        </ToggleGroup>
      )

      expect(screen.getByTestId('toggle-group-item-first')).toBeInTheDocument()
      expect(screen.getByTestId('toggle-group-item-second')).toBeInTheDocument()
      expect(screen.getByTestId('toggle-group-item-third')).toBeInTheDocument()
    })

    it('supports disabled state', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="test" disabled>
            Disabled Item
          </ToggleGroupItem>
        </ToggleGroup>
      )

      const item = screen.getByTestId('toggle-group-item-test')
      expect(item).toBeDisabled()
      expect(item).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })
  })
})