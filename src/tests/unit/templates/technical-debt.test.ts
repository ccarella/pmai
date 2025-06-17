import { technicalDebtTemplate } from '@/lib/templates/technical-debt';
import { IssueFormData } from '@/lib/types/issue';

describe('technicalDebtTemplate', () => {
  const baseIssueData: IssueFormData = {
    type: 'technical-debt',
    title: 'Refactor authentication module to reduce complexity',
    description: 'The current authentication implementation has grown complex with multiple auth providers and needs refactoring for maintainability.',
    context: {
      businessValue: 'Reduces development time by 30% for auth-related features',
      targetUsers: 'Development team and QA engineers',
      successCriteria: 'Code complexity reduced by 40%, test coverage increased to 90%',
    },
    technical: {
      improvementAreas: [
        'Extract auth provider logic into separate modules',
        'Implement strategy pattern for different auth methods',
        'Reduce coupling between auth service and UI components',
      ],
      components: ['AuthService', 'LoginController', 'SessionManager', 'AuthProviders'],
    },
    implementation: {
      requirements: 'Maintain backward compatibility while refactoring core auth logic',
      dependencies: ['auth0-js', 'passport', 'jsonwebtoken'],
      approach: 'Gradually refactor using the strangler fig pattern to minimize risk',
      affectedFiles: [
        'src/services/auth.ts',
        'src/controllers/login.ts',
        'src/providers/oauth.ts',
      ],
    },
  };

  it('generates a complete technical debt report with all fields', () => {
    const result = technicalDebtTemplate(baseIssueData);

    // Check title
    expect(result).toContain('# Refactor authentication module to reduce complexity');

    // Check description
    expect(result).toContain('## Technical Debt Description');
    expect(result).toContain('The current authentication implementation has grown complex');

    // Check current problems
    expect(result).toContain('## Current Problems');
    expect(result).toContain('1. Extract auth provider logic into separate modules');
    expect(result).toContain('2. Implement strategy pattern for different auth methods');
    expect(result).toContain('3. Reduce coupling between auth service and UI components');

    // Check business justification
    expect(result).toContain('**Impact on Development:** Reduces development time by 30%');
    expect(result).toContain('**Affected Teams/Users:** Development team and QA engineers');
    expect(result).toContain('**Success Metrics:** Code complexity reduced by 40%');

    // Check technical details
    expect(result).toContain('**Components Requiring Refactoring:**');
    expect(result).toContain('- AuthService');
    expect(result).toContain('- LoginController');
    expect(result).toContain('- SessionManager');
    expect(result).toContain('- AuthProviders');

    // Check refactoring plan
    expect(result).toContain('## Refactoring Plan');
    expect(result).toContain('Gradually refactor using the strangler fig pattern');
    expect(result).toContain('### Requirements');
    expect(result).toContain('Maintain backward compatibility');
    expect(result).toContain('### Dependencies');
    expect(result).toContain('- auth0-js');
    expect(result).toContain('- passport');
    expect(result).toContain('### Files to Refactor');
    expect(result).toContain('- `src/services/auth.ts`');
    expect(result).toContain('- `src/controllers/login.ts`');

    // Check migration strategy
    expect(result).toContain('## Migration Strategy');
    expect(result).toContain('- [ ] Create comprehensive test coverage before refactoring');
    expect(result).toContain('- [ ] Implement changes incrementally');
    expect(result).toContain('- [ ] Ensure backward compatibility where needed');
    expect(result).toContain('- [ ] Update documentation');

    // Check footer
    expect(result).toContain('*Generated with [GitHub Issue Generator for Claude Code]');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalData: IssueFormData = {
      ...baseIssueData,
      context: {
        ...baseIssueData.context,
        successCriteria: undefined,
      },
      technical: {
        improvementAreas: [],
        components: [],
      },
      implementation: {
        ...baseIssueData.implementation,
        dependencies: [],
        affectedFiles: [],
      },
    };

    const result = technicalDebtTemplate(minimalData);

    // Check defaults for missing fields
    expect(result).toContain('## Current Problems\nNo specific improvement areas identified');
    expect(result).not.toContain('**Success Metrics:**');
    expect(result).toContain('- No components specified');
    expect(result).toContain('- No blocking dependencies');
    expect(result).toContain('- To be identified during analysis');
  });

  it('includes AI enhancements when provided', () => {
    const dataWithAI: IssueFormData = {
      ...baseIssueData,
      aiEnhancements: {
        acceptanceCriteria: [
          'All existing auth flows continue to work without changes',
          'New auth provider can be added in under 2 hours',
          'Unit test coverage reaches 90% for auth module',
        ],
        edgeCases: [
          'Migration of existing user sessions',
          'Rollback strategy if issues arise',
          'Performance impact during transition',
        ],
        technicalConsiderations: [
          'Use feature flags for gradual rollout',
          'Implement comprehensive logging for debugging',
          'Consider caching strategy for auth tokens',
        ],
      },
    };

    const result = technicalDebtTemplate(dataWithAI);

    // Check acceptance criteria
    expect(result).toContain('## Acceptance Criteria');
    expect(result).toContain('1. All existing auth flows continue to work without changes');
    expect(result).toContain('2. New auth provider can be added in under 2 hours');
    expect(result).toContain('3. Unit test coverage reaches 90% for auth module');

    // Check potential risks (mapped from edge cases)
    expect(result).toContain('## Potential Risks');
    expect(result).toContain('- Migration of existing user sessions');
    expect(result).toContain('- Rollback strategy if issues arise');
    expect(result).toContain('- Performance impact during transition');

    // Check technical considerations
    expect(result).toContain('## Technical Considerations');
    expect(result).toContain('- Use feature flags for gradual rollout');
    expect(result).toContain('- Implement comprehensive logging for debugging');
    expect(result).toContain('- Consider caching strategy for auth tokens');
  });

  it('excludes AI sections when not provided', () => {
    const result = technicalDebtTemplate(baseIssueData);

    expect(result).not.toContain('## Acceptance Criteria\n1.');
    expect(result).not.toContain('## Potential Risks');
    expect(result).not.toContain('## Technical Considerations\n-');
  });

  it('handles improvement areas with special formatting', () => {
    const dataWithFormattedAreas: IssueFormData = {
      ...baseIssueData,
      technical: {
        ...baseIssueData.technical,
        improvementAreas: [
          'Replace deprecated `auth.login()` with new `authService.authenticate()`',
          'Remove circular dependency between User and Auth modules',
          'Update to OAuth 2.0 from 1.0 (breaking change)',
        ],
      },
    };

    const result = technicalDebtTemplate(dataWithFormattedAreas);

    expect(result).toContain('1. Replace deprecated `auth.login()` with new `authService.authenticate()`');
    expect(result).toContain('2. Remove circular dependency between User and Auth modules');
    expect(result).toContain('3. Update to OAuth 2.0 from 1.0 (breaking change)');
  });

  it('handles undefined improvement areas', () => {
    const dataWithUndefinedAreas: IssueFormData = {
      ...baseIssueData,
      technical: {
        components: ['AuthService'],
        improvementAreas: undefined as unknown as string[], // Simulating undefined
      },
    };

    const result = technicalDebtTemplate(dataWithUndefinedAreas);

    expect(result).toContain('## Current Problems\nNo specific improvement areas identified');
  });

  it('formats components with special characters correctly', () => {
    const dataWithSpecialComponents: IssueFormData = {
      ...baseIssueData,
      technical: {
        ...baseIssueData.technical,
        components: [
          'Auth/OAuth2Provider',
          'Services.Authentication',
          '@auth/token-manager',
          'User<Session>Handler',
        ],
      },
    };

    const result = technicalDebtTemplate(dataWithSpecialComponents);

    expect(result).toContain('- Auth/OAuth2Provider');
    expect(result).toContain('- Services.Authentication');
    expect(result).toContain('- @auth/token-manager');
    expect(result).toContain('- User<Session>Handler');
  });

  it('handles empty strings in context fields', () => {
    const dataWithEmptyStrings: IssueFormData = {
      ...baseIssueData,
      context: {
        businessValue: '',
        targetUsers: '',
        successCriteria: '',
      },
    };

    const result = technicalDebtTemplate(dataWithEmptyStrings);

    // Empty strings still display the field values (empty)
    expect(result).toContain('**Impact on Development:** ');
    expect(result).toContain('**Affected Teams/Users:** ');
    // Empty success criteria is treated as falsy and not shown
    expect(result).not.toContain('**Success Metrics:**');
  });

  it('escapes backticks in file paths properly', () => {
    const dataWithBackticks: IssueFormData = {
      ...baseIssueData,
      implementation: {
        ...baseIssueData.implementation,
        affectedFiles: [
          'src/utils/`deprecated`.ts',
          'src/auth/`legacy`/handler.ts',
          'src/normal/file.ts',
        ],
      },
    };

    const result = technicalDebtTemplate(dataWithBackticks);

    expect(result).toContain('- `src/utils/`deprecated`.ts`');
    expect(result).toContain('- `src/auth/`legacy`/handler.ts`');
    expect(result).toContain('- `src/normal/file.ts`');
  });

  it('handles very long improvement area descriptions', () => {
    const dataWithLongAreas: IssueFormData = {
      ...baseIssueData,
      technical: {
        ...baseIssueData.technical,
        improvementAreas: [
          'This is a very long improvement area description that explains in great detail why we need to refactor the authentication module, including all the technical debt that has accumulated over the years and the specific problems it causes in our daily development workflow',
        ],
      },
    };

    const result = technicalDebtTemplate(dataWithLongAreas);

    expect(result).toContain('1. This is a very long improvement area description');
    expect(result).toContain('daily development workflow');
  });
});