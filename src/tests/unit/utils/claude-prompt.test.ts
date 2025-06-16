import { generateClaudePrompt, generateClaudeInstructions } from '@/lib/utils/claude-prompt';
import { IssueFormData } from '@/lib/types/issue';

describe('Claude Prompt Generator', () => {
  const baseIssueData: IssueFormData = {
    type: 'feature',
    title: 'Add User Authentication',
    description: 'Implement a secure authentication system with login and registration',
    context: {
      businessValue: 'Enables user-specific features and secure access',
      targetUsers: 'All application users',
      successCriteria: 'Users can register and login securely',
    },
    technical: {
      components: ['AuthForm', 'UserContext', 'ProtectedRoute'],
    },
    implementation: {
      requirements: 'JWT-based authentication with refresh tokens',
      dependencies: ['jsonwebtoken', 'bcrypt'],
      approach: 'Use Next.js API routes for auth endpoints and React Context for state',
      affectedFiles: ['pages/api/auth/[...].ts', 'contexts/UserContext.tsx'],
    },
  };

  describe('generateClaudePrompt', () => {
    it('generates feature-specific prompt', () => {
      const prompt = generateClaudePrompt(baseIssueData);
      
      expect(prompt).toContain('implement a feature for a Next.js application');
      expect(prompt).toContain('Implement a secure authentication system with login and registration');
      expect(prompt).toContain('Business context:');
      expect(prompt).toContain('Value: Enables user-specific features');
      expect(prompt).toContain('Target users: All application users');
    });

    it('generates bug-specific prompt', () => {
      const bugData: IssueFormData = {
        ...baseIssueData,
        type: 'bug',
        technical: {
          ...baseIssueData.technical,
          stepsToReproduce: '1. Click login\n2. Enter credentials\n3. Submit form',
          expectedBehavior: 'User should be logged in',
          actualBehavior: 'Error 500 is shown',
        },
      };
      
      const prompt = generateClaudePrompt(bugData);
      
      expect(prompt).toContain('implement a bug for a Next.js application');
      expect(prompt).toContain('Bug details:');
      expect(prompt).toContain('Steps to reproduce: 1. Click login');
      expect(prompt).toContain('Expected behavior: User should be logged in');
      expect(prompt).toContain('Actual behavior: Error 500 is shown');
    });

    it('generates epic-specific prompt', () => {
      const epicData: IssueFormData = {
        ...baseIssueData,
        type: 'epic',
        technical: {
          ...baseIssueData.technical,
          subFeatures: ['User registration', 'Login flow', 'Password reset'],
        },
      };
      
      const prompt = generateClaudePrompt(epicData);
      
      expect(prompt).toContain('implement a epic for a Next.js application');
      expect(prompt).toContain('Epic scope:');
      expect(prompt).toContain('Sub-features to implement:');
      expect(prompt).toContain('1. User registration');
      expect(prompt).toContain('2. Login flow');
    });

    it('generates technical-debt-specific prompt', () => {
      const debtData: IssueFormData = {
        ...baseIssueData,
        type: 'technical-debt',
        technical: {
          ...baseIssueData.technical,
          improvementAreas: ['Replace hardcoded values', 'Add proper error handling'],
        },
      };
      
      const prompt = generateClaudePrompt(debtData);
      
      expect(prompt).toContain('implement a technical-debt for a Next.js application');
      expect(prompt).toContain('Refactoring details:');
      expect(prompt).toContain('Current problems: Replace hardcoded values, Add proper error handling');
    });

    it('includes AI enhancements when available', () => {
      const dataWithAI: IssueFormData = {
        ...baseIssueData,
        aiEnhancements: {
          acceptanceCriteria: ['User can register with email', 'Passwords are hashed'],
          edgeCases: ['Duplicate email registration', 'Invalid email format'],
          technicalConsiderations: ['Use bcrypt rounds of 10+', 'Implement rate limiting'],
        },
      };
      
      const prompt = generateClaudePrompt(dataWithAI);
      
      expect(prompt).toContain('Acceptance criteria:');
      expect(prompt).toContain('1. User can register with email');
      expect(prompt).toContain('Consider these edge cases:');
      expect(prompt).toContain('- Duplicate email registration');
      expect(prompt).toContain('Technical considerations:');
      expect(prompt).toContain('- Use bcrypt rounds of 10+');
    });

    it('handles missing optional fields', () => {
      const minimalData: IssueFormData = {
        ...baseIssueData,
        context: {
          ...baseIssueData.context,
          successCriteria: '',
        },
        technical: {
          components: [],
        },
        implementation: {
          ...baseIssueData.implementation,
          affectedFiles: [],
        },
      };
      
      const prompt = generateClaudePrompt(minimalData);
      
      expect(prompt).toContain('This affects these components: Not specified');
      expect(prompt).toContain('Key files to modify: To be determined');
      expect(prompt).not.toContain('Success criteria:');
    });

    it('includes TDD instructions', () => {
      const prompt = generateClaudePrompt(baseIssueData);
      
      expect(prompt).toContain('following TDD principles:');
      expect(prompt).toContain('1. First write failing tests');
      expect(prompt).toContain('2. Implement the minimal code to pass tests');
      expect(prompt).toContain('3. Refactor for clarity and performance');
    });
  });

  describe('generateClaudeInstructions', () => {
    it('generates comprehensive instructions', () => {
      const instructions = generateClaudeInstructions(baseIssueData);
      
      expect(instructions).toContain('# Implementation Instructions for Claude Code');
      expect(instructions).toContain('## Task Type: Feature');
      expect(instructions).toContain('### Title\nAdd User Authentication');
    });

    it('includes dependency installation commands', () => {
      const instructions = generateClaudeInstructions(baseIssueData);
      
      expect(instructions).toContain('### Dependencies to Install');
      expect(instructions).toContain('npm install jsonwebtoken bcrypt');
    });

    it('handles no dependencies case', () => {
      const noDepsData: IssueFormData = {
        ...baseIssueData,
        implementation: {
          ...baseIssueData.implementation,
          dependencies: [],
        },
      };
      
      const instructions = generateClaudeInstructions(noDepsData);
      
      expect(instructions).toContain('No additional dependencies required');
    });

    it('includes development workflow', () => {
      const instructions = generateClaudeInstructions(baseIssueData);
      
      expect(instructions).toContain('### Development Workflow');
      expect(instructions).toContain('1. **Write Tests First**');
      expect(instructions).toContain('2. **Implement Solution**');
      expect(instructions).toContain('3. **Refactor and Optimize**');
    });

    it('lists affected files', () => {
      const instructions = generateClaudeInstructions(baseIssueData);
      
      expect(instructions).toContain('### Files to Focus On');
      expect(instructions).toContain('- pages/api/auth/[...].ts');
      expect(instructions).toContain('- contexts/UserContext.tsx');
    });

    it('includes testing and code review checklists', () => {
      const instructions = generateClaudeInstructions(baseIssueData);
      
      expect(instructions).toContain('### Testing Checklist');
      expect(instructions).toContain('- [ ] Unit tests for all new functions/components');
      expect(instructions).toContain('### Code Review Checklist');
      expect(instructions).toContain('- [ ] Follows existing code patterns');
    });

    it('formats issue type correctly', () => {
      const debtData: IssueFormData = {
        ...baseIssueData,
        type: 'technical-debt',
      };
      
      const instructions = generateClaudeInstructions(debtData);
      
      expect(instructions).toContain('## Task Type: Technical debt');
    });
  });
});