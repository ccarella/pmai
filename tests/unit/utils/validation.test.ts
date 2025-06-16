import {
  baseIssueSchema,
  contextSchema,
  implementationSchema,
  smartPromptSchema,
  validateSmartPrompt,
} from '@/lib/utils/validation';

describe('Validation Schemas', () => {
  describe('baseIssueSchema', () => {
    it('validates valid base issue data', () => {
      const validData = {
        type: 'feature' as const,
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
        type: 'feature' as const,
        title: 'Too short',
        description: 'We need to implement a secure user authentication system that supports email/password login, social auth, and two-factor authentication.',
      };
      
      const result = baseIssueSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects title that is too long', () => {
      const invalidData = {
        type: 'feature' as const,
        title: 'a'.repeat(101),
        description: 'We need to implement a secure user authentication system that supports email/password login, social auth, and two-factor authentication.',
      };
      
      const result = baseIssueSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects description that is too short', () => {
      const invalidData = {
        type: 'feature' as const,
        title: 'Add user authentication system',
        description: 'Too short',
      };
      
      const result = baseIssueSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects description that is too long', () => {
      const invalidData = {
        type: 'feature' as const,
        title: 'Add user authentication system',
        description: 'a'.repeat(1001),
      };
      
      const result = baseIssueSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('accepts all valid issue types', () => {
      const types = ['feature', 'bug', 'epic', 'technical-debt'] as const;
      const description = 'We need to implement a secure user authentication system that supports email/password login, social auth, and two-factor authentication.';
      
      types.forEach((type) => {
        const validData = {
          type,
          title: 'Add user authentication system',
          description,
        };
        
        const result = baseIssueSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('contextSchema', () => {
    it('validates valid context data', () => {
      const validData = {
        businessValue: 'Increase user retention by 20%',
        targetUsers: 'All registered users',
        successCriteria: 'Users can successfully authenticate and access their accounts',
      };
      
      const result = contextSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates context data without optional successCriteria', () => {
      const validData = {
        businessValue: 'Increase user retention by 20%',
        targetUsers: 'All registered users',
      };
      
      const result = contextSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects businessValue that is too short', () => {
      const invalidData = {
        businessValue: 'ab',
        targetUsers: 'All registered users',
      };
      
      const result = contextSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects targetUsers that is too short', () => {
      const invalidData = {
        businessValue: 'Increase user retention by 20%',
        targetUsers: 'ab',
      };
      
      const result = contextSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('smartPromptSchema', () => {
    it('validates valid smart prompt data', () => {
      const validData = {
        title: 'Add user authentication',
        prompt: 'We need to implement a secure user authentication system',
      };
      
      const result = smartPromptSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates prompt without title', () => {
      const validData = {
        prompt: 'We need to implement a secure user authentication system',
      };
      
      const result = smartPromptSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects title longer than 70 characters', () => {
      const invalidData = {
        title: 'a'.repeat(71),
        prompt: 'Test prompt',
      };
      
      const result = smartPromptSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects empty prompt', () => {
      const invalidData = {
        prompt: '',
      };
      
      const result = smartPromptSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSmartPrompt', () => {
    it('validates and processes valid data with title', () => {
      const data = {
        title: 'Add user authentication',
        prompt: 'We need to implement a secure user authentication system',
      };
      
      const result = validateSmartPrompt(data);
      expect(result.title).toBe('Add user authentication');
      expect(result.prompt).toBe('We need to implement a secure user authentication system');
    });

    it('uses prompt excerpt as title when title not provided', () => {
      const data = {
        prompt: 'We need to implement a secure user authentication system that supports multiple providers',
      };
      
      const result = validateSmartPrompt(data);
      expect(result.title).toBe('We need to implement a secure user authentication system tha');
      expect(result.prompt).toBe('We need to implement a secure user authentication system that supports multiple providers');
    });

    it('throws error for title less than 5 characters', () => {
      const data = {
        title: 'Test',
        prompt: 'Test prompt',
      };
      
      expect(() => validateSmartPrompt(data)).toThrow('Title must be between 5 and 70 characters');
    });

    it('throws error for title more than 70 characters', () => {
      const data = {
        title: 'a'.repeat(71),
        prompt: 'Test prompt',
      };
      
      expect(() => validateSmartPrompt(data)).toThrow('Title must be between 5 and 70 characters');
    });

    it('throws error for empty prompt', () => {
      const data = {
        prompt: '   ',
      };
      
      expect(() => validateSmartPrompt(data)).toThrow('Title is required or prompt must be long enough to generate title');
    });
  });

  describe('implementationSchema', () => {
    it('validates valid implementation data', () => {
      const validData = {
        requirements: 'Implement OAuth2 authentication with refresh tokens',
        dependencies: ['next-auth', 'bcrypt', 'jsonwebtoken'],
        approach: 'Use NextAuth.js with custom credentials provider and JWT strategy',
        affectedFiles: ['app/api/auth/[...nextauth]/route.ts', 'lib/auth.ts'],
      };
      
      const result = implementationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates implementation data with empty dependencies', () => {
      const validData = {
        requirements: 'Implement OAuth2 authentication with refresh tokens',
        dependencies: [],
        approach: 'Use NextAuth.js with custom credentials provider and JWT strategy',
        affectedFiles: ['app/api/auth/[...nextauth]/route.ts', 'lib/auth.ts'],
      };
      
      const result = implementationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects requirements that is too short', () => {
      const invalidData = {
        requirements: 'Too short',
        dependencies: ['next-auth'],
        approach: 'Use NextAuth.js with custom credentials provider and JWT strategy',
        affectedFiles: ['app/api/auth/[...nextauth]/route.ts'],
      };
      
      const result = implementationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects approach that is too short', () => {
      const invalidData = {
        requirements: 'Implement OAuth2 authentication with refresh tokens',
        dependencies: ['next-auth'],
        approach: 'Too short',
        affectedFiles: ['app/api/auth/[...nextauth]/route.ts'],
      };
      
      const result = implementationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-array dependencies', () => {
      const invalidData = {
        requirements: 'Implement OAuth2 authentication with refresh tokens',
        dependencies: 'next-auth',
        approach: 'Use NextAuth.js with custom credentials provider and JWT strategy',
        affectedFiles: ['app/api/auth/[...nextauth]/route.ts'],
      };
      
      const result = implementationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects non-array affectedFiles', () => {
      const invalidData = {
        requirements: 'Implement OAuth2 authentication with refresh tokens',
        dependencies: ['next-auth'],
        approach: 'Use NextAuth.js with custom credentials provider and JWT strategy',
        affectedFiles: 'app/api/auth/[...nextauth]/route.ts',
      };
      
      const result = implementationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});