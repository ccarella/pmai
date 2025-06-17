import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate-title/route';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { getServerSession } from 'next-auth';
import { userProfiles } from '@/lib/services/user-storage';
import { AIEnhancementService } from '@/lib/services/ai-enhancement';

// Mock dependencies
jest.mock('@/lib/utils/rate-limit');
jest.mock('next-auth');
jest.mock('@/lib/services/user-storage');
jest.mock('@/lib/services/ai-enhancement');
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Import getRateLimitHeaders to mock it
import { getRateLimitHeaders } from '@/lib/utils/rate-limit';

// Mock console.error to avoid noise in tests
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('API /api/generate-title - User API Key Requirements', () => {
  const createMockRequest = (body?: any, headers: Record<string, string> = {}) => {
    return {
      json: jest.fn().mockResolvedValue(body || { prompt: 'Create a feature to add dark mode' }),
      headers: {
        get: (key: string) => headers[key] || null,
      },
    } as unknown as NextRequest;
  };

  const mockTitleCompletion = {
    choices: [{
      message: {
        content: JSON.stringify({
          title: 'Add dark mode toggle to settings',
          alternatives: ['Implement dark theme', 'Add theme switcher'],
        }),
      },
    }],
    usage: {
      total_tokens: 50,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.OPENAI_API_KEY;
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = '50';
    process.env.MAX_MONTHLY_COST_USD = '10';
    
    // Default mock implementations
    (checkRateLimit as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 49,
      resetAt: Date.now() + 3600000,
    });
    
    (getRateLimitHeaders as jest.Mock).mockReturnValue({
      'X-RateLimit-Limit': '50',
      'X-RateLimit-Remaining': '49',
      'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString(),
    });
    
    // Mock userProfiles
    (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue(null);
    (userProfiles.updateUsageStats as jest.Mock).mockResolvedValue(undefined);
  });

  describe('User API Key Enforcement', () => {
    it('returns 403 error when no user API key is configured', async () => {
      // Mock authenticated user without API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('OpenAI API key required');
      expect(data.message).toBe('Please configure your OpenAI API key in Settings to use AI-powered title generation.');
      expect(data.requiresApiKey).toBe(true);
    });

    it('does not fall back to system API key', async () => {
      // Set system API key
      process.env.OPENAI_API_KEY = 'system-api-key';
      
      // Mock authenticated user without API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await POST(request);
      
      expect(response.status).toBe(403);
      expect(AIEnhancementService).not.toHaveBeenCalled();
    });

    it('returns 403 for unauthenticated users', async () => {
      // Mock no session
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.requiresApiKey).toBe(true);
    });

    it('uses user-specific API key when available', async () => {
      // Mock authenticated user with API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('user-api-key');

      // Mock AI service
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockTitleCompletion),
          },
        },
      };
      
      (AIEnhancementService as jest.Mock).mockImplementation(() => ({
        openai: mockOpenAI,
        usage: { totalTokens: 0, requestCount: 0, estimatedCost: 0 },
        getUsageStats: jest.fn().mockReturnValue({ 
          totalTokens: 50, 
          requestCount: 1, 
          estimatedCost: 0.001 
        }),
      }));

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Add dark mode toggle to settings');
      expect(data.isGenerated).toBe(true);
      expect(AIEnhancementService).toHaveBeenCalledWith('user-api-key');
    });

    it('validates prompt length', async () => {
      const request = createMockRequest({ prompt: 'short' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details[0].message).toContain('at least 10 characters');
    });

    it('includes rate limit headers in all responses', async () => {
      // Mock authenticated user without API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });

      const request = createMockRequest();
      const response = await POST(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('50');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('49');
    });

    it('updates user usage stats after successful generation', async () => {
      // Mock authenticated user with API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('user-api-key');

      // Mock AI service
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockTitleCompletion),
          },
        },
      };
      
      (AIEnhancementService as jest.Mock).mockImplementation(() => ({
        openai: mockOpenAI,
        usage: { totalTokens: 50, requestCount: 1, estimatedCost: 0.001 },
        getUsageStats: jest.fn().mockReturnValue({ 
          totalTokens: 50, 
          requestCount: 1, 
          estimatedCost: 0.001 
        }),
      }));

      const request = createMockRequest();
      await POST(request);

      expect(userProfiles.updateUsageStats).toHaveBeenCalledWith(
        'user123',
        50,     // totalTokens
        0.001   // estimatedCost
      );
    });

    it('handles rate limit exceeded', async () => {
      (checkRateLimit as jest.Mock).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 3600000,
      });

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit exceeded');
    });

    it('respects monthly cost limit', async () => {
      // Mock authenticated user with API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('user-api-key');
      
      // Mock usage exceeding limit
      (AIEnhancementService as jest.Mock).mockImplementation(() => ({
        getUsageStats: jest.fn().mockReturnValue({
          totalTokens: 1000000,
          requestCount: 100,
          estimatedCost: 11, // Exceeds $10 limit
        }),
      }));

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('OpenAI API key required');
      expect(data.message).toContain('Please configure your OpenAI API key');
    });

    it('handles AI service errors gracefully', async () => {
      // Mock authenticated user with API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('user-api-key');

      // Mock AI service error
      (AIEnhancementService as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid API key');
      });

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('OpenAI API key required');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});