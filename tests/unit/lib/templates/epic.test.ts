import { epicTemplate } from '@/lib/templates/epic';
import { IssueFormData } from '@/lib/types/issue';

describe('epicTemplate', () => {
  const baseEpicData: IssueFormData = {
    type: 'epic',
    title: 'User Authentication System',
    description: 'Implement complete authentication and authorization',
    context: {
      businessValue: 'Enable secure user access and personalization',
      targetUsers: 'All platform users',
      successCriteria: '100% secure authentication coverage',
    },
    technical: {
      subFeatures: ['Login/Logout', 'Password Reset', 'OAuth Integration'],
      components: ['Auth', 'Database', 'API'],
    },
    implementation: {
      requirements: 'Support multiple auth providers',
      dependencies: ['NextAuth', 'JWT', 'bcrypt'],
      approach: 'Implement incrementally with feature flags',
      affectedFiles: ['auth/', 'api/auth/', 'middleware.ts'],
    },
    aiEnhancements: {
      acceptanceCriteria: ['All auth flows work', 'Security best practices'],
      edgeCases: ['Token expiration', 'Concurrent sessions'],
      technicalConsiderations: ['Session management', 'GDPR compliance'],
    }
  };

  it('generates complete epic template with all fields', () => {
    const result = epicTemplate(baseEpicData);
    
    // Check title and description
    expect(result).toContain('# User Authentication System');
    expect(result).toContain('## Epic Overview');
    expect(result).toContain('Implement complete authentication and authorization');
    
    // Check epic-specific fields
    expect(result).toContain('## Sub-Features');
    expect(result).toContain('1. Login/Logout');
    expect(result).toContain('2. Password Reset');
    expect(result).toContain('3. OAuth Integration');
    
    // Check business context
    expect(result).toContain('## Business Justification');
    expect(result).toContain('**Target Users:** All platform users');
    expect(result).toContain('**Strategic Value:** Enable secure user access and personalization');
    
    // Check technical details
    expect(result).toContain('## Technical Scope');
    expect(result).toContain('### High-Level Requirements');
    expect(result).toContain('Support multiple auth providers');
    expect(result).toContain('- Auth');
    expect(result).toContain('- Database');
    expect(result).toContain('- API');
    expect(result).toContain('- NextAuth');
    expect(result).toContain('- JWT');
    expect(result).toContain('- bcrypt');
    
    // Check implementation
    expect(result).toContain('## Implementation Strategy');
    expect(result).toContain('Implement incrementally with feature flags');
    expect(result).toContain('**Success Metrics:** 100% secure authentication coverage');
    
    // Check AI enhancements with epic-specific labels
    expect(result).toContain('## Definition of Done');
    expect(result).toContain('1. All auth flows work');
    expect(result).toContain('2. Security best practices');
    expect(result).toContain('## Risk Factors & Edge Cases');
    expect(result).toContain('- Token expiration');
    expect(result).toContain('- Concurrent sessions');
    
    // Check implementation phases section
    expect(result).toContain('## Implementation Phases');
    expect(result).toContain('This epic should be broken down into the following issues:');
    expect(result).toContain('1. [To be defined based on sub-features]');
    expect(result).toContain('2. [Additional phases to be planned]');
    
    // Check footer
    expect(result).toContain('Generated with [GitHub Issue Generator for Claude Code]');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalData: IssueFormData = {
      type: 'epic',
      title: 'Epic title',
      description: 'Epic description',
      context: {
        businessValue: '',
        targetUsers: '',
        successCriteria: '',
      },
      technical: {
        subFeatures: [],
        components: [],
      },
      implementation: {
        requirements: '',
        dependencies: [],
        approach: '',
        affectedFiles: []
      }
    };
    
    const result = epicTemplate(minimalData);
    
    // Check required fields are present
    expect(result).toContain('# Epic title');
    expect(result).toContain('Epic description');
    
    // Check empty arrays show fallback text
    expect(result).toContain('No sub-features defined');
    expect(result).toContain('- To be determined during planning');
    expect(result).toContain('- To be identified during technical planning');
    expect(result).toContain('- To be determined during implementation planning');
    
    // Should not show AI enhancements section
    expect(result).not.toContain('## AI Enhancement Suggestions');
  });

  it('formats sub-features as numbered list', () => {
    const dataWithManyFeatures: IssueFormData = {
      ...baseEpicData,
      technical: {
        ...baseEpicData.technical,
        subFeatures: ['Feature A', 'Feature B', 'Feature C', 'Feature D']
      }
    };
    
    const result = epicTemplate(dataWithManyFeatures);
    
    expect(result).toContain('1. Feature A');
    expect(result).toContain('2. Feature B');
    expect(result).toContain('3. Feature C');
    expect(result).toContain('4. Feature D');
  });

  it('uses "Definition of Done" instead of "Acceptance Criteria"', () => {
    const result = epicTemplate(baseEpicData);
    
    // Should use epic-specific terminology
    expect(result).toContain('## Definition of Done');
    expect(result).not.toContain('## Acceptance Criteria');
  });

  it('handles special characters in content', () => {
    const dataWithSpecialChars: IssueFormData = {
      ...baseEpicData,
      title: 'Epic with "quotes" & special chars',
      description: 'Epic with `code blocks` and **bold text**',
      technical: {
        ...baseEpicData.technical,
        subFeatures: ['Feature with (parentheses)', 'Feature with [brackets]']
      }
    };
    
    const result = epicTemplate(dataWithSpecialChars);
    
    expect(result).toContain('# Epic with "quotes" & special chars');
    expect(result).toContain('Epic with `code blocks` and **bold text**');
    expect(result).toContain('1. Feature with (parentheses)');
    expect(result).toContain('2. Feature with [brackets]');
  });

  it('includes implementation phases section', () => {
    const result = epicTemplate(baseEpicData);
    
    // Check that implementation phases section exists
    expect(result).toContain('## Implementation Phases');
    expect(result).toContain('This epic should be broken down into the following issues:');
    expect(result).toContain('1. [To be defined based on sub-features]');
    expect(result).toContain('2. [Additional phases to be planned]');
  });

  it('handles empty sub-features array', () => {
    const dataWithNoSubFeatures: IssueFormData = {
      ...baseEpicData,
      technical: {
        ...baseEpicData.technical,
        subFeatures: []
      }
    };
    
    const result = epicTemplate(dataWithNoSubFeatures);
    
    expect(result).toContain('No sub-features defined');
  });

  it('only shows success criteria when provided', () => {
    const dataWithoutCriteria: IssueFormData = {
      ...baseEpicData,
      context: {
        ...baseEpicData.context,
        successCriteria: ''
      }
    };
    
    const result = epicTemplate(dataWithoutCriteria);
    
    expect(result).not.toContain('**Success Criteria:**');
  });

  it('maintains proper markdown formatting', () => {
    const result = epicTemplate(baseEpicData);
    
    // Check for proper heading levels
    expect(result).toMatch(/^# /m); // H1
    expect(result).toMatch(/^## /m); // H2
    expect(result).toMatch(/^### High-Level Requirements/m); // H3
    
    // Check for proper line breaks between sections
    expect(result).toMatch(/\n\n## Business Justification/);
    expect(result).toMatch(/\n\n## Sub-Features/);
    expect(result).toMatch(/\n\n## Technical Scope/);
    expect(result).toMatch(/\n\n## Implementation Strategy/);
    expect(result).toMatch(/\n\n## Implementation Phases/);
    
    // Check footer has proper spacing
    expect(result).toMatch(/\n\n---\n\*Generated with/);
  });

  it('properly formats affected files array', () => {
    const result = epicTemplate(baseEpicData);
    
    expect(result).toContain('### Initial Files/Areas of Impact');
    expect(result).toContain('- `auth/`');
    expect(result).toContain('- `api/auth/`');
    expect(result).toContain('- `middleware.ts`');
  });
});