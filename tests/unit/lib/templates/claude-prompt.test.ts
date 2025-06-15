import { generateClaudePrompt } from '@/lib/templates/claude-prompt';
import { IssueFormData } from '@/lib/types/issue';

describe('generateClaudePrompt', () => {
  const baseFormData: IssueFormData = {
    type: 'feature',
    title: 'Add User Authentication',
    description: 'Implement a secure user authentication system with social login options',
    context: {
      businessValue: 'Enables user accounts and personalization',
      targetUsers: 'All platform users',
      successCriteria: 'Users can sign up and log in securely',
    },
    technical: {
      components: ['AuthService', 'UserProfile', 'LoginForm'],
    },
    implementation: {
      requirements: 'Must support email/password and OAuth',
      dependencies: ['next-auth', 'bcrypt'],
      approach: 'Use NextAuth.js with JWT tokens',
      affectedFiles: ['pages/api/auth/[...nextauth].ts', 'components/LoginForm.tsx'],
    },
  };

  it('generates prompt with correct opening for feature', () => {
    const prompt = generateClaudePrompt(baseFormData);

    expect(prompt).toContain('I need you to implement a feature for a Next.js application.');
    expect(prompt).toContain('Here are the requirements:');
    expect(prompt).toContain(baseFormData.description);
  });

  it('includes technical context for feature', () => {
    const prompt = generateClaudePrompt(baseFormData);

    expect(prompt).toContain('Technical context:');
    expect(prompt).toContain('- This affects these components: AuthService, UserProfile, LoginForm');
    expect(prompt).toContain('- Implementation should follow these patterns: Use NextAuth.js with JWT tokens');
    expect(prompt).toContain('- Key files to modify: pages/api/auth/[...nextauth].ts, components/LoginForm.tsx');
  });

  it('generates prompt for bug type', () => {
    const bugData: IssueFormData = {
      ...baseFormData,
      type: 'bug',
      technical: {
        stepsToReproduce: '1. Go to login page\n2. Enter invalid email\n3. Submit form',
        expectedBehavior: 'Show validation error',
        actualBehavior: 'Form submits with invalid data',
      },
    };

    const prompt = generateClaudePrompt(bugData);

    expect(prompt).toContain('I need you to implement a bug for a Next.js application.');
    expect(prompt).toContain('- Steps to reproduce the issue:');
    expect(prompt).toContain('1. Go to login page');
    expect(prompt).toContain('- Expected: Show validation error');
    expect(prompt).toContain('- Actual: Form submits with invalid data');
  });

  it('generates prompt for epic type', () => {
    const epicData: IssueFormData = {
      ...baseFormData,
      type: 'epic',
      technical: {
        subFeatures: ['User Registration', 'Login Flow', 'Password Reset'],
      },
    };

    const prompt = generateClaudePrompt(epicData);

    expect(prompt).toContain('I need you to implement a epic for a Next.js application.');
    expect(prompt).toContain('- This epic includes these sub-features:');
    expect(prompt).toContain('  - User Registration');
    expect(prompt).toContain('  - Login Flow');
    expect(prompt).toContain('  - Password Reset');
  });

  it('generates prompt for technical-debt type', () => {
    const techDebtData: IssueFormData = {
      ...baseFormData,
      type: 'technical-debt',
      technical: {
        improvementAreas: ['Refactor auth middleware', 'Update deprecated APIs'],
      },
    };

    const prompt = generateClaudePrompt(techDebtData);

    expect(prompt).toContain('I need you to implement a technical-debt for a Next.js application.');
    expect(prompt).toContain('- Areas that need improvement:');
    expect(prompt).toContain('  - Refactor auth middleware');
    expect(prompt).toContain('  - Update deprecated APIs');
  });

  it('includes TDD instructions', () => {
    const prompt = generateClaudePrompt(baseFormData);

    expect(prompt).toContain('Please implement this feature following TDD principles:');
    expect(prompt).toContain('1. First write failing tests');
    expect(prompt).toContain('2. Implement the minimal code to pass tests');
    expect(prompt).toContain('3. Refactor for clarity and performance');
  });

  it('includes AI enhancements when available', () => {
    const dataWithAI: IssueFormData = {
      ...baseFormData,
      aiEnhancements: {
        acceptanceCriteria: ['User can register', 'Passwords are hashed'],
        edgeCases: ['Handle duplicate emails', 'Validate email format'],
        technicalConsiderations: ['Use bcrypt', 'Implement rate limiting'],
      },
    };

    const prompt = generateClaudePrompt(dataWithAI);

    expect(prompt).toContain('Acceptance criteria:');
    expect(prompt).toContain('1. User can register');
    expect(prompt).toContain('2. Passwords are hashed');
    expect(prompt).toContain('Consider these edge cases:');
    expect(prompt).toContain('- Handle duplicate emails');
    expect(prompt).toContain('Technical considerations:');
    expect(prompt).toContain('- Use bcrypt');
  });

  it('excludes components when not provided', () => {
    const dataWithoutComponents: IssueFormData = {
      ...baseFormData,
      technical: {},
    };

    const prompt = generateClaudePrompt(dataWithoutComponents);

    expect(prompt).not.toContain('- This affects these components:');
  });

  it('excludes affected files when empty', () => {
    const dataWithoutFiles: IssueFormData = {
      ...baseFormData,
      implementation: {
        ...baseFormData.implementation,
        affectedFiles: [],
      },
    };

    const prompt = generateClaudePrompt(dataWithoutFiles);

    expect(prompt).not.toContain('- Key files to modify:');
  });

  it('maintains proper formatting and structure', () => {
    const prompt = generateClaudePrompt(baseFormData);
    const lines = prompt.split('\n');

    // Check for proper spacing
    expect(lines.filter(line => line === '').length).toBeGreaterThan(0);
    
    // Check for consistent indentation
    const indentedLines = lines.filter(line => line.startsWith('  -'));
    expect(indentedLines.length).toBe(0); // Sub-features would have indented lines
  });
});