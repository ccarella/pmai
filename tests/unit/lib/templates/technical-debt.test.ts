import { technicalDebtTemplate } from '@/lib/templates/technical-debt';
import { IssueFormData } from '@/lib/types/issue';

describe('technicalDebtTemplate', () => {
  const baseTechDebtData: IssueFormData = {
    type: 'technical-debt',
    title: 'Refactor Authentication Module',
    description: 'Modernize the authentication system to improve maintainability',
    context: {
      businessValue: 'Reduce maintenance costs and improve developer velocity',
      targetUsers: 'Development team',
      successCriteria: 'All tests pass, improved code metrics',
    },
    technical: {
      improvementAreas: ['Code organization', 'Type safety', 'Performance'],
      components: ['Auth', 'Middleware', 'Utils'],
    },
    implementation: {
      requirements: 'Maintain backward compatibility',
      dependencies: ['TypeScript', 'Jest'],
      approach: 'Incremental refactoring with tests',
      affectedFiles: ['src/auth/', 'src/middleware/', 'src/utils/auth.ts'],
    },
    aiEnhancements: {
      acceptanceCriteria: ['No functionality changes', 'Improved type coverage'],
      edgeCases: ['Migration rollback', 'Concurrent updates'],
      technicalConsiderations: ['Database schema changes', 'API versioning'],
    }
  };

  it('generates complete technical debt template with all fields', () => {
    const result = technicalDebtTemplate(baseTechDebtData);
    
    // Check title and description
    expect(result).toContain('# Refactor Authentication Module');
    expect(result).toContain('## Technical Debt Description');
    expect(result).toContain('Modernize the authentication system to improve maintainability');
    
    // Check technical-debt-specific fields
    expect(result).toContain('## Current Problems');
    expect(result).toContain('1. Code organization');
    expect(result).toContain('2. Type safety');
    expect(result).toContain('3. Performance');
    
    // Check business context
    expect(result).toContain('## Business Justification');
    expect(result).toContain('**Affected Teams/Users:** Development team');
    expect(result).toContain('**Impact on Development:** Reduce maintenance costs and improve developer velocity');
    
    // Check technical details
    expect(result).toContain('## Technical Details');
    expect(result).toContain('**Components Requiring Refactoring:**');
    expect(result).toContain('- Auth');
    expect(result).toContain('- Middleware');
    expect(result).toContain('- Utils');
    
    // Check implementation
    expect(result).toContain('## Refactoring Plan');
    expect(result).toContain('Incremental refactoring with tests');
    expect(result).toContain('### Requirements');
    expect(result).toContain('Maintain backward compatibility');
    expect(result).toContain('### Dependencies');
    expect(result).toContain('- TypeScript');
    expect(result).toContain('- Jest');
    expect(result).toContain('**Success Metrics:** All tests pass, improved code metrics');
    
    // Check AI enhancements
    expect(result).toContain('## Acceptance Criteria');
    expect(result).toContain('1. No functionality changes');
    expect(result).toContain('2. Improved type coverage');
    expect(result).toContain('## Potential Risks');
    expect(result).toContain('- Migration rollback');
    expect(result).toContain('- Concurrent updates');
    expect(result).toContain('## Technical Considerations');
    expect(result).toContain('- Database schema changes');
    expect(result).toContain('- API versioning');
    
    // Check migration strategy section
    expect(result).toContain('## Migration Strategy');
    expect(result).toContain('- [ ] Create comprehensive test coverage before refactoring');
    expect(result).toContain('- [ ] Implement changes incrementally');
    expect(result).toContain('- [ ] Ensure backward compatibility where needed');
    expect(result).toContain('- [ ] Update documentation');
    
    // Check footer
    expect(result).toContain('Generated with [GitHub Issue Generator for Claude Code]');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalData: IssueFormData = {
      type: 'technical-debt',
      title: 'Tech debt title',
      description: 'Tech debt description',
      context: {
        businessValue: '',
        targetUsers: '',
        successCriteria: '',
      },
      technical: {
        improvementAreas: [],
        components: [],
      },
      implementation: {
        requirements: '',
        dependencies: [],
        approach: '',
        affectedFiles: []
      }
    };
    
    const result = technicalDebtTemplate(minimalData);
    
    // Check required fields are present
    expect(result).toContain('# Tech debt title');
    expect(result).toContain('Tech debt description');
    
    // Check empty arrays show fallback text
    expect(result).toContain('No specific improvement areas identified');
    expect(result).toContain('- No components specified');
    expect(result).toContain('- No blocking dependencies');
    expect(result).toContain('- To be identified during analysis');
    
    // Should not show AI enhancements section
    expect(result).not.toContain('## AI Enhancement Suggestions');
  });

  it('uses "Refactoring Plan" instead of "Implementation Approach"', () => {
    const result = technicalDebtTemplate(baseTechDebtData);
    
    // Should use technical-debt-specific terminology
    expect(result).toContain('## Refactoring Plan');
    expect(result).not.toContain('## Implementation Details');
  });

  it('formats improvement areas as numbered list', () => {
    const dataWithManyAreas: IssueFormData = {
      ...baseTechDebtData,
      technical: {
        ...baseTechDebtData.technical,
        improvementAreas: ['Performance', 'Security', 'Maintainability', 'Testing', 'Documentation']
      }
    };
    
    const result = technicalDebtTemplate(dataWithManyAreas);
    
    expect(result).toContain('1. Performance');
    expect(result).toContain('2. Security');
    expect(result).toContain('3. Maintainability');
    expect(result).toContain('4. Testing');
    expect(result).toContain('5. Documentation');
  });

  it('handles special characters in content', () => {
    const dataWithSpecialChars: IssueFormData = {
      ...baseTechDebtData,
      title: 'Refactor "legacy" code & improve',
      description: 'Fix `deprecated` methods and **critical** issues',
      technical: {
        ...baseTechDebtData.technical,
        improvementAreas: ['Remove TODO(s)', 'Fix @deprecated items']
      }
    };
    
    const result = technicalDebtTemplate(dataWithSpecialChars);
    
    expect(result).toContain('# Refactor "legacy" code & improve');
    expect(result).toContain('Fix `deprecated` methods and **critical** issues');
    expect(result).toContain('1. Remove TODO(s)');
    expect(result).toContain('2. Fix @deprecated items');
  });

  it('includes migration strategy checklist', () => {
    const result = technicalDebtTemplate(baseTechDebtData);
    
    // Check that all migration steps are included as checkboxes
    expect(result).toMatch(/- \[ \] Create comprehensive test coverage before refactoring/);
    expect(result).toMatch(/- \[ \] Implement changes incrementally/);
    expect(result).toMatch(/- \[ \] Ensure backward compatibility where needed/);
    expect(result).toMatch(/- \[ \] Update documentation/);
  });

  it('handles empty improvement areas array', () => {
    const dataWithNoAreas: IssueFormData = {
      ...baseTechDebtData,
      technical: {
        ...baseTechDebtData.technical,
        improvementAreas: []
      }
    };
    
    const result = technicalDebtTemplate(dataWithNoAreas);
    
    expect(result).toContain('No specific improvement areas identified');
  });

  it('only shows success criteria when provided', () => {
    const dataWithoutCriteria: IssueFormData = {
      ...baseTechDebtData,
      context: {
        ...baseTechDebtData.context,
        successCriteria: ''
      }
    };
    
    const result = technicalDebtTemplate(dataWithoutCriteria);
    
    expect(result).not.toContain('**Success Criteria:**');
  });

  it('maintains proper markdown formatting', () => {
    const result = technicalDebtTemplate(baseTechDebtData);
    
    // Check for proper heading levels
    expect(result).toMatch(/^# /m); // H1
    expect(result).toMatch(/^## /m); // H2
    expect(result).toMatch(/^### Requirements/m); // H3
    
    // Check for proper line breaks between sections
    expect(result).toMatch(/\n\n## Current Problems/);
    expect(result).toMatch(/\n\n## Business Justification/);
    expect(result).toMatch(/\n\n## Technical Details/);
    expect(result).toMatch(/\n\n## Refactoring Plan/);
    expect(result).toMatch(/\n\n## Migration Strategy/);
    
    // Check footer has proper spacing
    expect(result).toMatch(/\n\n---\n\*Generated with/);
  });

  it('properly formats all arrays', () => {
    const result = technicalDebtTemplate(baseTechDebtData);
    
    // Components as bullet points
    expect(result).toMatch(/\*\*Components Requiring Refactoring:\*\*\n- Auth\n- Middleware\n- Utils/);
    
    // Dependencies as bullet points
    expect(result).toMatch(/### Dependencies\n- TypeScript\n- Jest/);
    
    // Improvement areas as numbered list
    expect(result).toMatch(/## Current Problems\n1\. Code organization\n2\. Type safety\n3\. Performance/);
  });

  it('handles affected files with paths correctly', () => {
    const result = technicalDebtTemplate(baseTechDebtData);
    
    expect(result).toContain('### Files to Refactor');
    expect(result).toContain('- `src/auth/`');
    expect(result).toContain('- `src/middleware/`');
    expect(result).toContain('- `src/utils/auth.ts`');
  });

  it('includes all AI enhancement sections when provided', () => {
    const result = technicalDebtTemplate(baseTechDebtData);
    
    // All sections should be present
    expect(result).toContain('## Acceptance Criteria');
    expect(result).toContain('## Potential Risks');
    expect(result).toContain('## Technical Considerations');
    
    // Verify content
    expect(result).toContain('Migration rollback');
    expect(result).toContain('Database schema changes');
  });
});