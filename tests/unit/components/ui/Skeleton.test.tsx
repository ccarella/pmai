import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonCard, SkeletonForm } from '@/components/ui/Skeleton';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock animation variants
jest.mock('@/lib/animations/variants', () => ({
  loadingPulse: {
    initial: { opacity: 0.5 },
    animate: { opacity: 1 },
  },
}));

describe('Skeleton', () => {
  describe('Base Skeleton Component', () => {
    it('renders with default props', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild;
      
      expect(skeleton).toHaveClass('bg-muted/20', 'rounded', 'h-4');
      expect(skeleton).toHaveStyle({ width: '100%', height: '1rem' });
    });

    it('renders text variant correctly', () => {
      const { container } = render(<Skeleton variant="text" />);
      const skeleton = container.firstChild;
      
      expect(skeleton).toHaveClass('h-4', 'rounded');
      expect(skeleton).toHaveStyle({ width: '100%', height: '1rem' });
    });

    it('renders circular variant correctly', () => {
      const { container } = render(<Skeleton variant="circular" />);
      const skeleton = container.firstChild;
      
      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).toHaveStyle({ width: '3rem', height: '3rem' });
    });

    it('renders rectangular variant correctly', () => {
      const { container } = render(<Skeleton variant="rectangular" />);
      const skeleton = container.firstChild;
      
      expect(skeleton).toHaveClass('rounded-md');
      expect(skeleton).toHaveStyle({ width: '100%', height: '4rem' });
    });

    it('applies custom width and height', () => {
      const { container } = render(<Skeleton width="200px" height="50px" />);
      const skeleton = container.firstChild;
      
      expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />);
      const skeleton = container.firstChild;
      
      expect(skeleton).toHaveClass('custom-class', 'bg-muted/20', 'rounded');
    });

    it('renders multiple skeletons when count > 1', () => {
      const { container } = render(<Skeleton count={3} />);
      const wrapper = container.firstChild;
      const skeletons = wrapper?.childNodes;
      
      expect(wrapper).toHaveClass('space-y-2');
      expect(skeletons).toHaveLength(3);
      
      // Check that last skeleton has 80% width for text variant
      const lastSkeleton = skeletons?.[2] as HTMLElement;
      expect(lastSkeleton).toHaveStyle({ width: '80%' });
    });

    it('renders multiple skeletons with custom width when not text variant', () => {
      const { container } = render(<Skeleton variant="circular" count={3} width="40px" />);
      const wrapper = container.firstChild;
      const skeletons = wrapper?.childNodes;
      
      expect(skeletons).toHaveLength(3);
      
      // All skeletons should have the custom width
      skeletons?.forEach((skeleton) => {
        expect(skeleton).toHaveStyle({ width: '40px' });
      });
    });
  });

  describe('SkeletonCard Component', () => {
    it('renders without avatar by default', () => {
      const { container } = render(<SkeletonCard />);
      
      // Should render 3 lines by default
      const skeletons = container.querySelectorAll('.bg-muted\\/20');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
      
      // Should not have circular skeleton for avatar
      const circularSkeletons = container.querySelectorAll('.rounded-full');
      expect(circularSkeletons).toHaveLength(0);
    });

    it('renders with avatar when showAvatar is true', () => {
      const { container } = render(<SkeletonCard showAvatar />);
      
      // Should have one circular skeleton for avatar
      const circularSkeleton = container.querySelector('.rounded-full');
      expect(circularSkeleton).toBeInTheDocument();
      expect(circularSkeleton).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('renders custom number of lines', () => {
      const { container } = render(<SkeletonCard lines={5} />);
      
      // Find the skeleton lines (excluding buttons and avatar)
      const lineSkeletons = container.querySelectorAll('.space-y-2 > div');
      expect(lineSkeletons).toHaveLength(5);
    });

    it('renders card container with correct classes', () => {
      const { container } = render(<SkeletonCard />);
      const card = container.firstChild;
      
      expect(card).toHaveClass('bg-card-bg', 'rounded-lg', 'p-6', 'border', 'border-border');
    });

    it('renders action buttons at the bottom', () => {
      const { container } = render(<SkeletonCard />);
      
      // Find button skeletons
      const buttonContainer = container.querySelector('.mt-4.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();
      
      const buttonSkeletons = buttonContainer?.querySelectorAll('.bg-muted\\/20');
      expect(buttonSkeletons).toHaveLength(2);
      
      // Check button dimensions
      buttonSkeletons?.forEach((button) => {
        expect(button).toHaveStyle({ width: '80px', height: '32px' });
      });
    });
  });

  describe('SkeletonForm Component', () => {
    it('renders default number of fields', () => {
      const { container } = render(<SkeletonForm />);
      
      // Should render 3 fields by default
      const fieldContainers = container.querySelectorAll('.space-y-6 > div:not(.flex)');
      expect(fieldContainers).toHaveLength(3);
    });

    it('renders custom number of fields', () => {
      const { container } = render(<SkeletonForm fields={5} />);
      
      const fieldContainers = container.querySelectorAll('.space-y-6 > div:not(.flex)');
      expect(fieldContainers).toHaveLength(5);
    });

    it('renders label and input skeleton for each field', () => {
      const { container } = render(<SkeletonForm fields={2} />);
      
      const fieldContainers = container.querySelectorAll('.space-y-6 > div:not(.flex)');
      
      fieldContainers.forEach((field) => {
        const skeletons = field.querySelectorAll('.bg-muted\\/20');
        expect(skeletons).toHaveLength(2);
        
        // Label skeleton
        expect(skeletons[0]).toHaveStyle({ width: '30%', height: '20px' });
        expect(skeletons[0]).toHaveClass('mb-2');
        
        // Input skeleton
        expect(skeletons[1]).toHaveStyle({ height: '40px' });
      });
    });

    it('renders action buttons at the bottom', () => {
      const { container } = render(<SkeletonForm />);
      
      const buttonContainer = container.querySelector('.flex.gap-3.mt-8');
      expect(buttonContainer).toBeInTheDocument();
      
      const buttonSkeletons = buttonContainer?.querySelectorAll('.bg-muted\\/20');
      expect(buttonSkeletons).toHaveLength(2);
      
      // Check button dimensions
      buttonSkeletons?.forEach((button) => {
        expect(button).toHaveStyle({ width: '100px', height: '40px' });
        expect(button).toHaveClass('rounded-md');
      });
    });

    it('applies correct container classes', () => {
      const { container } = render(<SkeletonForm />);
      const form = container.firstChild;
      
      expect(form).toHaveClass('space-y-6');
    });
  });
});