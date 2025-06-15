import { IssueFormData } from '@/lib/types/issue';
import { AIEnhancements } from '@/lib/services/ai-enhancement';

export function getDefaultEnhancements(type: IssueFormData['type']): AIEnhancements {
  const defaults: Record<IssueFormData['type'], AIEnhancements> = {
    feature: {
      acceptanceCriteria: [
        'Feature functions as described in requirements',
        'User interface is intuitive and accessible',
        'Feature integrates seamlessly with existing functionality',
      ],
      edgeCases: [
        'Handle empty or invalid input gracefully',
        'Consider performance with large datasets',
        'Ensure proper error handling and user feedback',
      ],
      technicalConsiderations: [
        'Follow existing code patterns and conventions',
        'Add comprehensive test coverage',
        'Consider security implications',
        'Document API changes if applicable',
      ],
      finalPrompt: `Implement this feature following TDD principles:
1. Write failing tests first
2. Implement minimal code to pass tests
3. Refactor for clarity and performance
4. Ensure all tests pass before completing`,
    },
    bug: {
      acceptanceCriteria: [
        'Bug is fixed and original functionality restored',
        'No regression in related features',
        'Tests added to prevent recurrence',
      ],
      edgeCases: [
        'Verify fix with various input scenarios',
        'Test edge cases that might trigger similar bugs',
        'Ensure fix doesn\'t break existing functionality',
      ],
      technicalConsiderations: [
        'Identify root cause, not just symptoms',
        'Add regression tests',
        'Update documentation if needed',
        'Consider performance impact of fix',
      ],
      finalPrompt: `Fix this bug systematically:
1. Reproduce the issue with a failing test
2. Implement the fix
3. Verify all tests pass
4. Check for similar issues in related code`,
    },
    epic: {
      acceptanceCriteria: [
        'All sub-features are implemented and integrated',
        'Epic delivers promised business value',
        'Performance meets requirements',
        'User experience is cohesive across features',
      ],
      edgeCases: [
        'Consider feature interactions and dependencies',
        'Plan for gradual rollout if needed',
        'Handle data migration scenarios',
        'Consider backward compatibility',
      ],
      technicalConsiderations: [
        'Design for scalability and maintainability',
        'Consider architectural implications',
        'Plan monitoring and observability',
        'Document architectural decisions',
      ],
      finalPrompt: `Implement this epic systematically:
1. Break down into manageable sub-tasks
2. Implement each feature with tests
3. Ensure proper integration between features
4. Validate overall functionality and performance`,
    },
    'technical-debt': {
      acceptanceCriteria: [
        'Code is refactored without changing functionality',
        'All tests continue to pass',
        'Code quality metrics improve',
        'Performance is maintained or improved',
      ],
      edgeCases: [
        'Maintain backward compatibility',
        'Preserve all existing functionality',
        'Handle deprecation warnings appropriately',
        'Consider impact on dependent code',
      ],
      technicalConsiderations: [
        'Maintain test coverage throughout',
        'Document significant changes',
        'Consider performance implications',
        'Update related documentation',
      ],
      finalPrompt: `Refactor this code carefully:
1. Ensure all tests pass before starting
2. Refactor incrementally with frequent test runs
3. Maintain functionality while improving code quality
4. Update documentation to reflect changes`,
    },
  };

  return defaults[type];
}