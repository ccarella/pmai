import { NextRequest } from 'next/server';
import { POST } from '@/app/api/enhance/route';
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

describe('API /api/enhance - User API Key Requirements', () => {
  const mockFormData = {
    type: 'feature' as const,
    title: 'Test Feature',
    description: 'Test description',
    priority: 'high' as const,
    assignee: 'test.user',
    context: {
      targetUsers: 'All users',
      businessValue: 'High value',
    },
    implementation: {
      requirements: 'Test requirements',
      approach: 'Test approach',
      dependencies: [],
      affectedFiles: [],
    },
    technical: {},
  };

  const mockEnhancements = {
    acceptanceCriteria: ['AC1', 'AC2'],
    edgeCases: ['EC1', 'EC2'],
    technicalConsiderations: ['TC1'],
    finalPrompt: 'Test prompt',
  };

  const mockUsageStats = {
    totalTokens: 100,
    requestCount: 5,
    estimatedCost: 0.5,
  };

  const createMockRequest = (body?: any, headers: Record<string, string> = {}) => {
    return {
      json: jest.fn().mockResolvedValue(body || { formData: mockFormData }),
      headers: {
        get: (key: string) => headers[key] || null,
      },
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.OPENAI_API_KEY;
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = '20';
    process.env.MAX_MONTHLY_COST_USD = '10';
    
    // Default mock implementations
    (checkRateLimit as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 19,
      resetAt: Date.now() + 3600000,
    });
    
    (getRateLimitHeaders as jest.Mock).mockReturnValue({
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': '19',
      'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString(),
    });
    
    (AIEnhancementService as jest.Mock).mockImplementation(() => ({
      enhanceIssue: jest.fn().mockResolvedValue(mockEnhancements),
      getUsageStats: jest.fn().mockReturnValue(mockUsageStats),
    }));

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
      expect(data.message).toBe('Please configure your OpenAI API key in Settings to use AI-enhanced features.');
      expect(data.requiresApiKey).toBe(true);
    });

    it('does not fall back to system API key even if available', async () => {
      // Set system API key
      process.env.OPENAI_API_KEY = 'system-api-key';
      
      // Mock authenticated user without API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.requiresApiKey).toBe(true);
      expect(AIEnhancementService).not.toHaveBeenCalled();
    });

    it('returns 403 for unauthenticated users', async () => {
      // Mock no session
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('OpenAI API key required');
      expect(data.requiresApiKey).toBe(true);
    });

    it('uses user-specific API key when available', async () => {
      // Mock authenticated user with API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('user-api-key');

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enhancements).toEqual(mockEnhancements);
      expect(data.usage).toEqual(mockUsageStats);
      expect(AIEnhancementService).toHaveBeenCalledWith('user-api-key');
    });

    it('updates user usage stats when enhancement succeeds', async () => {
      // Mock authenticated user with API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('user-api-key');

      const request = createMockRequest();
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(userProfiles.updateUsageStats).toHaveBeenCalledWith(
        'user123',
        100, // totalTokens
        0.5  // estimatedCost
      );
    });

    it('includes rate limit headers in 403 response', async () => {
      // Mock authenticated user without API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('20');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('19');
    });

    it('respects monthly cost limit for user-specific API keys', async () => {
      // Mock authenticated user with API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('user-api-key');
      
      // Mock usage stats exceeding limit
      (AIEnhancementService as jest.Mock).mockImplementation(() => ({
        getUsageStats: jest.fn().mockReturnValue({
          ...mockUsageStats,
          estimatedCost: 11, // Exceeds $10 limit
        }),
      }));

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Monthly cost limit exceeded');
    });

    it('handles user profile service errors gracefully', async () => {
      // Mock authenticated user
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      
      // Mock error getting API key
      (userProfiles.getOpenAIKey as jest.Mock).mockRejectedValue(
        new Error('Database connection error')
      );

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Enhancement generation failed. Please try again.');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('does not attempt to update usage stats for unauthenticated users', async () => {
      // Mock no session
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest();
      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(userProfiles.updateUsageStats).not.toHaveBeenCalled();
    });

    it('handles usage stats update errors gracefully', async () => {
      // Mock authenticated user with API key
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user123', name: 'Test User' },
      });
      (userProfiles.getOpenAIKey as jest.Mock).mockResolvedValue('user-api-key');
      
      // Mock error updating usage stats
      (userProfiles.updateUsageStats as jest.Mock).mockRejectedValue(
        new Error('Failed to update stats')
      );

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      // Should still return success even if stats update fails
      expect(response.status).toBe(200);
      expect(data.enhancements).toEqual(mockEnhancements);
    });
  });
});