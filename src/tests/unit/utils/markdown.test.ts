import { generateMarkdown, sanitizeMarkdown, formatMarkdownForGitHub } from '@/lib/utils/markdown';
import { IssueFormData } from '@/lib/types/issue';

describe('Markdown Utilities', () => {
  const mockIssueData: IssueFormData = {
    type: 'feature',
    title: 'Test Feature',
    description: 'Test description',
    context: {
      businessValue: 'Test value',
      targetUsers: 'Test users',
      successCriteria: 'Test criteria',
    },
    technical: {
      components: ['Component1'],
    },
    implementation: {
      requirements: 'Test requirements',
      dependencies: [],
      approach: 'Test approach',
      affectedFiles: [],
    },
  };

  describe('generateMarkdown', () => {
    it('generates markdown for feature type', () => {
      const markdown = generateMarkdown(mockIssueData);
      expect(markdown).toContain('# Test Feature');
      expect(markdown).toContain('## Overview');
    });

    it('generates markdown for bug type', () => {
      const bugData: IssueFormData = {
        ...mockIssueData,
        type: 'bug',
        technical: {
          ...mockIssueData.technical,
          stepsToReproduce: 'Step 1, Step 2',
          expectedBehavior: 'Should work',
          actualBehavior: 'Does not work',
        },
      };
      
      const markdown = generateMarkdown(bugData);
      expect(markdown).toContain('## Bug Description');
      expect(markdown).toContain('## Steps to Reproduce');
    });

    it('generates markdown for epic type', () => {
      const epicData: IssueFormData = {
        ...mockIssueData,
        type: 'epic',
        technical: {
          ...mockIssueData.technical,
          subFeatures: ['Feature 1', 'Feature 2'],
        },
      };
      
      const markdown = generateMarkdown(epicData);
      expect(markdown).toContain('## Epic Overview');
      expect(markdown).toContain('## Sub-Features');
    });

    it('generates markdown for technical-debt type', () => {
      const debtData: IssueFormData = {
        ...mockIssueData,
        type: 'technical-debt',
        technical: {
          ...mockIssueData.technical,
          improvementAreas: ['Area 1', 'Area 2'],
        },
      };
      
      const markdown = generateMarkdown(debtData);
      expect(markdown).toContain('## Technical Debt Description');
      expect(markdown).toContain('## Current Problems');
    });
  });

  describe('sanitizeMarkdown', () => {
    it('removes script tags', () => {
      const dirty = '# Title\n<script>alert("xss")</script>\nContent';
      const clean = sanitizeMarkdown(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('# Title');
      expect(clean).toContain('Content');
    });

    it('removes iframe tags', () => {
      const dirty = '# Title\n<iframe src="evil.com"></iframe>\nContent';
      const clean = sanitizeMarkdown(dirty);
      expect(clean).not.toContain('<iframe>');
      expect(clean).toContain('# Title');
    });

    it('removes javascript: protocols', () => {
      const dirty = '[Link](javascript:alert("xss"))';
      const clean = sanitizeMarkdown(dirty);
      expect(clean).not.toContain('javascript:');
    });

    it('removes inline event handlers', () => {
      const dirty = '<div onclick="alert(\'xss\')">Content</div>';
      const clean = sanitizeMarkdown(dirty);
      expect(clean).not.toContain('onclick=');
    });

    it('preserves legitimate markdown', () => {
      const legitimate = '# Title\n\n- Item 1\n- Item 2\n\n```javascript\nconst x = 1;\n```';
      const clean = sanitizeMarkdown(legitimate);
      expect(clean).toBe(legitimate);
    });
  });

  describe('formatMarkdownForGitHub', () => {
    it('collapses multiple line breaks', () => {
      const markdown = '# Title\n\n\n\nContent\n\n\n\n\nMore content';
      const formatted = formatMarkdownForGitHub(markdown);
      expect(formatted).toBe('# Title\n\nContent\n\nMore content');
    });

    it('trims whitespace', () => {
      const markdown = '\n\n# Title\n\nContent\n\n';
      const formatted = formatMarkdownForGitHub(markdown);
      expect(formatted).toBe('# Title\n\nContent');
    });

    it('preserves single and double line breaks', () => {
      const markdown = '# Title\n\nParagraph 1\nLine 2\n\nParagraph 2';
      const formatted = formatMarkdownForGitHub(markdown);
      expect(formatted).toBe('# Title\n\nParagraph 1\nLine 2\n\nParagraph 2');
    });
  });
});