import { IssueFormData } from '@/lib/types/issue';

export const generateClaudePrompt = (data: IssueFormData): string => {
  const basePrompt = `I need you to implement a ${data.type} for a Next.js application. 
Here are the requirements:

${data.description}

Technical context:
- This affects these components: ${data.technical.components?.join(', ') || 'Not specified'}
- Implementation should follow these patterns: ${data.implementation.approach}
- Key files to modify: ${data.implementation.affectedFiles.join(', ') || 'To be determined'}

Please implement this ${data.type} following TDD principles:
1. First write failing tests
2. Implement the minimal code to pass tests
3. Refactor for clarity and performance`;

  // Add type-specific context
  let typeSpecificPrompt = '';
  
  switch (data.type) {
    case 'feature':
      typeSpecificPrompt = `
Business context:
- Value: ${data.context.businessValue}
- Target users: ${data.context.targetUsers}
${data.context.successCriteria ? `- Success criteria: ${data.context.successCriteria}` : ''}`;
      break;
      
    case 'bug':
      typeSpecificPrompt = `
Bug details:
- Steps to reproduce: ${data.technical.stepsToReproduce || 'Not provided'}
- Expected behavior: ${data.technical.expectedBehavior || 'Not specified'}
- Actual behavior: ${data.technical.actualBehavior || 'Not specified'}
- Affected users: ${data.context.targetUsers}`;
      break;
      
    case 'epic':
      typeSpecificPrompt = `
Epic scope:
- Strategic value: ${data.context.businessValue}
- Sub-features to implement:
${data.technical.subFeatures?.map((f, i) => `  ${i + 1}. ${f}`).join('\n') || '  To be defined'}
- This is a large feature that should be broken down into smaller tasks`;
      break;
      
    case 'technical-debt':
      typeSpecificPrompt = `
Refactoring details:
- Current problems: ${data.technical.improvementAreas?.join(', ') || 'Not specified'}
- Impact on development: ${data.context.businessValue}
- Ensure backward compatibility and comprehensive test coverage before refactoring`;
      break;
  }

  // Add AI enhancements if available
  const aiEnhancementsPrompt = data.aiEnhancements ? `

Acceptance criteria:
${data.aiEnhancements.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

Consider these edge cases:
${data.aiEnhancements.edgeCases.map(ec => `- ${ec}`).join('\n')}

Technical considerations:
${data.aiEnhancements.technicalConsiderations.map(tc => `- ${tc}`).join('\n')}` : '';

  return `${basePrompt}${typeSpecificPrompt}${aiEnhancementsPrompt}`.trim();
};

export const generateClaudeInstructions = (data: IssueFormData): string => {
  return `# Implementation Instructions for Claude Code

## Task Type: ${data.type.charAt(0).toUpperCase() + data.type.slice(1).replace('-', ' ')}

### Title
${data.title}

### Implementation Requirements
${data.implementation.requirements}

### Dependencies to Install
${data.implementation.dependencies.length > 0 
  ? `\`\`\`bash\nnpm install ${data.implementation.dependencies.join(' ')}\n\`\`\``
  : 'No additional dependencies required'}

### Development Workflow
1. **Write Tests First**
   - Create test files for new components/features
   - Ensure tests cover all acceptance criteria
   - Run tests to verify they fail initially

2. **Implement Solution**
   - Follow the implementation approach described
   - Make minimal changes to pass tests
   - Keep changes focused on the requirements

3. **Refactor and Optimize**
   - Improve code clarity and performance
   - Ensure all tests still pass
   - Update documentation as needed

### Files to Focus On
${data.implementation.affectedFiles.length > 0
  ? data.implementation.affectedFiles.map(f => `- ${f}`).join('\n')
  : '- Review the codebase to identify relevant files'}

### Testing Checklist
- [ ] Unit tests for all new functions/components
- [ ] Integration tests for feature workflows
- [ ] Edge cases are covered
- [ ] Error handling is tested
- [ ] Accessibility requirements are met

### Code Review Checklist
- [ ] Follows existing code patterns and conventions
- [ ] No unnecessary dependencies added
- [ ] Performance implications considered
- [ ] Security best practices followed
- [ ] Documentation updated where needed`;
};