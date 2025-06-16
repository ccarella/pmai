import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancementService } from '@/lib/services/ai-enhancement';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/utils/rate-limit';
import { z } from 'zod';

// Initialize AI service (singleton pattern)
let aiService: AIEnhancementService | null = null;

function getAIService(): AIEnhancementService | null {
  if (!aiService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return null;
    }
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
    
    // Handle title fallback
    const finalTitle = validatedData.title?.trim() || validatedData.prompt.slice(0, 60).trim();
    const processedData = {
      title: finalTitle,
      prompt: validatedData.prompt.trim(),
    };

    // Get AI service
    const service = getAIService();
    
    // If no service available (no API key), return basic structured response
    if (!service) {
      const basicResponse = generateBasicIssue(processedData);
      return NextResponse.json(
        basicResponse,
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

    return NextResponse.json(
      {
        ...enhanced,
        usage: updatedUsage,
      },
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
    const systemPrompt = `You are an expert at creating comprehensive GitHub issues from user prompts. 
    Your task is to analyze the user's prompt and create:
    1. A complete GitHub issue in markdown format
    2. A Claude Code-optimized prompt for developers
    3. A summary with type classification, priority, and effort estimate

    The GitHub issue should include:
    - Clear title and description
    - User story format where applicable
    - Acceptance criteria
    - Technical considerations
    - Implementation notes

    Respond in JSON format with keys: markdown, claudePrompt, and summary (with type, priority, estimatedEffort).`;

    const userPrompt = `Title: ${data.title}

User Prompt: ${data.prompt}

Please analyze this and create a comprehensive GitHub issue with all necessary sections.`;

    // Use the existing OpenAI client from the service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await (service as any).openai.chat.completions.create({
      model: 'gpt-4',
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).usage.estimatedCost += (completion.usage.total_tokens / 1000) * 0.045;
    }

    const parsed = JSON.parse(response);
    return {
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