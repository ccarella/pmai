import { IssueFormData } from '@/lib/types/issue';

export function generateMarkdown(data: IssueFormData): string {
  const sections: string[] = [];
  
  // Title and Description
  sections.push(`# ${data.title}`);
  sections.push('');
  sections.push('## Overview');
  sections.push(data.description);
  sections.push('');
  
  // Business Context
  sections.push('## Business Context');
  sections.push(`**Value:** ${data.context.businessValue}`);
  sections.push(`**Target Users:** ${data.context.targetUsers}`);
  if (data.context.successCriteria) {
    sections.push(`**Success Criteria:** ${data.context.successCriteria}`);
  }
  sections.push('');
  
  // Technical Details (varies by issue type)
  sections.push('## Technical Details');
  
  if (data.type === 'feature' && data.technical.components) {
    sections.push('**Affected Components:**');
    data.technical.components.forEach(c => sections.push(`- ${c}`));
  }
  
  if (data.type === 'bug') {
    if (data.technical.stepsToReproduce) {
      sections.push('**Steps to Reproduce:**');
      sections.push(data.technical.stepsToReproduce);
      sections.push('');
    }
    if (data.technical.expectedBehavior) {
      sections.push(`**Expected Behavior:** ${data.technical.expectedBehavior}`);
    }
    if (data.technical.actualBehavior) {
      sections.push(`**Actual Behavior:** ${data.technical.actualBehavior}`);
    }
  }
  
  if (data.type === 'epic' && data.technical.subFeatures) {
    sections.push('**Sub-features:**');
    data.technical.subFeatures.forEach(f => sections.push(`- ${f}`));
  }
  
  if (data.type === 'technical-debt' && data.technical.improvementAreas) {
    sections.push('**Areas to Improve:**');
    data.technical.improvementAreas.forEach(a => sections.push(`- ${a}`));
  }
  
  sections.push('');
  
  // Implementation Details
  sections.push('## Implementation Approach');
  sections.push(data.implementation.approach);
  sections.push('');
  
  sections.push('### Requirements');
  sections.push(data.implementation.requirements);
  sections.push('');
  
  if (data.implementation.dependencies.length > 0) {
    sections.push('### Dependencies');
    data.implementation.dependencies.forEach(d => sections.push(`- ${d}`));
    sections.push('');
  }
  
  if (data.implementation.affectedFiles.length > 0) {
    sections.push('### Files to Modify');
    data.implementation.affectedFiles.forEach(f => sections.push(`- \`${f}\``));
    sections.push('');
  }
  
  // AI Enhancements
  if (data.aiEnhancements) {
    sections.push('## Acceptance Criteria');
    data.aiEnhancements.acceptanceCriteria.forEach((ac, i) => {
      sections.push(`${i + 1}. ${ac}`);
    });
    sections.push('');
    
    sections.push('## Edge Cases to Consider');
    data.aiEnhancements.edgeCases.forEach(ec => sections.push(`- ${ec}`));
    sections.push('');
    
    sections.push('## Technical Considerations');
    data.aiEnhancements.technicalConsiderations.forEach(tc => sections.push(`- ${tc}`));
    sections.push('');
  }
  
  // Footer
  sections.push('---');
  sections.push('*Generated with [Issue Generator for Claude Code](https://github.com/ccarella/pmai)*');
  
  return sections.join('\n');
}