import { bugTemplate } from '@/lib/templates/bug';
import { IssueFormData } from '@/lib/types/issue';

describe('bugTemplate', () => {
  const baseBugData: IssueFormData = {
    type: 'bug',
    title: 'Login button not working',
    description: 'Users cannot login to the application',
    context: {
      businessValue: 'Critical functionality broken',
      targetUsers: 'All users',
      successCriteria: 'Users can login successfully',
    },
    technical: {
      stepsToReproduce: 'Click the login button',
      expectedBehavior: 'User should be logged in',
      actualBehavior: 'Nothing happens',
      components: ['Auth', 'UI'],
    },
    implementation: {
      requirements: 'Fix the login functionality',
      dependencies: ['React', 'NextAuth'],
      approach: 'Debug the click handler',
      affectedFiles: ['auth.ts', 'login.tsx'],
    },
    aiEnhancements: {
      acceptanceCriteria: ['Login works', 'Error handling exists'],
      edgeCases: ['Invalid credentials', 'Network timeout'],
      technicalConsiderations: ['Security implications', 'Session handling'],
    }
  };

  it('generates complete bug template with all fields', () => {
    const result = bugTemplate(baseBugData);
    
    // Check title and description
    expect(result).toContain('# Login button not working');
    expect(result).toContain('## Bug Description');
    expect(result).toContain('Users cannot login to the application');
    
    // Check bug-specific fields
    expect(result).toContain('## Steps to Reproduce');
    expect(result).toContain('Click the login button');
    expect(result).toContain('## Expected Behavior');
    expect(result).toContain('User should be logged in');
    expect(result).toContain('## Actual Behavior');
    expect(result).toContain('Nothing happens');
    
    // Check business context
    expect(result).toContain('## Business Impact');
    expect(result).toContain('**Affected Users:** All users');
    expect(result).toContain('**Business Value:** Critical functionality broken');
    
    // Check technical details
    expect(result).toContain('## Technical Details');
    expect(result).toContain('**Affected Components:**');
    expect(result).toContain('- Auth');
    expect(result).toContain('- UI');
    
    // Check implementation
    expect(result).toContain('## Implementation Details');
    expect(result).toContain('### Proposed Fix');
    expect(result).toContain('Debug the click handler');
    expect(result).toContain('### Requirements');
    expect(result).toContain('Fix the login functionality');
    expect(result).toContain('### Dependencies');
    expect(result).toContain('- React');
    expect(result).toContain('- NextAuth');
    expect(result).toContain('### Files to Modify');
    expect(result).toContain('- `auth.ts`');
    expect(result).toContain('- `login.tsx`');
    expect(result).toContain('**Success Criteria:** Users can login successfully');
    
    // Check AI enhancements
    expect(result).toContain('## Acceptance Criteria');
    expect(result).toContain('1. Login works');
    expect(result).toContain('2. Error handling exists');
    expect(result).toContain('## Edge Cases to Consider');
    expect(result).toContain('- Invalid credentials');
    expect(result).toContain('- Network timeout');
    expect(result).toContain('## Technical Considerations');
    expect(result).toContain('- Security implications');
    expect(result).toContain('- Session handling');
    
    // Check footer
    expect(result).toContain('Generated with [GitHub Issue Generator for Claude Code]');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalData: IssueFormData = {
      type: 'bug',
      title: 'Bug title',
      description: 'Bug description',
      context: {
        businessValue: '',
        targetUsers: '',
        successCriteria: '',
      },
      technical: {
        stepsToReproduce: 'Steps',
        expectedBehavior: 'Expected',
        actualBehavior: 'Actual',
        components: [],
      },
      implementation: {
        requirements: '',
        dependencies: [],
        approach: '',
        affectedFiles: []
      }
    };
    
    const result = bugTemplate(minimalData);
    
    // Check required fields are present
    expect(result).toContain('# Bug title');
    expect(result).toContain('Bug description');
    expect(result).toContain('Steps');
    expect(result).toContain('Expected');
    expect(result).toContain('Actual');
    
    // Check empty arrays show fallback text
    expect(result).toContain('- No components specified');
    expect(result).toContain('- No dependencies identified');
    expect(result).toContain('- Investigation required');
    
    // Should not show AI enhancements section
    expect(result).not.toContain('## Acceptance Criteria');
  });

  it('formats arrays correctly', () => {
    const result = bugTemplate(baseBugData);
    
    // Check components are bullet points
    expect(result).toMatch(/\*\*Affected Components:\*\*\n- Auth\n- UI/);
    
    // Check dependencies are bullet points
    expect(result).toMatch(/### Dependencies\n- React\n- NextAuth/);
    
    // Check AI criteria are numbered
    expect(result).toMatch(/## Acceptance Criteria\n1\. Login works\n2\. Error handling exists/);
  });

  it('handles special characters in content', () => {
    const dataWithSpecialChars: IssueFormData = {
      ...baseBugData,
      title: 'Bug with "quotes" and *asterisks*',
      description: 'Description with `code` and [links](http://example.com)',
      technical: {
        ...baseBugData.technical,
        stepsToReproduce: '1. Click\n2. Wait\n3. Error'
      }
    };
    
    const result = bugTemplate(dataWithSpecialChars);
    
    expect(result).toContain('# Bug with "quotes" and *asterisks*');
    expect(result).toContain('Description with `code` and [links](http://example.com)');
    expect(result).toContain('1. Click\n2. Wait\n3. Error');
  });

  it('handles multi-line steps to reproduce', () => {
    const dataWithMultilineSteps: IssueFormData = {
      ...baseBugData,
      technical: {
        ...baseBugData.technical,
        stepsToReproduce: '1. Open the app\n2. Navigate to login\n3. Enter credentials\n4. Click submit'
      }
    };
    
    const result = bugTemplate(dataWithMultilineSteps);
    
    expect(result).toContain('## Steps to Reproduce');
    expect(result).toContain('1. Open the app');
    expect(result).toContain('2. Navigate to login');
    expect(result).toContain('3. Enter credentials');
    expect(result).toContain('4. Click submit');
  });

  it('only shows success criteria when provided', () => {
    const dataWithoutCriteria: IssueFormData = {
      ...baseBugData,
      context: {
        ...baseBugData.context,
        successCriteria: ''
      }
    };
    
    const result = bugTemplate(dataWithoutCriteria);
    
    expect(result).not.toContain('**Success Criteria:**');
  });

  it('includes all AI enhancement arrays when provided', () => {
    const result = bugTemplate(baseBugData);
    
    // Count occurrences of each section
    expect(result).toContain('## Acceptance Criteria');
    expect(result).toContain('## Edge Cases to Consider');
    expect(result).toContain('## Technical Considerations');
    
    // Verify all items are included
    expect((result.match(/\d+\. Login works/g) || []).length).toBe(1);
    expect((result.match(/- Invalid credentials/g) || []).length).toBe(1);
    expect((result.match(/- Security implications/g) || []).length).toBe(1);
  });

  it('maintains proper markdown formatting', () => {
    const result = bugTemplate(baseBugData);
    
    // Check for proper heading levels
    expect(result).toMatch(/^# /m); // H1
    expect(result).toMatch(/^## /m); // H2
    
    // Check for proper line breaks between sections
    expect(result).toMatch(/\n\n## Business Impact/);
    expect(result).toMatch(/\n\n## Technical Details/);
    expect(result).toMatch(/\n\n## Implementation Details/);
    
    // Check footer has proper spacing
    expect(result).toMatch(/\n\n---\n\*Generated with/);
  });
});