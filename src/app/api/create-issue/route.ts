import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancementService } from '@/lib/services/ai-enhancement';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/utils/rate-limit';
import { generateAutoTitle } from '@/lib/services/auto-title-generation';
import { z } from 'zod';

// Initialize AI service (singleton pattern)
let aiService: AIEnhancementService | null = null;

function getAIService(): AIEnhancementService | null {
  // Reset singleton if API key changes (useful for tests)
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    aiService = null;
    return null;
  }
  
  if (!aiService) {
    aiService = new AIEnhancementService(apiKey);
  }
  return aiService;
}

// Request validation schema
const createIssueSchema = z.object({
  title: z.string().optional(),
  prompt: z.string().min(1, 'Prompt is required'),
});

interface SmartPromptAIEnhancements {
  original: string;
  markdown: string;
  claudePrompt: string;
  summary: {
    type: string;
    priority: string;
    estimatedEffort: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitRequests = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '20');
    const rateLimit = await checkRateLimit(request, rateLimitRequests);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = createIssueSchema.parse(body);
    
    // Validate title if provided
    if (validatedData.title && validatedData.title.trim().length > 70) {
      return NextResponse.json(
        { error: 'Invalid request data', details: [{ message: 'Title must be 70 characters or less' }] },
        { status: 400 }
      );
    }
    
    // Generate title automatically if not provided or is generic
    const titleResult = await generateAutoTitle(validatedData.prompt, validatedData.title);
    const processedData = {
      title: titleResult.title,
      prompt: validatedData.prompt.trim(),
    };

    // Get AI service
    const service = getAIService();
    
    // If no service available (no API key), return basic structured response
    if (!service) {
      const basicResponse = generateBasicIssue(processedData);
      return NextResponse.json(
        {
          ...basicResponse,
          original: processedData.prompt,
          generatedTitle: titleResult.isGenerated ? titleResult.title : undefined,
          titleAlternatives: titleResult.alternatives,
        },
        {
          status: 200,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }
    
    
    // Check cost protection
    const usage = service.getUsageStats();
    const maxMonthlyCost = parseFloat(process.env.MAX_MONTHLY_COST_USD || '10');
    
    if (usage.estimatedCost >= maxMonthlyCost) {
      return NextResponse.json(
        { 
          error: `Monthly cost limit exceeded. Current cost: $${usage.estimatedCost.toFixed(2)}`,
          usage,
        },
        { status: 429 }
      );
    }

    // Generate enhanced issue using AI
    const enhanced = await generateEnhancedIssue(service, processedData);
    
    // Get updated usage stats
    const updatedUsage = service.getUsageStats();

    const response = {
      ...enhanced,
      original: processedData.prompt,
      usage: updatedUsage,
      generatedTitle: titleResult.isGenerated ? titleResult.title : undefined,
      titleAlternatives: titleResult.alternatives,
    };
    

    return NextResponse.json(
      response,
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
    
  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create issue. Please try again.' },
      { status: 500 }
    );
  }
}

async function generateEnhancedIssue(
  service: AIEnhancementService, 
  data: { title: string; prompt: string }
): Promise<SmartPromptAIEnhancements> {
  try {
    // Create a comprehensive prompt for the AI to analyze and structure
    const systemPrompt = `# Transform User Input into Claude Code-Optimized GitHub Issue

You are an expert at creating clear, actionable GitHub issues specifically formatted to work effectively with Claude Code. Your task is to transform raw user input into a well-structured issue that Claude Code can execute successfully.

Your response must be in JSON format with these keys:
- markdown: The complete GitHub issue in markdown format
- claudePrompt: The Claude Code-optimized prompt
- summary: An object with type, priority, and estimatedEffort

Extract all relevant details from the user's description and structure them for maximum clarity and actionability.

## GitHub Issue Template

### Title
[Use the provided title or create a concise, action-oriented title starting with a verb]

### Overview
[Provide a clear, 2-3 sentence summary of what needs to be accomplished]

### Context
[Extract and organize any background information, current state, or problem description from the user's input]

### Requirements
[List specific, actionable requirements extracted or inferred from the description]
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3
[Add more as needed]

### Technical Specifications
[Include any technical details mentioned or reasonably inferred]
- **Framework**: [NextJS/React/etc. if mentioned]
- **UI Library**: [shadcn/ui, Tailwind, etc. if mentioned]
- **Key Dependencies**: [List any mentioned libraries or tools]
- **API Endpoints**: [If relevant]
- **Data Structures**: [If relevant]

### Implementation Guide
[Provide a step-by-step approach for Claude Code]
1. [First logical step]
2. [Second step]
3. [Continue with clear, sequential steps]

### Acceptance Criteria
[Define clear, testable criteria for completion]
- [ ] [Specific, measurable outcome 1]
- [ ] [Specific, measurable outcome 2]
- [ ] [User-facing feature or behavior]
- [ ] All tests pass
- [ ] Code follows project conventions

### Code Structure
\`\`\`
[Suggest file structure if relevant]
/components/[ComponentName].tsx
/lib/[utility].ts
/app/[route]/page.tsx
\`\`\`

### Example Usage
[If applicable, provide a usage example or user flow]
\`\`\`typescript
// Example code snippet or usage pattern
\`\`\`

### Additional Notes
[Include any constraints, design preferences, or special considerations]
- Design should follow modern minimalist principles
- Ensure accessibility compliance
- [Other relevant notes from the description]

### Definition of Done
- [ ] Feature is fully implemented and functional
- [ ] Code is clean, commented, and follows best practices
- [ ] Tests are written and passing
- [ ] Documentation is updated if needed
- [ ] Feature works in development environment

---
*This issue is formatted for optimal use with Claude Code. Each section provides clear context and actionable steps for implementation.*

## Formatting Guidelines

When creating the issue:

1. **Be Specific**: Transform vague requests into concrete, actionable tasks
2. **Add Structure**: Even if the user provides a stream of consciousness, organize it logically
3. **Infer Smartly**: If the user mentions they're building a "form", infer they'll need validation, error handling, and success states
4. **Technical Context**: If they mention specific technologies (NextJS, Vercel, etc.), incorporate relevant best practices
5. **Claude Code Optimization**: 
   - Use clear, imperative language
   - Break complex tasks into steps
   - Provide file paths and structure
   - Include example code when helpful
   - Make acceptance criteria testable`;

    const userPrompt = `Title: ${data.title}

User Prompt: ${data.prompt}

Please analyze this and create a comprehensive GitHub issue with all necessary sections.`;

    // Use the existing OpenAI client from the service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await (service as any).openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // Using gpt-4-turbo-preview which supports JSON mode
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }


    // Update usage stats manually since we're using the service's OpenAI client directly
    if (completion.usage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).usage.totalTokens += completion.usage.total_tokens;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).usage.requestCount += 1;
      // gpt-4-turbo pricing: ~$0.01 per 1K input tokens, $0.03 per 1K output tokens
      // Using average for estimation: ~$0.02 per 1K tokens
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).usage.estimatedCost += (completion.usage.total_tokens / 1000) * 0.02;
    }

    const parsed = JSON.parse(response);
    
    return {
      original: data.prompt,
      markdown: parsed.markdown || generateBasicMarkdown(data),
      claudePrompt: parsed.claudePrompt || generateBasicClaudePrompt(data),
      summary: {
        type: parsed.summary?.type || 'feature',
        priority: parsed.summary?.priority || 'medium',
        estimatedEffort: parsed.summary?.estimatedEffort || 'medium',
      },
    };
  } catch (error) {
    console.error('AI enhancement failed:', error);
    return generateBasicIssue(data);
  }
}

function generateBasicIssue(data: { title: string; prompt: string }): SmartPromptAIEnhancements {
  return {
    original: data.prompt,
    markdown: generateBasicMarkdown(data),
    claudePrompt: generateBasicClaudePrompt(data),
    summary: {
      type: 'feature',
      priority: 'medium',
      estimatedEffort: 'medium',
    },
  };
}

function generateBasicMarkdown(data: { title: string; prompt: string }): string {
  return `# ${data.title}

## Description
${data.prompt}

## Acceptance Criteria
- [ ] The feature works as described
- [ ] All edge cases are handled
- [ ] Appropriate tests are added

## Technical Considerations
- Follow existing code patterns
- Ensure proper error handling
- Add comprehensive tests

## Implementation Notes
Please implement this feature following best practices and ensuring all requirements are met.
`;
}

function generateBasicClaudePrompt(data: { title: string; prompt: string }): string {
  return `Please implement: ${data.title}

Requirements:
${data.prompt}

Please follow these guidelines:
1. Write tests first (TDD approach)
2. Follow existing code patterns and conventions
3. Ensure proper error handling
4. Add appropriate documentation
5. Consider edge cases and security implications

Let me know if you need any clarification on the requirements.`;
}