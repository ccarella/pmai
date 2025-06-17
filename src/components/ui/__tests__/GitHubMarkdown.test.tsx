import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GitHubMarkdown } from '../GitHubMarkdown';

// Mock the CSS module
jest.mock('../styles/github-markdown.module.css', () => ({
  markdown: 'markdown'
}));

// Mock ReactMarkdown to render content directly for testing
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: string }) => <div>{children}</div>
  };
});

describe('GitHubMarkdown', () => {
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
});