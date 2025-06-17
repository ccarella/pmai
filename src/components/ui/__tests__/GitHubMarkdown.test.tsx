import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GitHubMarkdown } from '../GitHubMarkdown';

// Mock the CSS module
jest.mock('@/components/styles/github-markdown.module.css', () => ({
  markdown: 'markdown'
}));

// Track ReactMarkdown render calls
let renderCount = 0;

// Mock ReactMarkdown to render content directly for testing
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: string }) => {
      renderCount++;
      return <div data-testid="react-markdown">{children}</div>;
    }
  };
});

describe('GitHubMarkdown', () => {
  beforeEach(() => {
    renderCount = 0;
  });

  it('renders the markdown container with content', () => {
    const content = 'Test content';
    const { container } = render(<GitHubMarkdown content={content} />);

    const markdownDiv = container.querySelector('.markdown');
    expect(markdownDiv).toBeInTheDocument();
    expect(markdownDiv).toHaveTextContent('Test content');
  });

  it('applies custom className when provided', () => {
    const { container } = render(<GitHubMarkdown content="Test" className="custom-class" />);
    
    const markdownDiv = container.querySelector('.markdown');
    expect(markdownDiv).toHaveClass('markdown', 'custom-class');
  });

  it('renders content inside markdown wrapper', () => {
    const content = 'Some markdown content';
    const { container } = render(<GitHubMarkdown content={content} />);
    
    expect(container.textContent).toContain('Some markdown content');
  });

  describe('memoization', () => {
    it('should not re-render when props are the same', () => {
      const content = 'Test content';
      const className = 'test-class';
      
      const { rerender } = render(<GitHubMarkdown content={content} className={className} />);
      expect(renderCount).toBe(1);
      
      // Re-render with same props
      rerender(<GitHubMarkdown content={content} className={className} />);
      expect(renderCount).toBe(1); // Should still be 1 due to memoization
    });

    it('should re-render when content prop changes', () => {
      const { rerender } = render(<GitHubMarkdown content="Initial content" />);
      expect(renderCount).toBe(1);
      
      // Re-render with different content
      rerender(<GitHubMarkdown content="Updated content" />);
      expect(renderCount).toBe(2); // Should increment due to prop change
    });

    it('should re-render when className prop changes', () => {
      const content = 'Test content';
      const { rerender } = render(<GitHubMarkdown content={content} className="initial-class" />);
      expect(renderCount).toBe(1);
      
      // Re-render with different className
      rerender(<GitHubMarkdown content={content} className="updated-class" />);
      expect(renderCount).toBe(2); // Should increment due to prop change
    });

    it('should not re-render when parent component re-renders with same props', () => {
      const ParentComponent = ({ value }: { value: number }) => {
        return (
          <div>
            <span>{value}</span>
            <GitHubMarkdown content="Static content" className="static-class" />
          </div>
        );
      };

      const { rerender } = render(<ParentComponent value={1} />);
      expect(renderCount).toBe(1);
      
      // Re-render parent with different value
      rerender(<ParentComponent value={2} />);
      expect(renderCount).toBe(1); // GitHubMarkdown should not re-render
    });

    it('should handle undefined className correctly without re-rendering unnecessarily', () => {
      const content = 'Test content';
      const { rerender } = render(<GitHubMarkdown content={content} />);
      expect(renderCount).toBe(1);
      
      // Re-render with same props (className is undefined)
      rerender(<GitHubMarkdown content={content} />);
      expect(renderCount).toBe(1); // Should not re-render
    });
  });

  it('should have displayName set for debugging', () => {
    expect(GitHubMarkdown.displayName).toBe('GitHubMarkdown');
  });
});