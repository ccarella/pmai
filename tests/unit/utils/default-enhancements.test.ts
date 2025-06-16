import { getDefaultEnhancements } from '@/lib/utils/default-enhancements';
import { IssueFormData } from '@/lib/types/issue';
import { AIEnhancements } from '@/lib/services/ai-enhancement';

describe('getDefaultEnhancements', () => {
  it('returns correct enhancements for feature type', () => {
    const enhancements = getDefaultEnhancements('feature');
    
    expect(enhancements).toHaveProperty('acceptanceCriteria');
    expect(enhancements).toHaveProperty('edgeCases');
    expect(enhancements).toHaveProperty('technicalConsiderations');
    expect(enhancements).toHaveProperty('finalPrompt');
    
    expect(enhancements.acceptanceCriteria).toEqual([
      'Feature functions as described in requirements',
      'User interface is intuitive and accessible',
      'Feature integrates seamlessly with existing functionality',
    ]);
    
    expect(enhancements.edgeCases).toEqual([
      'Handle empty or invalid input gracefully',
      'Consider performance with large datasets',
      'Ensure proper error handling and user feedback',
    ]);
    
    expect(enhancements.technicalConsiderations).toEqual([
      'Follow existing code patterns and conventions',
      'Add comprehensive test coverage',
      'Consider security implications',
      'Document API changes if applicable',
    ]);
    
    expect(enhancements.finalPrompt).toContain('TDD principles');
  });

  it('returns correct enhancements for bug type', () => {
    const enhancements = getDefaultEnhancements('bug');
    
    expect(enhancements.acceptanceCriteria).toEqual([
      'Bug is fixed and original functionality restored',
      'No regression in related features',
      'Tests added to prevent recurrence',
    ]);
    
    expect(enhancements.edgeCases).toEqual([
      'Verify fix with various input scenarios',
      'Test edge cases that might trigger similar bugs',
      'Ensure fix doesn\'t break existing functionality',
    ]);
    
    expect(enhancements.technicalConsiderations).toEqual([
      'Identify root cause, not just symptoms',
      'Add regression tests',
      'Update documentation if needed',
      'Consider performance impact of fix',
    ]);
    
    expect(enhancements.finalPrompt).toContain('Fix this bug systematically');
  });

  it('returns correct enhancements for epic type', () => {
    const enhancements = getDefaultEnhancements('epic');
    
    expect(enhancements.acceptanceCriteria).toEqual([
      'All sub-features are implemented and integrated',
      'Epic delivers promised business value',
      'Performance meets requirements',
      'User experience is cohesive across features',
    ]);
    
    expect(enhancements.edgeCases).toEqual([
      'Consider feature interactions and dependencies',
      'Plan for gradual rollout if needed',
      'Handle data migration scenarios',
      'Consider backward compatibility',
    ]);
    
    expect(enhancements.technicalConsiderations).toEqual([
      'Design for scalability and maintainability',
      'Consider architectural implications',
      'Plan monitoring and observability',
      'Document architectural decisions',
    ]);
    
    expect(enhancements.finalPrompt).toContain('Implement this epic systematically');
  });

  it('returns correct enhancements for technical-debt type', () => {
    const enhancements = getDefaultEnhancements('technical-debt');
    
    expect(enhancements.acceptanceCriteria).toEqual([
      'Code is refactored without changing functionality',
      'All tests continue to pass',
      'Code quality metrics improve',
      'Performance is maintained or improved',
    ]);
    
    expect(enhancements.edgeCases).toEqual([
      'Maintain backward compatibility',
      'Preserve all existing functionality',
      'Handle deprecation warnings appropriately',
      'Consider impact on dependent code',
    ]);
    
    expect(enhancements.technicalConsiderations).toEqual([
      'Maintain test coverage throughout',
      'Document significant changes',
      'Consider performance implications',
      'Update related documentation',
    ]);
    
    expect(enhancements.finalPrompt).toContain('Refactor this code carefully');
  });

  it('each enhancement type has all required properties', () => {
    const types: IssueFormData['type'][] = ['feature', 'bug', 'epic', 'technical-debt'];
    
    types.forEach(type => {
      const enhancements = getDefaultEnhancements(type);
      
      // Check structure
      expect(enhancements).toHaveProperty('acceptanceCriteria');
      expect(enhancements).toHaveProperty('edgeCases');
      expect(enhancements).toHaveProperty('technicalConsiderations');
      expect(enhancements).toHaveProperty('finalPrompt');
      
      // Check types
      expect(Array.isArray(enhancements.acceptanceCriteria)).toBe(true);
      expect(Array.isArray(enhancements.edgeCases)).toBe(true);
      expect(Array.isArray(enhancements.technicalConsiderations)).toBe(true);
      expect(typeof enhancements.finalPrompt).toBe('string');
      
      // Check non-empty
      expect(enhancements.acceptanceCriteria.length).toBeGreaterThan(0);
      expect(enhancements.edgeCases.length).toBeGreaterThan(0);
      expect(enhancements.technicalConsiderations.length).toBeGreaterThan(0);
      expect(enhancements.finalPrompt.length).toBeGreaterThan(0);
    });
  });

  it('all acceptance criteria start with capital letters', () => {
    const types: IssueFormData['type'][] = ['feature', 'bug', 'epic', 'technical-debt'];
    
    types.forEach(type => {
      const enhancements = getDefaultEnhancements(type);
      
      enhancements.acceptanceCriteria.forEach(criteria => {
        expect(criteria[0]).toMatch(/[A-Z]/);
      });
    });
  });

  it('final prompts contain numbered steps', () => {
    const types: IssueFormData['type'][] = ['feature', 'bug', 'epic', 'technical-debt'];
    
    types.forEach(type => {
      const enhancements = getDefaultEnhancements(type);
      
      expect(enhancements.finalPrompt).toMatch(/1\./);
      expect(enhancements.finalPrompt).toMatch(/2\./);
      expect(enhancements.finalPrompt).toMatch(/3\./);
      expect(enhancements.finalPrompt).toMatch(/4\./);
    });
  });

  it('technical-debt type handles string quotes correctly', () => {
    const enhancements = getDefaultEnhancements('technical-debt');
    
    // Ensure no syntax errors with quotes
    expect(enhancements.edgeCases[2]).toBe('Handle deprecation warnings appropriately');
    expect(enhancements.technicalConsiderations[2]).toBe('Consider performance implications');
  });

  it('returns consistent object references', () => {
    // Get enhancements twice for same type
    const enhancements1 = getDefaultEnhancements('feature');
    const enhancements2 = getDefaultEnhancements('feature');
    
    // Should return new objects each time (not same reference)
    expect(enhancements1).not.toBe(enhancements2);
    
    // But content should be equal
    expect(enhancements1).toEqual(enhancements2);
  });
});