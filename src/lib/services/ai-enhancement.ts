import OpenAI from 'openai';
import { IssueFormData } from '@/lib/types/issue';

export interface AIEnhancements {
  acceptanceCriteria: string[];
  edgeCases: string[];
  technicalConsiderations: string[];
  finalPrompt: string;
}

interface UsageStats {
  totalTokens: number;
  requestCount: number;
  estimatedCost: number;
}

export class AIEnhancementService {
  private openai: OpenAI;
  private usage: UsageStats = {
    totalTokens: 0,
    requestCount: 0,
    estimatedCost: 0,
  };

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async enhanceIssue(formData: IssueFormData): Promise<AIEnhancements> {
    try {
      const prompt = this.buildPrompt(formData);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating comprehensive GitHub issue enhancement for software development. 
            Your task is to analyze the provided issue details and generate:
            1. Specific acceptance criteria
            2. Edge cases to consider
            3. Technical implementation considerations
            4. A final comprehensive prompt for Claude Code
            
            Respond in JSON format with keys: acceptanceCriteria (array), edgeCases (array), technicalConsiderations (array), and finalPrompt (string).`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      // Update usage stats
      if (completion.usage) {
        this.usage.totalTokens += completion.usage.total_tokens;
        this.usage.requestCount += 1;
        // GPT-4 pricing: $0.03 per 1K input tokens, $0.06 per 1K output tokens
        // Using average for estimation
        this.usage.estimatedCost += (completion.usage.total_tokens / 1000) * 0.045;
      }

      const enhancements = JSON.parse(response) as AIEnhancements;
      return this.validateEnhancements(enhancements);
    } catch (error) {
      console.error('AI Enhancement failed:', error);
      return this.getDefaultEnhancements(formData.type);
    }
  }

  private buildPrompt(formData: IssueFormData): string {
    const baseInfo = `
Issue Type: ${formData.type}
Title: ${formData.title}
Description: ${formData.description}

Business Context:
- Value: ${formData.context.businessValue}
- Target Users: ${formData.context.targetUsers}
- Success Criteria: ${formData.context.successCriteria || 'Not specified'}

Implementation Details:
- Requirements: ${formData.implementation.requirements}
- Dependencies: ${formData.implementation.dependencies.join(', ') || 'None'}
- Approach: ${formData.implementation.approach}
- Affected Files: ${formData.implementation.affectedFiles.join(', ') || 'Multiple'}
`;

    let typeSpecificInfo = '';
    
    switch (formData.type) {
      case 'feature':
        typeSpecificInfo = `
Technical Components: ${formData.technical.components?.join(', ') || 'Not specified'}

This is a feature request that needs comprehensive implementation planning.
`;
        break;
      
      case 'bug':
        typeSpecificInfo = `
Steps to Reproduce:
${formData.technical.stepsToReproduce || 'Not provided'}

Expected Behavior: ${formData.technical.expectedBehavior || 'Not provided'}
Actual Behavior: ${formData.technical.actualBehavior || 'Not provided'}

This is a bug report that needs fixing with careful consideration of the root cause.
`;
        break;
      
      case 'epic':
        typeSpecificInfo = `
Sub-features:
${formData.technical.subFeatures?.map(f => `- ${f}`).join('\n') || 'Not specified'}

This is an epic that encompasses multiple features and needs to be broken down systematically.
`;
        break;
      
      case 'technical-debt':
        typeSpecificInfo = `
Improvement Areas:
${formData.technical.improvementAreas?.map(a => `- ${a}`).join('\n') || 'Not specified'}

This is a technical debt issue focused on improving code quality without changing functionality.
`;
        break;
    }

    return `${baseInfo}${typeSpecificInfo}

Please analyze this ${formData.type} and provide:
1. Specific, measurable acceptance criteria
2. Edge cases that developers should consider
3. Technical considerations for implementation
4. A comprehensive final prompt for Claude Code that includes all context and requirements

Focus on being specific and actionable. The final prompt should be ready to paste into Claude Code.`;
  }

  private validateEnhancements(enhancements: any): AIEnhancements {
    return {
      acceptanceCriteria: Array.isArray(enhancements.acceptanceCriteria) 
        ? enhancements.acceptanceCriteria 
        : ['The feature works as described'],
      edgeCases: Array.isArray(enhancements.edgeCases) 
        ? enhancements.edgeCases 
        : ['Consider error handling'],
      technicalConsiderations: Array.isArray(enhancements.technicalConsiderations) 
        ? enhancements.technicalConsiderations 
        : ['Ensure security best practices'],
      finalPrompt: typeof enhancements.finalPrompt === 'string' 
        ? enhancements.finalPrompt 
        : 'Please implement this feature following the requirements above.',
    };
  }

  private getDefaultEnhancements(type: IssueFormData['type']): AIEnhancements {
    const defaults: Record<IssueFormData['type'], AIEnhancements> = {
      feature: {
        acceptanceCriteria: [
          'The feature works as described in the requirements',
          'All user interactions provide appropriate feedback',
          'The feature is accessible and follows WCAG guidelines',
        ],
        edgeCases: [
          'Handle error states gracefully',
          'Consider empty or null data scenarios',
          'Ensure proper loading states',
        ],
        technicalConsiderations: [
          'Follow existing code patterns and conventions',
          'Ensure proper error handling and logging',
          'Add appropriate tests for new functionality',
          'Consider security implications',
        ],
        finalPrompt: 'Please implement this feature following TDD principles. First write failing tests, then implement the minimal code to pass, and finally refactor for clarity and performance.',
      },
      bug: {
        acceptanceCriteria: [
          'The bug is fixed and the expected behavior is restored',
          'No regression in existing functionality',
          'Appropriate tests are added to prevent recurrence',
        ],
        edgeCases: [
          'Verify the fix works with edge case inputs',
          'Check for similar issues in related code',
          'Ensure the fix handles all error scenarios',
        ],
        technicalConsiderations: [
          'Identify and address the root cause, not just symptoms',
          'Add regression tests',
          'Update documentation if behavior changes',
        ],
        finalPrompt: 'Please fix this bug by first reproducing it with a failing test, then implementing the fix, and ensuring all tests pass.',
      },
      epic: {
        acceptanceCriteria: [
          'All sub-features are implemented and integrated',
          'The epic delivers the promised business value',
          'Performance and scalability requirements are met',
        ],
        edgeCases: [
          'Consider interactions between sub-features',
          'Plan for phased rollout and feature flags',
          'Handle data migration if needed',
        ],
        technicalConsiderations: [
          'Design for modularity and maintainability',
          'Consider architectural implications',
          'Plan for monitoring and observability',
        ],
        finalPrompt: 'Please implement this epic by breaking it down into manageable tasks, implementing each sub-feature with tests, and ensuring proper integration.',
      },
      'technical-debt': {
        acceptanceCriteria: [
          'Code is refactored without changing functionality',
          'All existing tests continue to pass',
          'Code quality metrics improve',
        ],
        edgeCases: [
          'Ensure backward compatibility',
          'Preserve existing API contracts',
          'Handle deprecation gracefully',
        ],
        technicalConsiderations: [
          'Maintain test coverage during refactoring',
          'Document architectural decisions',
          'Consider performance implications',
        ],
        finalPrompt: 'Please refactor this code to improve maintainability while ensuring all existing functionality remains intact. Run all tests frequently during refactoring.',
      },
    };

    return defaults[type];
  }

  getUsageStats(): UsageStats {
    return { ...this.usage };
  }

  resetUsageStats(): void {
    this.usage = {
      totalTokens: 0,
      requestCount: 0,
      estimatedCost: 0,
    };
  }
}