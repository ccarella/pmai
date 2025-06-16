import { IssueFormData } from '@/lib/types/issue';

export const technicalDebtTemplate = (data: IssueFormData): string => {
  return `# ${data.title}

## Technical Debt Description
${data.description}

## Current Problems
${data.technical.improvementAreas && data.technical.improvementAreas.length > 0
  ? data.technical.improvementAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')
  : 'No specific improvement areas identified'}

## Business Justification
**Impact on Development:** ${data.context.businessValue}
**Affected Teams/Users:** ${data.context.targetUsers}
${data.context.successCriteria ? `**Success Metrics:** ${data.context.successCriteria}` : ''}

## Technical Details
**Components Requiring Refactoring:**
${data.technical.components?.map(c => `- ${c}`).join('\n') || '- No components specified'}

## Refactoring Plan
${data.implementation.approach}

### Requirements
${data.implementation.requirements}

### Dependencies
${data.implementation.dependencies.length > 0 
  ? data.implementation.dependencies.map(d => `- ${d}`).join('\n')
  : '- No blocking dependencies'}

### Files to Refactor
${data.implementation.affectedFiles.length > 0
  ? data.implementation.affectedFiles.map(f => `- \`${f}\``).join('\n')
  : '- To be identified during analysis'}

${data.aiEnhancements ? `## Acceptance Criteria
${data.aiEnhancements.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

## Potential Risks
${data.aiEnhancements.edgeCases.map(ec => `- ${ec}`).join('\n')}

## Technical Considerations
${data.aiEnhancements.technicalConsiderations.map(tc => `- ${tc}`).join('\n')}` : ''}

## Migration Strategy
- [ ] Create comprehensive test coverage before refactoring
- [ ] Implement changes incrementally
- [ ] Ensure backward compatibility where needed
- [ ] Update documentation

---
*Generated with [GitHub Issue Generator for Claude Code](https://github.com/ccarella/pmai)*
`;
};