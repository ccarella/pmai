import { IssueFormData } from '@/lib/types/issue';

export const bugTemplate = (data: IssueFormData): string => {
  return `# ${data.title}

## Bug Description
${data.description}

## Steps to Reproduce
${data.technical.stepsToReproduce || 'No steps provided'}

## Expected Behavior
${data.technical.expectedBehavior || 'Not specified'}

## Actual Behavior
${data.technical.actualBehavior || 'Not specified'}

## Business Impact
**Affected Users:** ${data.context.targetUsers}
**Business Value:** ${data.context.businessValue}
${data.context.successCriteria ? `**Success Criteria:** ${data.context.successCriteria}` : ''}

## Technical Details
**Affected Components:**
${data.technical.components?.map(c => `- ${c}`).join('\n') || '- No components specified'}

## Implementation Details
### Proposed Fix
${data.implementation.approach}

### Requirements
${data.implementation.requirements}

### Dependencies
${data.implementation.dependencies.length > 0 
  ? data.implementation.dependencies.map(d => `- ${d}`).join('\n')
  : '- No dependencies identified'}

### Files to Modify
${data.implementation.affectedFiles.length > 0
  ? data.implementation.affectedFiles.map(f => `- \`${f}\``).join('\n')
  : '- Investigation required'}

${data.aiEnhancements ? `## Acceptance Criteria
${data.aiEnhancements.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

## Edge Cases to Consider
${data.aiEnhancements.edgeCases.map(ec => `- ${ec}`).join('\n')}

## Technical Considerations
${data.aiEnhancements.technicalConsiderations.map(tc => `- ${tc}`).join('\n')}` : ''}

---
*Generated with [GitHub Issue Generator for Claude Code](https://github.com/ccarella/pmai)*
`;
};