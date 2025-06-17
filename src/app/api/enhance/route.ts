import { NextRequest, NextResponse } from 'next/server';
import { AIEnhancementService } from '@/lib/services/ai-enhancement';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/utils/rate-limit';
import { IssueFormData } from '@/lib/types/issue';
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

// Validate form data
function validateFormData(data: unknown): data is { formData: IssueFormData } {
  const obj = data as Record<string, unknown>;
  return Boolean(
    obj &&
    obj.formData &&
    typeof obj.formData === 'object' &&
    (obj.formData as IssueFormData).type &&
    (obj.formData as IssueFormData).title &&
    (obj.formData as IssueFormData).description &&
    (obj.formData as IssueFormData).context &&
    (obj.formData as IssueFormData).implementation
  );
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

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

    // Parse request body
    const body = await request.json();
    
    // Validate request data
    if (!validateFormData(body)) {
      return NextResponse.json(
        { error: 'Invalid request data. Missing required fields.' },
        { status: 400 }
      );
    }

    const { formData } = body;

    // Get AI service with user-specific API key
    const service = await getAIService(userId);
    
    // If no service available (no API key), return error
    if (!service) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key required',
          message: 'Please configure your OpenAI API key in Settings to use AI-enhanced features.',
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
      return NextResponse.json(
        { 
          error: `Monthly cost limit exceeded. Current cost: $${usage.estimatedCost.toFixed(2)}`,
          usage,
        },
        { status: 429 }
      );
    }

    // Generate enhancements
    const enhancements = await service.enhanceIssue(formData);
    
    // Get updated usage stats
    const updatedUsage = service.getUsageStats();
    
    // Track usage stats for authenticated user
    if (userId && updatedUsage.totalTokens > 0) {
      await userProfiles.updateUsageStats(
        userId,
        updatedUsage.totalTokens,
        updatedUsage.estimatedCost
      );
    }

    // Return success response with rate limit headers
    return NextResponse.json(
      {
        enhancements,
        usage: updatedUsage,
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimit),
      }
    );
    
  } catch (error) {
    console.error('API Error:', error);
    
    // Check if it's a specific error type
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }
    
    // Generic error response
    return NextResponse.json(
      { error: 'Enhancement generation failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for checking rate limit status
export async function GET(request: NextRequest) {
  const rateLimitRequests = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '20');
  const rateLimit = await checkRateLimit(request, rateLimitRequests);
  
  // Get user session
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  // Get user's usage stats
  let usage = { totalTokens: 0, requestCount: 0, estimatedCost: 0 };
  if (userId) {
    const profile = await userProfiles.get(userId);
    if (profile?.usageStats) {
      usage = {
        totalTokens: profile.usageStats.totalTokens,
        requestCount: 0, // Not tracked at user level currently
        estimatedCost: profile.usageStats.totalCost,
      };
    }
  }
  
  const maxMonthlyCost = parseFloat(process.env.MAX_MONTHLY_COST_USD || '10');
  
  return NextResponse.json(
    {
      rateLimit: {
        limit: rateLimitRequests,
        remaining: rateLimit.remaining,
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
      usage: {
        ...usage,
        maxMonthlyCost,
        remainingBudget: Math.max(0, maxMonthlyCost - usage.estimatedCost),
      },
    },
    {
      headers: getRateLimitHeaders(rateLimit),
    }
  );
}