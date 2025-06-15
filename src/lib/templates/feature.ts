import { IssueFormData } from '@/lib/types/issue';

export const featureTemplate = (data: IssueFormData): string => {
  return `# ${data.title}

## Overview
${data.description}

## Business Context
**Value:** ${data.context.businessValue}
**Target Users:** ${data.context.targetUsers}
${data.context.successCriteria ? `**Success Criteria:** ${data.context.successCriteria}` : ''}

## Technical Details
**Affected Components:**
${data.technical.components?.map(c => `- ${c}`).join('\n') || '- No components specified'}

## Implementation Approach
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
  : '- No specific files identified yet'}

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