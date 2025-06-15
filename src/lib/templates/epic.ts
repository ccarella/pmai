import { IssueFormData } from '@/lib/types/issue';

export const epicTemplate = (data: IssueFormData): string => {
  return `# ${data.title}

## Epic Overview
${data.description}

## Business Justification
**Strategic Value:** ${data.context.businessValue}
**Target Users:** ${data.context.targetUsers}
${data.context.successCriteria ? `**Success Metrics:** ${data.context.successCriteria}` : ''}

## Sub-Features
${data.technical.subFeatures && data.technical.subFeatures.length > 0
  ? data.technical.subFeatures.map((feature, i) => `${i + 1}. ${feature}`).join('\n')
  : 'No sub-features defined'}

## Technical Scope
**Affected Components:**
${data.technical.components?.map(c => `- ${c}`).join('\n') || '- To be determined during planning'}

## Implementation Strategy
${data.implementation.approach}

### High-Level Requirements
${data.implementation.requirements}

### Known Dependencies
${data.implementation.dependencies.length > 0 
  ? data.implementation.dependencies.map(d => `- ${d}`).join('\n')
  : '- To be identified during technical planning'}

### Initial Files/Areas of Impact
${data.implementation.affectedFiles.length > 0
  ? data.implementation.affectedFiles.map(f => `- \`${f}\``).join('\n')
  : '- To be determined during implementation planning'}

${data.aiEnhancements ? `## Definition of Done
${data.aiEnhancements.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

## Risk Factors & Edge Cases
${data.aiEnhancements.edgeCases.map(ec => `- ${ec}`).join('\n')}

## Technical Considerations
${data.aiEnhancements.technicalConsiderations.map(tc => `- ${tc}`).join('\n')}` : ''}

## Implementation Phases
This epic should be broken down into the following issues:
1. [To be defined based on sub-features]
2. [Additional phases to be planned]

---
*Generated with [GitHub Issue Generator for Claude Code](https://github.com/ccarella/pmai)*
`;
};