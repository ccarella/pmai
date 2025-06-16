import React from 'react';
import { render, screen } from '@testing-library/react';
import { ClaudePromptPreview } from '@/components/preview/ClaudePromptPreview';

describe('ClaudePromptPreview', () => {
  it('renders Claude prompt content', () => {
    const content = 'Help me implement a feature:\n\n- Create a new component\n- Add tests';
    const { container } = render(<ClaudePromptPreview content={content} />);
    
    const pre = container.querySelector('pre');
    expect(pre?.textContent).toContain('Help me implement a feature:');
    expect(pre?.textContent).toContain('- Create a new component');
    expect(pre?.textContent).toContain('- Add tests');
  });

  it('applies custom className', () => {
    const content = 'Test prompt';
    const { container } = render(
      <ClaudePromptPreview content={content} className="custom-prompt-class" />
    );
    
    const previewDiv = container.firstChild;
    expect(previewDiv).toHaveClass('custom-prompt-class');
  });

  it('renders complex Claude prompts with code blocks', () => {
    const content = `Analyze this code:
\`\`\`javascript
function test() {
  return 'hello';
}
\`\`\``;
    
    const { container } = render(<ClaudePromptPreview content={content} />);
    
    const pre = container.querySelector('pre');
    expect(pre?.textContent).toContain('```javascript');
    expect(pre?.textContent).toContain('function test()');
  });

  it('maintains monospace font styling', () => {
    const content = 'Claude prompt content';
    const { container } = render(<ClaudePromptPreview content={content} />);
    
    const pre = container.querySelector('pre');
    expect(pre).toHaveClass('font-mono');
  });
});