import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarkdownPreview } from '@/components/preview/MarkdownPreview';

describe('MarkdownPreview', () => {
  it('renders markdown content', () => {
    const content = '# Test Heading\n\nThis is test content';
    const { container } = render(<MarkdownPreview content={content} />);
    
    const pre = container.querySelector('pre');
    expect(pre?.textContent).toContain('# Test Heading');
    expect(pre?.textContent).toContain('This is test content');
  });

  it('applies custom className', () => {
    const content = 'Test content';
    const { container } = render(
      <MarkdownPreview content={content} className="custom-class" />
    );
    
    const previewDiv = container.firstChild;
    expect(previewDiv).toHaveClass('custom-class');
  });

  it('renders empty content', () => {
    const { container } = render(<MarkdownPreview content="" />);
    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toBe('');
  });

  it('preserves whitespace formatting', () => {
    const content = '  indented\n    more indented\nno indent';
    const { container } = render(<MarkdownPreview content={content} />);
    
    const pre = container.querySelector('pre');
    expect(pre).toHaveClass('whitespace-pre-wrap');
  });
});