import { IssueFormData } from '@/lib/types/issue';

export function generateClaudePrompt(data: IssueFormData): string {
  const lines: string[] = [];
  
  // Opening context
  lines.push(`I need you to implement a ${data.type} for a Next.js application.`);
  lines.push('Here are the requirements:');
  lines.push('');
  lines.push(data.description);
  lines.push('');
  
  // Technical context
  lines.push('Technical context:');
  
  if (data.technical.components && data.technical.components.length > 0) {
    lines.push(`- This affects these components: ${data.technical.components.join(', ')}`);
  }
  
  if (data.type === 'bug' && data.technical.stepsToReproduce) {
    lines.push('- Steps to reproduce the issue:');
    lines.push(data.technical.stepsToReproduce);
    lines.push(`- Expected: ${data.technical.expectedBehavior}`);
    lines.push(`- Actual: ${data.technical.actualBehavior}`);
  }
  
  if (data.type === 'epic' && data.technical.subFeatures) {
    lines.push('- This epic includes these sub-features:');
    data.technical.subFeatures.forEach(f => lines.push(`  - ${f}`));
  }
  
  if (data.type === 'technical-debt' && data.technical.improvementAreas) {
    lines.push('- Areas that need improvement:');
    data.technical.improvementAreas.forEach(a => lines.push(`  - ${a}`));
  }
  
  lines.push(`- Implementation should follow these patterns: ${data.implementation.approach}`);
  
  if (data.implementation.affectedFiles.length > 0) {
    lines.push(`- Key files to modify: ${data.implementation.affectedFiles.join(', ')}`);
  }
  
  lines.push('');
  
  // TDD approach
  lines.push('Please implement this feature following TDD principles:');
  lines.push('1. First write failing tests');
  lines.push('2. Implement the minimal code to pass tests');
  lines.push('3. Refactor for clarity and performance');
  lines.push('');
  
  // Acceptance criteria
  if (data.aiEnhancements?.acceptanceCriteria) {
    lines.push('Acceptance criteria:');
    data.aiEnhancements.acceptanceCriteria.forEach((ac, i) => {
      lines.push(`${i + 1}. ${ac}`);
    });
    lines.push('');
  }
  
  // Edge cases
  if (data.aiEnhancements?.edgeCases) {
    lines.push('Consider these edge cases:');
    data.aiEnhancements.edgeCases.forEach(ec => lines.push(`- ${ec}`));
    lines.push('');
  }
  
  // Technical considerations
  if (data.aiEnhancements?.technicalConsiderations) {
    lines.push('Technical considerations:');
    data.aiEnhancements.technicalConsiderations.forEach(tc => lines.push(`- ${tc}`));
  }
  
  return lines.join('\n');
}