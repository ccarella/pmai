import { getFormSteps, getStepValidation, isFormComplete } from '@/lib/config/form-steps';
import { IssueType } from '@/lib/types/issue';

describe('form-steps', () => {
  describe('getFormSteps', () => {
    it('returns correct steps for feature type', () => {
      const steps = getFormSteps('feature');
      
      expect(steps).toHaveLength(5);
      expect(steps.map(s => s.id)).toEqual(['basic', 'context', 'technical', 'implementation', 'preview']);
      
      const technicalStep = steps.find(s => s.id === 'technical');
      expect(technicalStep?.fields[0].name).toBe('technical.components');
    });

    it('returns correct steps for bug type', () => {
      const steps = getFormSteps('bug');
      
      expect(steps).toHaveLength(5);
      expect(steps.map(s => s.id)).toEqual(['basic', 'context', 'technical', 'implementation', 'preview']);
      
      const technicalStep = steps.find(s => s.id === 'technical');
      expect(technicalStep?.fields.map(f => f.name)).toEqual([
        'technical.stepsToReproduce',
        'technical.expectedBehavior',
        'technical.actualBehavior',
      ]);
    });

    it('returns correct steps for epic type', () => {
      const steps = getFormSteps('epic');
      
      expect(steps).toHaveLength(5);
      
      const technicalStep = steps.find(s => s.id === 'technical');
      expect(technicalStep?.fields[0].name).toBe('technical.subFeatures');
    });

    it('returns correct steps for technical-debt type', () => {
      const steps = getFormSteps('technical-debt');
      
      expect(steps).toHaveLength(5);
      
      const technicalStep = steps.find(s => s.id === 'technical');
      expect(technicalStep?.fields[0].name).toBe('technical.improvementAreas');
    });

    it('throws error for invalid issue type', () => {
      expect(() => getFormSteps('invalid' as IssueType)).toThrow('Invalid issue type: invalid');
    });

    it('includes common base steps for all types', () => {
      const types: IssueType[] = ['feature', 'bug', 'epic', 'technical-debt'];
      
      types.forEach(type => {
        const steps = getFormSteps(type);
        const basicStep = steps.find(s => s.id === 'basic');
        const contextStep = steps.find(s => s.id === 'context');
        
        expect(basicStep).toBeDefined();
        expect(basicStep?.fields.map(f => f.name)).toEqual(['title', 'description']);
        
        expect(contextStep).toBeDefined();
        expect(contextStep?.fields.map(f => f.name)).toEqual([
          'context.businessValue',
          'context.targetUsers',
          'context.successCriteria',
        ]);
      });
    });
  });

  describe('getStepValidation', () => {
    it('returns validation schema for valid step', () => {
      const schema = getStepValidation('feature', 'basic');
      
      expect(schema).toBeDefined();
      expect(() => schema.parse({ title: 'Valid Title Here', description: 'A'.repeat(60) })).not.toThrow();
    });

    it('returns empty schema for invalid step', () => {
      const schema = getStepValidation('feature', 'invalid-step');
      
      expect(schema).toBeDefined();
      expect(schema.parse({})).toEqual({});
    });
  });

  describe('isFormComplete', () => {
    const validFeatureData = {
      type: 'feature' as const,
      title: 'Valid Feature Title', // 19 chars > 10 min
      description: 'A'.repeat(50), // Exactly 50 chars, the minimum
      context: {
        businessValue: 'This provides significant business value', // 40 chars > 20 min
        targetUsers: 'All system users', // 16 chars > 10 min
        successCriteria: 'Success criteria',
      },
      technical: {
        components: ['Component1'],
      },
      implementation: {
        requirements: 'Requirements for implementation', // 31 chars > 10 min
        dependencies: [],
        approach: 'Implementation approach details', // 31 chars > 10 min
        affectedFiles: [],
      },
    };

    it('returns true for complete valid data', () => {
      expect(isFormComplete('feature', validFeatureData)).toBe(true);
    });

    it('returns false for incomplete data', () => {
      const incompleteData = {
        ...validFeatureData,
        title: '', // Invalid - too short
      };
      
      expect(isFormComplete('feature', incompleteData)).toBe(false);
    });

    it('returns false for missing required fields', () => {
      const missingData = {
        type: 'feature' as const,
        title: 'Valid Title',
        description: 'A'.repeat(60),
        // Missing context and other required fields
      };
      
      expect(isFormComplete('feature', missingData)).toBe(false);
    });

    it('validates bug-specific fields correctly', () => {
      const validBugData = {
        type: 'bug' as const,
        title: 'Valid Bug Title', // 15 chars > 10 min
        description: 'A'.repeat(50), // Exactly 50 chars, the minimum
        context: {
          businessValue: 'This fixes a critical production issue', // 38 chars > 20 min
          targetUsers: 'All system users', // 16 chars > 10 min
          successCriteria: 'Bug is fixed',
        },
        technical: {
          stepsToReproduce: 'Steps to reproduce the bug in detail', // 36 chars > 20 min
          expectedBehavior: 'Expected behavior description', // 30 chars > 10 min
          actualBehavior: 'Actual behavior observed', // 24 chars > 10 min
          components: ['Component1'], // Required for bugs too
        },
        implementation: {
          requirements: 'Requirements for the fix', // 24 chars > 10 min
          dependencies: [],
          approach: 'Fix approach with details', // 25 chars > 10 min
          affectedFiles: [],
        },
      };
      
      expect(isFormComplete('bug', validBugData)).toBe(true);
    });

    it('skips preview step validation', () => {
      const steps = getFormSteps('feature');
      const previewStep = steps.find(s => s.id === 'preview');
      
      expect(previewStep?.validation.parse({})).toEqual({});
    });
  });

  describe('field configurations', () => {
    it('marks required fields correctly', () => {
      const steps = getFormSteps('feature');
      const basicStep = steps.find(s => s.id === 'basic');
      
      expect(basicStep?.fields.find(f => f.name === 'title')?.required).toBe(true);
      expect(basicStep?.fields.find(f => f.name === 'description')?.required).toBe(true);
    });

    it('marks optional fields correctly', () => {
      const steps = getFormSteps('feature');
      const contextStep = steps.find(s => s.id === 'context');
      
      expect(contextStep?.fields.find(f => f.name === 'context.successCriteria')?.required).toBe(false);
    });

    it('uses correct field types', () => {
      const steps = getFormSteps('feature');
      
      const titleField = steps[0].fields.find(f => f.name === 'title');
      expect(titleField?.type).toBe('text');
      
      const descriptionField = steps[0].fields.find(f => f.name === 'description');
      expect(descriptionField?.type).toBe('textarea');
      
      const componentsField = steps[2].fields.find(f => f.name === 'technical.components');
      expect(componentsField?.type).toBe('multiselect');
    });
  });
});