import { bugTemplate } from '@/lib/templates/bug';
import { IssueFormData } from '@/lib/types/issue';

describe('bugTemplate', () => {
  const baseIssueData: IssueFormData = {
    type: 'bug',
    title: 'Login button not working on mobile',
    description: 'Users are unable to login using the mobile app when clicking the login button.',
    context: {
      businessValue: 'Critical functionality preventing user access',
      targetUsers: 'All mobile app users',
      successCriteria: 'Users can successfully login on all mobile devices',
    },
    technical: {
      stepsToReproduce: '1. Open mobile app\n2. Navigate to login screen\n3. Enter credentials\n4. Click login button',
      expectedBehavior: 'User should be logged in and redirected to dashboard',
      actualBehavior: 'Button click does nothing, no error message shown',
      components: ['LoginButton', 'AuthService', 'MobileApp'],
    },
    implementation: {
      requirements: 'Fix event handler binding on mobile platforms',
      dependencies: ['react-native', '@auth/mobile-sdk'],
      approach: 'Debug event propagation on mobile WebView and fix touch event handling',
      affectedFiles: ['src/components/LoginButton.tsx', 'src/services/auth.ts'],
    },
  };

  it('generates a complete bug report with all fields', () => {
    const result = bugTemplate(baseIssueData);

    // Check title
    expect(result).toContain('# Login button not working on mobile');

    // Check bug description
    expect(result).toContain('## Bug Description');
    expect(result).toContain('Users are unable to login using the mobile app');

    // Check steps to reproduce
    expect(result).toContain('## Steps to Reproduce');
    expect(result).toContain('1. Open mobile app');
    expect(result).toContain('4. Click login button');

    // Check expected vs actual behavior
    expect(result).toContain('## Expected Behavior');
    expect(result).toContain('User should be logged in and redirected to dashboard');
    expect(result).toContain('## Actual Behavior');
    expect(result).toContain('Button click does nothing, no error message shown');

    // Check business impact
    expect(result).toContain('**Affected Users:** All mobile app users');
    expect(result).toContain('**Business Value:** Critical functionality preventing user access');
    expect(result).toContain('**Success Criteria:** Users can successfully login on all mobile devices');

    // Check technical details
    expect(result).toContain('**Affected Components:**');
    expect(result).toContain('- LoginButton');
    expect(result).toContain('- AuthService');
    expect(result).toContain('- MobileApp');

    // Check implementation details
    expect(result).toContain('### Proposed Fix');
    expect(result).toContain('Debug event propagation on mobile WebView');
    expect(result).toContain('### Requirements');
    expect(result).toContain('Fix event handler binding on mobile platforms');
    expect(result).toContain('### Dependencies');
    expect(result).toContain('- react-native');
    expect(result).toContain('- @auth/mobile-sdk');
    expect(result).toContain('### Files to Modify');
    expect(result).toContain('- `src/components/LoginButton.tsx`');
    expect(result).toContain('- `src/services/auth.ts`');

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
        stepsToReproduce: undefined,
        expectedBehavior: undefined,
        actualBehavior: undefined,
        components: [],
      },
      implementation: {
        ...baseIssueData.implementation,
        dependencies: [],
        affectedFiles: [],
      },
    };

    const result = bugTemplate(minimalData);

    // Check defaults for missing fields
    expect(result).toContain('## Steps to Reproduce\nNo steps provided');
    expect(result).toContain('## Expected Behavior\nNot specified');
    expect(result).toContain('## Actual Behavior\nNot specified');
    expect(result).not.toContain('**Success Criteria:**');
    expect(result).toContain('- No components specified');
    expect(result).toContain('- No dependencies identified');
    expect(result).toContain('- Investigation required');
  });

  it('includes AI enhancements when provided', () => {
    const dataWithAI: IssueFormData = {
      ...baseIssueData,
      aiEnhancements: {
        acceptanceCriteria: [
          'Login button responds to touch events on all mobile devices',
          'Error messages are displayed when login fails',
          'Loading state is shown during authentication',
        ],
        edgeCases: [
          'Double-tap prevention',
          'Network timeout handling',
          'Invalid credential format',
        ],
        technicalConsiderations: [
          'Check touch event delegation in WebView',
          'Verify z-index and overlay issues',
          'Test on both iOS and Android platforms',
        ],
      },
    };

    const result = bugTemplate(dataWithAI);

    // Check acceptance criteria
    expect(result).toContain('## Acceptance Criteria');
    expect(result).toContain('1. Login button responds to touch events on all mobile devices');
    expect(result).toContain('2. Error messages are displayed when login fails');
    expect(result).toContain('3. Loading state is shown during authentication');

    // Check edge cases
    expect(result).toContain('## Edge Cases to Consider');
    expect(result).toContain('- Double-tap prevention');
    expect(result).toContain('- Network timeout handling');
    expect(result).toContain('- Invalid credential format');

    // Check technical considerations
    expect(result).toContain('## Technical Considerations');
    expect(result).toContain('- Check touch event delegation in WebView');
    expect(result).toContain('- Verify z-index and overlay issues');
    expect(result).toContain('- Test on both iOS and Android platforms');
  });

  it('excludes AI sections when not provided', () => {
    const result = bugTemplate(baseIssueData);

    expect(result).not.toContain('## Acceptance Criteria');
    expect(result).not.toContain('## Edge Cases to Consider');
    expect(result).not.toContain('## Technical Considerations');
  });

  it('handles multi-line steps to reproduce correctly', () => {
    const dataWithMultilineSteps: IssueFormData = {
      ...baseIssueData,
      technical: {
        ...baseIssueData.technical,
        stepsToReproduce: `1. Open the application
2. Navigate to settings page
   - Click on menu icon
   - Select "Settings" option
3. Scroll down to "Account" section
4. Click "Delete Account" button
5. Observe the error`,
      },
    };

    const result = bugTemplate(dataWithMultilineSteps);

    expect(result).toContain('1. Open the application');
    expect(result).toContain('   - Click on menu icon');
    expect(result).toContain('   - Select "Settings" option');
    expect(result).toContain('5. Observe the error');
  });

  it('escapes backticks in file paths', () => {
    const dataWithSpecialChars: IssueFormData = {
      ...baseIssueData,
      implementation: {
        ...baseIssueData.implementation,
        affectedFiles: ['src/utils/`special`.ts', 'src/components/Button.tsx'],
      },
    };

    const result = bugTemplate(dataWithSpecialChars);

    expect(result).toContain('- `src/utils/`special`.ts`');
    expect(result).toContain('- `src/components/Button.tsx`');
  });

  it('handles empty strings vs undefined differently', () => {
    const dataWithEmptyStrings: IssueFormData = {
      ...baseIssueData,
      technical: {
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: '',
        components: [],
      },
    };

    const result = bugTemplate(dataWithEmptyStrings);

    // Empty strings are treated as falsy and show default text
    expect(result).toContain('## Steps to Reproduce\nNo steps provided');
    expect(result).toContain('## Expected Behavior\nNot specified');
    expect(result).toContain('## Actual Behavior\nNot specified');
  });

  it('formats long descriptions with proper line breaks', () => {
    const dataWithLongDescription: IssueFormData = {
      ...baseIssueData,
      description: `This is a critical bug affecting our mobile application.

The login functionality is completely broken on iOS devices running version 15.0 and above.

Additional context:
- Started happening after the latest deployment
- Only affects iOS, Android works fine
- No console errors are visible`,
    };

    const result = bugTemplate(dataWithLongDescription);

    expect(result).toContain('This is a critical bug affecting our mobile application.');
    expect(result).toContain('The login functionality is completely broken');
    expect(result).toContain('- Started happening after the latest deployment');
  });

  it('handles special characters in content', () => {
    const dataWithSpecialChars: IssueFormData = {
      ...baseIssueData,
      title: 'Bug: Login fails with "special" <characters> & symbols',
      technical: {
        ...baseIssueData.technical,
        actualBehavior: 'Shows error: "Invalid <token>" & crashes',
      },
    };

    const result = bugTemplate(dataWithSpecialChars);

    expect(result).toContain('# Bug: Login fails with "special" <characters> & symbols');
    expect(result).toContain('Shows error: "Invalid <token>" & crashes');
  });
});