import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancementService } from '@/lib/services/ai-enhancement';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/utils/rate-limit';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userProfiles } from '@/lib/services/user-storage';

// Function to get AI service with user-specific API key
async function getAIService(userId?: string): Promise<AIEnhancementService | null> {
  // Only accept user-specific API key
  if (userId) {
    const userApiKey = await userProfiles.getOpenAIKey(userId);
    if (userApiKey) {
      return new AIEnhancementService(userApiKey);
    }
  }
  
  // No user API key available - do not fall back to system key
  return null;
}

// Request validation schema
const generateTitleSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters long'),
});

interface TitleGenerationResponse {
  title: string;
  alternatives?: string[];
  isGenerated: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Check rate limit - more lenient for title generation
    const rateLimitRequests = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '50');
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
    const validatedData = generateTitleSchema.parse(body);
    
    // Get AI service with user-specific API key
    const service = await getAIService(userId);
    
    // If no service available (no API key), return error
    if (!service) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key required',
          message: 'Please configure your OpenAI API key in Settings to use AI-powered title generation.',
          requiresApiKey: true,
        },
        { 
          status: 403,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }
    
    // Check cost protection
    const usage = service.getUsageStats();
    const maxMonthlyCost = parseFloat(process.env.MAX_MONTHLY_COST_USD || '10');
    
    if (usage.estimatedCost >= maxMonthlyCost) {
      const fallbackTitle = generateFallbackTitle(validatedData.prompt);
      return NextResponse.json(
        {
          title: fallbackTitle,
          isGenerated: false,
          warning: 'Monthly cost limit reached. Using fallback title generation.',
        } as TitleGenerationResponse,
        { 
          status: 200,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // Generate title using AI
    const titleResponse = await generateTitle(service, validatedData.prompt);
    
    // Track usage stats for authenticated user
    if (userId && titleResponse.isGenerated) {
      const usage = service.getUsageStats();
      if (usage.totalTokens > 0) {
        await userProfiles.updateUsageStats(
          userId,
          usage.totalTokens,
          usage.estimatedCost
        );
      }
    }
    
    return NextResponse.json(
      titleResponse,
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
    
  } catch (error) {
    console.error('Title generation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    // Return fallback on error
    const body = await request.json().catch(() => ({}));
    const fallbackTitle = generateFallbackTitle(body.prompt || 'Issue');
    
    return NextResponse.json(
      {
        title: fallbackTitle,
        isGenerated: false,
        error: 'Failed to generate AI title. Using fallback.',
      } as TitleGenerationResponse,
      { status: 200 }
    );
  }
}

async function generateTitle(
  service: AIEnhancementService,
  prompt: string
): Promise<TitleGenerationResponse> {
  try {
    const systemPrompt = `You are an expert at creating concise, descriptive GitHub issue titles. Your task is to analyze the user's description and generate a clear, action-oriented title.

Guidelines for good GitHub issue titles:
1. Start with an action verb (Add, Fix, Update, Implement, etc.)
2. Be specific but concise (5-50 characters ideal)
3. Focus on the main objective, not implementation details
4. Use present tense, imperative mood
5. Avoid technical jargon when possible

Examples:
- "Add dark mode toggle to settings"
- "Fix memory leak in image processing"
- "Update user authentication flow"
- "Implement search functionality"

Your response must be in JSON format with these keys:
- title: The main recommended title (string)
- alternatives: Array of 2-3 alternative titles (array of strings)

Make the title clear, actionable, and professional.`;

    const userPrompt = `Please create a GitHub issue title for this description:

${prompt}

Generate one primary title and 2-3 alternatives that capture the essence of this request.`;

    // Use the existing OpenAI client from the service
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await (service as any).openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent, focused titles
      max_tokens: 200, // Titles should be short
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    // Update usage stats manually
    if (completion.usage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).usage.totalTokens += completion.usage.total_tokens;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).usage.requestCount += 1;
      // gpt-4-turbo pricing: ~$0.01 per 1K input tokens, $0.03 per 1K output tokens
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).usage.estimatedCost += (completion.usage.total_tokens / 1000) * 0.02;
    }

    const parsed = JSON.parse(response);
    
    // Validate and clean the response
    const title = typeof parsed.title === 'string' ? parsed.title.trim() : generateFallbackTitle(prompt);
    const alternatives = Array.isArray(parsed.alternatives) 
      ? parsed.alternatives.filter((alt: unknown) => typeof alt === 'string').map((alt: string) => alt.trim())
      : [];

    // Ensure title is within reasonable length
    const finalTitle = title.length > 70 ? title.substring(0, 67) + '...' : title;

    return {
      title: finalTitle,
      alternatives,
      isGenerated: true,
    };
  } catch (error) {
    console.error('AI title generation failed:', error);
    return {
      title: generateFallbackTitle(prompt),
      isGenerated: false,
    };
  }
}

function generateFallbackTitle(prompt: string): string {
  // Clean and truncate the prompt to create a reasonable title
  const cleaned = prompt
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Try to extract the first sentence or meaningful phrase
  const sentences = cleaned.split(/[.!?]/);
  const firstSentence = sentences[0]?.trim();
  
  if (firstSentence && firstSentence.length <= 50) {
    return firstSentence;
  }
  
  // If first sentence is too long, take first 50 characters
  const truncated = cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
  
  return truncated || 'Generated Issue';
}