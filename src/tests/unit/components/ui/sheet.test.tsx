import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'

interface MockDialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface MockDialogTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface MockDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface MockIconProps {
  className?: string
}

// Mock Radix UI Dialog components
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, onOpenChange }: MockDialogProps) => (
    <div data-testid="sheet-root" data-open={open}>
      <div onClick={() => onOpenChange && onOpenChange(!open)}>{children}</div>
    </div>
  ),
  Trigger: ({ children, asChild }: MockDialogTriggerProps) => (
    <div data-testid="sheet-trigger">{asChild ? children : <button>{children}</button>}</div>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-portal">{children}</div>
  ),
  Overlay: ({ children, className }: MockDialogContentProps) => (
    <div data-testid="sheet-overlay" className={className}>
      {children}
    </div>
  ),
  Content: ({ children, className }: MockDialogContentProps) => (
    <div data-testid="sheet-content" className={className}>
      {children}
    </div>
  ),
  Close: ({ children, className }: MockDialogContentProps) => (
    <button data-testid="sheet-close" className={className}>
      {children}
    </button>
  ),
  Title: ({ children, className }: MockDialogContentProps) => (
    <h2 data-testid="sheet-title" className={className}>
      {children}
    </h2>
  ),
  Description: ({ children, className }: MockDialogContentProps) => (
    <p data-testid="sheet-description" className={className}>
      {children}
    </p>
  ),
}))

// Mock lucide-react X icon
jest.mock('lucide-react', () => ({
  X: ({ className }: MockIconProps) => (
    <span data-testid="x-icon" className={className}>
      ×
    </span>
  ),
}))

describe('Sheet Components', () => {
  describe('Sheet Root', () => {
    it('renders with children', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )

      expect(screen.getByTestId('sheet-root')).toBeInTheDocument()
      expect(screen.getByText('Open')).toBeInTheDocument()
    })

    it('handles open state changes', () => {
      const onOpenChange = jest.fn()
      
      render(
        <Sheet open={false} onOpenChange={onOpenChange}>
          <SheetTrigger>Trigger</SheetTrigger>
        </Sheet>
      )

      const root = screen.getByTestId('sheet-root')
      expect(root).toHaveAttribute('data-open', 'false')

      fireEvent.click(root)
      expect(onOpenChange).toHaveBeenCalledWith(true)
    })
  })

  describe('SheetTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Sheet>
          <SheetTrigger>Click me</SheetTrigger>
        </Sheet>
      )

      expect(screen.getByTestId('sheet-trigger')).toBeInTheDocument()
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('supports asChild prop', () => {
      render(
        <Sheet>
          <SheetTrigger asChild>
            <button data-testid="custom-trigger">Custom Button</button>
          </SheetTrigger>
        </Sheet>
      )

      expect(screen.getByTestId('custom-trigger')).toBeInTheDocument()
    })
  })

  describe('SheetContent', () => {
    it('renders with default side (right)', () => {
      render(
        <Sheet>
          <SheetContent>Sheet content</SheetContent>
        </Sheet>
      )

      const content = screen.getByTestId('sheet-content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('inset-y-0', 'right-0', 'h-full')
    })

    it('applies correct classes for different sides', () => {
      const { rerender } = render(
        <Sheet>
          <SheetContent side="left">Content</SheetContent>
        </Sheet>
      )

      let content = screen.getByTestId('sheet-content')
      expect(content).toHaveClass('inset-y-0', 'left-0', 'h-full')

      rerender(
        <Sheet>
          <SheetContent side="top">Content</SheetContent>
        </Sheet>
      )

      content = screen.getByTestId('sheet-content')
      expect(content).toHaveClass('inset-x-0', 'top-0', 'border-b')

      rerender(
        <Sheet>
          <SheetContent side="bottom">Content</SheetContent>
        </Sheet>
      )

      content = screen.getByTestId('sheet-content')
      expect(content).toHaveClass('inset-x-0', 'bottom-0', 'border-t')
    })

    it('includes close button with X icon', () => {
      render(
        <Sheet>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )

      expect(screen.getByTestId('sheet-close')).toBeInTheDocument()
      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
      expect(screen.getByText('Close')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(
        <Sheet>
          <SheetContent className="custom-content-class">Content</SheetContent>
        </Sheet>
      )

      const content = screen.getByTestId('sheet-content')
      expect(content).toHaveClass('custom-content-class')
    })
  })

  describe('SheetHeader', () => {
    it('renders with correct styling', () => {
      render(
        <Sheet>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      )

      const header = screen.getByText('Title').closest('div')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-2', 'text-center', 'sm:text-left')
    })

    it('accepts custom className', () => {
      render(
        <SheetHeader className="custom-header">
          <SheetTitle>Title</SheetTitle>
        </SheetHeader>
      )

      const header = screen.getByText('Title').closest('div')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('SheetTitle', () => {
    it('renders with correct styling', () => {
      render(
        <SheetTitle>Test Title</SheetTitle>
      )

      const title = screen.getByTestId('sheet-title')
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-foreground')
      expect(title).toHaveTextContent('Test Title')
    })

    it('accepts custom className', () => {
      render(
        <SheetTitle className="custom-title">Title</SheetTitle>
      )

      const title = screen.getByTestId('sheet-title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('SheetDescription', () => {
    it('renders with correct styling', () => {
      render(
        <SheetDescription>Test description</SheetDescription>
      )

      const description = screen.getByTestId('sheet-description')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
      expect(description).toHaveTextContent('Test description')
    })

    it('accepts custom className', () => {
      render(
        <SheetDescription className="custom-description">Description</SheetDescription>
      )

      const description = screen.getByTestId('sheet-description')
      expect(description).toHaveClass('custom-description')
    })
  })

  describe('SheetFooter', () => {
    it('renders with correct styling', () => {
      render(
        <SheetFooter>
          <button>Cancel</button>
          <button>Save</button>
        </SheetFooter>
      )

      const footer = screen.getByText('Cancel').closest('div')
      expect(footer).toHaveClass(
        'flex',
        'flex-col-reverse',
        'sm:flex-row',
        'sm:justify-end',
        'sm:space-x-2'
      )
    })

    it('accepts custom className', () => {
      render(
        <SheetFooter className="custom-footer">
          <button>Action</button>
        </SheetFooter>
      )

      const footer = screen.getByText('Action').closest('div')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('SheetClose', () => {
    it('renders close button', () => {
      render(
        <SheetClose>Close Sheet</SheetClose>
      )

      const closeButton = screen.getByTestId('sheet-close')
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveTextContent('Close Sheet')
    })
  })

  describe('Integration', () => {
    it('works as a complete sheet component', () => {
      render(
        <Sheet>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription>Sheet description text</SheetDescription>
            </SheetHeader>
            <div>Main content area</div>
            <SheetFooter>
              <SheetClose>Cancel</SheetClose>
              <button>Save</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )

      expect(screen.getByText('Open Sheet')).toBeInTheDocument()
      expect(screen.getByText('Sheet Title')).toBeInTheDocument()
      expect(screen.getByText('Sheet description text')).toBeInTheDocument()
      expect(screen.getByText('Main content area')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('supports all side variants', () => {
      const sides = ['left', 'right', 'top', 'bottom'] as const
      
      sides.forEach(side => {
        const { unmount } = render(
          <Sheet>
            <SheetContent side={side}>Content for {side}</SheetContent>
          </Sheet>
        )

        const content = screen.getByTestId('sheet-content')
        expect(content).toBeInTheDocument()
        
        unmount()
      })
    })

    it('handles accessibility attributes', () => {
      render(
        <Sheet>
          <SheetContent>
            <SheetTitle>Accessible Title</SheetTitle>
            <SheetDescription>Accessible Description</SheetDescription>
          </SheetContent>
        </Sheet>
      )

      const closeButton = screen.getByTestId('sheet-close')
      expect(closeButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring')
      
      const srOnlyText = screen.getByText('Close')
      expect(srOnlyText).toHaveClass('sr-only')
    })
  })
})