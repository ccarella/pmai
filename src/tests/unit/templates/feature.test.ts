import { featureTemplate } from '@/lib/templates/feature';
import { IssueFormData } from '@/lib/types/issue';

describe('featureTemplate', () => {
  const mockFeatureData: IssueFormData = {
    type: 'feature',
    title: 'Add Dark Mode Support',
    description: 'Implement a dark mode toggle that allows users to switch between light and dark themes',
    context: {
      businessValue: 'Improves user experience and accessibility for users who prefer dark interfaces',
      targetUsers: 'All application users, especially those working in low-light environments',
      successCriteria: '90% of users can successfully toggle dark mode',
    },
    technical: {
      components: ['Header', 'ThemeProvider', 'Settings'],
    },
    implementation: {
      requirements: 'Theme should persist across sessions and respect system preferences',
      dependencies: ['theme-ui', 'local-storage'],
      approach: 'Use CSS variables for theme colors and React Context for state management',
      affectedFiles: ['src/components/Header.tsx', 'src/providers/ThemeProvider.tsx'],
    },
    aiEnhancements: {
      acceptanceCriteria: [
        'Dark mode toggle is accessible via settings',
        'Theme preference persists across sessions',
        'All UI components properly support dark mode',
      ],
      edgeCases: [
        'System theme changes while app is running',
        'LocalStorage is disabled',
      ],
      technicalConsiderations: [
        'Ensure sufficient color contrast for accessibility',
        'Test with different color blindness simulations',
      ],
    },
  };

  it('generates markdown with all sections', () => {
    const markdown = featureTemplate(mockFeatureData);
    
    expect(markdown).toContain('# Add Dark Mode Support');
    expect(markdown).toContain('## Overview');
    expect(markdown).toContain('## Business Context');
    expect(markdown).toContain('## Technical Details');
    expect(markdown).toContain('## Implementation Approach');
    expect(markdown).toContain('## Acceptance Criteria');
  });

  it('includes business context details', () => {
    const markdown = featureTemplate(mockFeatureData);
    
    expect(markdown).toContain('**Value:** Improves user experience');
    expect(markdown).toContain('**Target Users:** All application users');
    expect(markdown).toContain('**Success Criteria:** 90% of users');
  });

  it('lists technical components', () => {
    const markdown = featureTemplate(mockFeatureData);
    
    expect(markdown).toContain('- Header');
    expect(markdown).toContain('- ThemeProvider');
    expect(markdown).toContain('- Settings');
  });

  it('includes AI enhancements when provided', () => {
    const markdown = featureTemplate(mockFeatureData);
    
    expect(markdown).toContain('1. Dark mode toggle is accessible via settings');
    expect(markdown).toContain('- System theme changes while app is running');
    expect(markdown).toContain('- Ensure sufficient color contrast');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalData: IssueFormData = {
      ...mockFeatureData,
      context: {
        ...mockFeatureData.context,
        successCriteria: '',
      },
      technical: {
        components: [],
      },
      implementation: {
        ...mockFeatureData.implementation,
        dependencies: [],
        affectedFiles: [],
      },
      aiEnhancements: undefined,
    };

    const markdown = featureTemplate(minimalData);
    
    expect(markdown).not.toContain('**Success Criteria:**');
    expect(markdown).toContain('- No components specified');
    expect(markdown).toContain('- No dependencies identified');
    expect(markdown).toContain('- No specific files identified yet');
    expect(markdown).not.toContain('## Acceptance Criteria');
  });

  it('includes attribution footer', () => {
    const markdown = featureTemplate(mockFeatureData);
    
    expect(markdown).toContain('*Generated with [GitHub Issue Generator for Claude Code]');
  });
});