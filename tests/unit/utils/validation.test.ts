import {
  baseIssueSchema,
  contextSchema,
  featureTechnicalSchema,
  bugTechnicalSchema,
  epicTechnicalSchema,
  technicalDebtSchema,
  implementationSchema,
} from '@/lib/utils/validation';

describe('Validation Schemas', () => {
  describe('baseIssueSchema', () => {
    it('validates valid base issue data', () => {
      const validData = {
        type: 'feature',
        title: 'Add user authentication system',
        description: 'We need to implement a secure user authentication system that supports email/password login, social auth, and two-factor authentication.',
      };
      
      const result = baseIssueSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid issue type', () => {
      const invalidData = {
        type: 'invalid-type',
        title: 'Add user authentication system',
        description: 'We need to implement a secure user authentication system that supports email/password login, social auth, and two-factor authentication.',
      };
      
      const result = baseIssueSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects title that is too short', () => {
      const invalidData = {
        type: 'feature',
        title: 'Too short',
        description: 'We need to implement a secure user authentication system that supports email/password login, social auth, and two-factor authentication.',
      };
      
      const result = baseIssueSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects title that is too long', () => {
      const invalidData = {
        type: 'feature',
        title: 'A'.repeat(101),
        description: 'We need to implement a secure user authentication system that supports email/password login, social auth, and two-factor authentication.',
      };
      
      const result = baseIssueSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects description that is too short', () => {
      const invalidData = {
        type: 'feature',
        title: 'Add user authentication system',
        description: 'Too short description',
      };
      
      const result = baseIssueSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects description that is too long', () => {
      const invalidData = {
        type: 'feature',
        title: 'Add user authentication system',
        description: 'A'.repeat(1001),
      };
      
      const result = baseIssueSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('contextSchema', () => {
    it('validates valid context data', () => {
      const validData = {
        businessValue: 'This feature will improve user retention by 30% based on market research',
        targetUsers: 'All registered users of the platform',
        successCriteria: 'Users can successfully authenticate and access protected resources',
      };
      
      const result = contextSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('allows optional successCriteria', () => {
      const validData = {
        businessValue: 'This feature will improve user retention by 30% based on market research',
        targetUsers: 'All registered users of the platform',
      };
      
      const result = contextSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects businessValue that is too short', () => {
      const invalidData = {
        businessValue: 'Too short',
        targetUsers: 'All registered users of the platform',
      };
      
      const result = contextSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects targetUsers that is too short', () => {
      const invalidData = {
        businessValue: 'This feature will improve user retention by 30% based on market research',
        targetUsers: 'Short',
      };
      
      const result = contextSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('featureTechnicalSchema', () => {
    it('validates valid feature technical data', () => {
      const validData = {
        components: ['AuthProvider', 'LoginForm', 'UserProfile'],
      };
      
      const result = featureTechnicalSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects empty components array', () => {
      const invalidData = {
        components: [],
      };
      
      const result = featureTechnicalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing components field', () => {
      const invalidData = {};
      
      const result = featureTechnicalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('bugTechnicalSchema', () => {
    it('validates valid bug technical data', () => {
      const validData = {
        stepsToReproduce: '1. Navigate to login page\n2. Enter invalid credentials\n3. Click submit',
        expectedBehavior: 'Error message should appear',
        actualBehavior: 'Page crashes with white screen',
      };
      
      const result = bugTechnicalSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects stepsToReproduce that is too short', () => {
      const invalidData = {
        stepsToReproduce: 'Too short',
        expectedBehavior: 'Error message should appear',
        actualBehavior: 'Page crashes with white screen',
      };
      
      const result = bugTechnicalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects expectedBehavior that is too short', () => {
      const invalidData = {
        stepsToReproduce: '1. Navigate to login page\n2. Enter invalid credentials\n3. Click submit',
        expectedBehavior: 'Short',
        actualBehavior: 'Page crashes with white screen',
      };
      
      const result = bugTechnicalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects actualBehavior that is too short', () => {
      const invalidData = {
        stepsToReproduce: '1. Navigate to login page\n2. Enter invalid credentials\n3. Click submit',
        expectedBehavior: 'Error message should appear',
        actualBehavior: 'Short',
      };
      
      const result = bugTechnicalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('epicTechnicalSchema', () => {
    it('validates valid epic technical data', () => {
      const validData = {
        subFeatures: ['User registration', 'Login/logout', 'Password reset', 'Two-factor auth'],
      };
      
      const result = epicTechnicalSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects empty subFeatures array', () => {
      const invalidData = {
        subFeatures: [],
      };
      
      const result = epicTechnicalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing subFeatures field', () => {
      const invalidData = {};
      
      const result = epicTechnicalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('technicalDebtSchema', () => {
    it('validates valid technical debt data', () => {
      const validData = {
        improvementAreas: ['Replace legacy auth library', 'Update to latest security standards', 'Improve test coverage'],
      };
      
      const result = technicalDebtSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects empty improvementAreas array', () => {
      const invalidData = {
        improvementAreas: [],
      };
      
      const result = technicalDebtSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects missing improvementAreas field', () => {
      const invalidData = {};
      
      const result = technicalDebtSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('implementationSchema', () => {
    it('validates valid implementation data', () => {
      const validData = {
        requirements: 'Implement secure JWT-based authentication with refresh tokens',
        dependencies: ['jsonwebtoken', 'bcrypt', 'express-validator'],
        approach: 'Use middleware pattern for authentication, implement refresh token rotation',
        affectedFiles: ['src/auth/middleware.ts', 'src/auth/controllers.ts', 'src/models/User.ts'],
      };
      
      const result = implementationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('allows empty dependencies array', () => {
      const validData = {
        requirements: 'Implement secure JWT-based authentication with refresh tokens',
        dependencies: [],
        approach: 'Use middleware pattern for authentication, implement refresh token rotation',
        affectedFiles: ['src/auth/middleware.ts', 'src/auth/controllers.ts', 'src/models/User.ts'],
      };
      
      const result = implementationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('allows empty affectedFiles array', () => {
      const validData = {
        requirements: 'Implement secure JWT-based authentication with refresh tokens',
        dependencies: ['jsonwebtoken', 'bcrypt', 'express-validator'],
        approach: 'Use middleware pattern for authentication, implement refresh token rotation',
        affectedFiles: [],
      };
      
      const result = implementationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects requirements that is too short', () => {
      const invalidData = {
        requirements: 'Short',
        dependencies: ['jsonwebtoken', 'bcrypt', 'express-validator'],
        approach: 'Use middleware pattern for authentication, implement refresh token rotation',
        affectedFiles: ['src/auth/middleware.ts', 'src/auth/controllers.ts', 'src/models/User.ts'],
      };
      
      const result = implementationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects approach that is too short', () => {
      const invalidData = {
        requirements: 'Implement secure JWT-based authentication with refresh tokens',
        dependencies: ['jsonwebtoken', 'bcrypt', 'express-validator'],
        approach: 'Short',
        affectedFiles: ['src/auth/middleware.ts', 'src/auth/controllers.ts', 'src/models/User.ts'],
      };
      
      const result = implementationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});