import { generateMarkdown } from '@/lib/templates/markdown';
import { IssueFormData } from '@/lib/types/issue';

describe('generateMarkdown', () => {
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

  it('generates markdown with all sections for feature', () => {
    const markdown = generateMarkdown(baseFormData);

    expect(markdown).toContain('# Add User Authentication');
    expect(markdown).toContain('## Overview');
    expect(markdown).toContain('Implement a secure user authentication system');
    expect(markdown).toContain('## Business Context');
    expect(markdown).toContain('**Value:** Enables user accounts and personalization');
    expect(markdown).toContain('**Target Users:** All platform users');
    expect(markdown).toContain('**Success Criteria:** Users can sign up and log in securely');
    expect(markdown).toContain('## Technical Details');
    expect(markdown).toContain('- AuthService');
    expect(markdown).toContain('- UserProfile');
    expect(markdown).toContain('## Implementation Approach');
    expect(markdown).toContain('Use NextAuth.js with JWT tokens');
    expect(markdown).toContain('### Dependencies');
    expect(markdown).toContain('- next-auth');
    expect(markdown).toContain('### Files to Modify');
    expect(markdown).toContain('- `pages/api/auth/[...nextauth].ts`');
  });

  it('generates markdown for bug type', () => {
    const bugData: IssueFormData = {
      ...baseFormData,
      type: 'bug',
      technical: {
        stepsToReproduce: '1. Go to login page\n2. Enter invalid email\n3. Submit form',
        expectedBehavior: 'Show validation error',
        actualBehavior: 'Form submits with invalid data',
      },
    };

    const markdown = generateMarkdown(bugData);

    expect(markdown).toContain('**Steps to Reproduce:**');
    expect(markdown).toContain('1. Go to login page');
    expect(markdown).toContain('**Expected Behavior:** Show validation error');
    expect(markdown).toContain('**Actual Behavior:** Form submits with invalid data');
  });

  it('generates markdown for epic type', () => {
    const epicData: IssueFormData = {
      ...baseFormData,
      type: 'epic',
      technical: {
        subFeatures: ['User Registration', 'Login Flow', 'Password Reset', 'Social Auth'],
      },
    };

    const markdown = generateMarkdown(epicData);

    expect(markdown).toContain('**Sub-features:**');
    expect(markdown).toContain('- User Registration');
    expect(markdown).toContain('- Login Flow');
    expect(markdown).toContain('- Password Reset');
    expect(markdown).toContain('- Social Auth');
  });

  it('generates markdown for technical-debt type', () => {
    const techDebtData: IssueFormData = {
      ...baseFormData,
      type: 'technical-debt',
      technical: {
        improvementAreas: ['Refactor auth middleware', 'Update deprecated APIs', 'Improve test coverage'],
      },
    };

    const markdown = generateMarkdown(techDebtData);

    expect(markdown).toContain('**Areas to Improve:**');
    expect(markdown).toContain('- Refactor auth middleware');
    expect(markdown).toContain('- Update deprecated APIs');
    expect(markdown).toContain('- Improve test coverage');
  });

  it('includes AI enhancements when available', () => {
    const dataWithAI: IssueFormData = {
      ...baseFormData,
      aiEnhancements: {
        acceptanceCriteria: ['User can register with email', 'Password meets security requirements'],
        edgeCases: ['Handle duplicate emails', 'Validate email format'],
        technicalConsiderations: ['Use bcrypt for password hashing', 'Implement rate limiting'],
      },
    };

    const markdown = generateMarkdown(dataWithAI);

    expect(markdown).toContain('## Acceptance Criteria');
    expect(markdown).toContain('1. User can register with email');
    expect(markdown).toContain('2. Password meets security requirements');
    expect(markdown).toContain('## Edge Cases to Consider');
    expect(markdown).toContain('- Handle duplicate emails');
    expect(markdown).toContain('## Technical Considerations');
    expect(markdown).toContain('- Use bcrypt for password hashing');
  });

  it('excludes optional fields when not provided', () => {
    const minimalData: IssueFormData = {
      ...baseFormData,
      context: {
        businessValue: 'Value',
        targetUsers: 'Users',
        successCriteria: '', // Empty
      },
      implementation: {
        requirements: 'Requirements',
        dependencies: [], // Empty array
        approach: 'Approach',
        affectedFiles: [], // Empty array
      },
    };

    const markdown = generateMarkdown(minimalData);

    expect(markdown).not.toContain('**Success Criteria:**');
    expect(markdown).not.toContain('### Dependencies');
    expect(markdown).not.toContain('### Files to Modify');
  });

  it('includes footer with link', () => {
    const markdown = generateMarkdown(baseFormData);

    expect(markdown).toContain('---');
    expect(markdown).toContain('*Generated with [Issue Generator for Claude Code](https://github.com/ccarella/pmai)*');
  });

  it('handles all required sections in correct order', () => {
    const markdown = generateMarkdown(baseFormData);
    const sections = ['# Add User Authentication', '## Overview', '## Business Context', 
                     '## Technical Details', '## Implementation Approach', '### Requirements'];

    let lastIndex = -1;
    sections.forEach(section => {
      const index = markdown.indexOf(section);
      expect(index).toBeGreaterThan(lastIndex);
      lastIndex = index;
    });
  });
});