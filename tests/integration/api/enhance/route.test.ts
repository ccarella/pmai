import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/enhance/route';
import { AIEnhancementService } from '@/lib/services/ai-enhancement';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { getDefaultEnhancements } from '@/lib/utils/default-enhancements';

// Mock dependencies
jest.mock('@/lib/services/ai-enhancement');
jest.mock('@/lib/utils/rate-limit');
jest.mock('@/lib/utils/default-enhancements');

// Import getRateLimitHeaders to mock it
import { getRateLimitHeaders } from '@/lib/utils/rate-limit';

// Mock console.error to avoid noise in tests
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('API /api/enhance', () => {
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
    },
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
    delete process.env.RATE_LIMIT_REQUESTS_PER_HOUR;
    delete process.env.MAX_MONTHLY_COST_USD;
    
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
    
    (getDefaultEnhancements as jest.Mock).mockReturnValue(mockEnhancements);
    
    (AIEnhancementService as jest.Mock).mockImplementation(() => ({
      enhanceIssue: jest.fn().mockResolvedValue(mockEnhancements),
      getUsageStats: jest.fn().mockReturnValue(mockUsageStats),
    }));
  });

  describe('POST /api/enhance', () => {
    it('returns rate limit error when limit exceeded', async () => {
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
      expect(data.resetAt).toBeDefined();
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('returns validation error for invalid request data', async () => {
      const invalidRequests = [
        { formData: {} }, // Missing required fields
        { formData: { type: 'feature' } }, // Missing title
        { formData: { type: 'feature', title: 'Test' } }, // Missing description
        { formData: { type: 'feature', title: 'Test', description: 'Desc' } }, // Missing context
        { formData: { type: 'feature', title: 'Test', description: 'Desc', context: {} } }, // Missing implementation
        {}, // No formData
      ];

      for (const invalidBody of invalidRequests) {
        const request = createMockRequest(invalidBody);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid request data');
      }
    });

    it('returns default enhancements when no API key configured', async () => {
      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enhancements).toEqual(mockEnhancements);
      expect(data.usage).toEqual({
        totalTokens: 0,
        requestCount: 0,
        estimatedCost: 0,
      });
      expect(getDefaultEnhancements).toHaveBeenCalledWith('feature');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('19');
    });

    it('uses AI service when API key is configured', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      
      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.enhancements).toEqual(mockEnhancements);
      expect(data.usage).toEqual(mockUsageStats);
      expect(AIEnhancementService).toHaveBeenCalledWith('test-api-key');
    });

    it('returns cost limit error when monthly limit exceeded', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      process.env.MAX_MONTHLY_COST_USD = '5';
      
      (AIEnhancementService as jest.Mock).mockImplementation(() => ({
        getUsageStats: jest.fn().mockReturnValue({
          ...mockUsageStats,
          estimatedCost: 5.5,
        }),
      }));

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Monthly cost limit exceeded');
      expect(data.usage.estimatedCost).toBe(5.5);
    });

    it('handles custom rate limit from environment', async () => {
      process.env.RATE_LIMIT_REQUESTS_PER_HOUR = '50';
      
      const request = createMockRequest();
      await POST(request);

      expect(checkRateLimit).toHaveBeenCalledWith(request, 50);
    });

    it('handles AI service errors gracefully', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      
      (AIEnhancementService as jest.Mock).mockImplementation(() => ({
        enhanceIssue: jest.fn().mockRejectedValue(new Error('AI service error')),
        getUsageStats: jest.fn().mockReturnValue(mockUsageStats),
      }));

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Enhancement generation failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('API Error:', expect.any(Error));
    });

    it('handles API key errors specifically', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      
      (AIEnhancementService as jest.Mock).mockImplementation(() => ({
        enhanceIssue: jest.fn().mockRejectedValue(new Error('Invalid API key provided')),
        getUsageStats: jest.fn().mockReturnValue(mockUsageStats),
      }));

      const request = createMockRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Invalid API key provided');
    });

    it('uses singleton pattern for AI service', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      
      // Make multiple requests
      await POST(createMockRequest());
      await POST(createMockRequest());
      await POST(createMockRequest());

      // AI service should only be instantiated once
      expect(AIEnhancementService).toHaveBeenCalledTimes(1);
    });

    it('handles all issue types correctly', async () => {
      const issueTypes = ['feature', 'bug', 'epic', 'technical-debt'] as const;
      
      for (const type of issueTypes) {
        const formData = { ...mockFormData, type };
        const request = createMockRequest({ formData });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(getDefaultEnhancements).toHaveBeenCalledWith(type);
      }
    });
  });

  describe('GET /api/enhance', () => {
    it('returns rate limit and usage status', async () => {
      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rateLimit).toEqual({
        limit: 20,
        remaining: 19,
        resetAt: expect.any(String),
      });
      expect(data.usage).toEqual({
        totalTokens: 0,
        requestCount: 0,
        estimatedCost: 0,
        maxMonthlyCost: 10,
        remainingBudget: 10,
      });
    });

    it('includes AI service usage when available', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      
      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(data.usage).toEqual({
        ...mockUsageStats,
        maxMonthlyCost: 10,
        remainingBudget: 9.5,
      });
    });

    it('uses custom limits from environment', async () => {
      process.env.RATE_LIMIT_REQUESTS_PER_HOUR = '100';
      process.env.MAX_MONTHLY_COST_USD = '50';
      
      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(data.rateLimit.limit).toBe(100);
      expect(data.usage.maxMonthlyCost).toBe(50);
      expect(checkRateLimit).toHaveBeenCalledWith(expect.any(Object), 100);
    });

    it('handles zero remaining budget correctly', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      process.env.MAX_MONTHLY_COST_USD = '5';
      
      (AIEnhancementService as jest.Mock).mockImplementation(() => ({
        getUsageStats: jest.fn().mockReturnValue({
          ...mockUsageStats,
          estimatedCost: 6,
        }),
      }));

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(data.usage.remainingBudget).toBe(-1);
    });

    it('includes rate limit headers in response', async () => {
      const response = await GET(createMockRequest());

      expect(response.headers.get('X-RateLimit-Limit')).toBe('20');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('19');
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('handles JSON parsing errors', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: { get: jest.fn() },
      } as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Enhancement generation failed');
    });

    it('handles missing environment variables gracefully', async () => {
      // All env vars are undefined
      const request = createMockRequest();
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(checkRateLimit).toHaveBeenCalledWith(request, 20); // Default value
    });

    it('validates all required fields in formData', async () => {
      const requiredFields = ['type', 'title', 'description', 'context', 'implementation'];
      
      for (const field of requiredFields) {
        const incompleteData = { ...mockFormData };
        delete (incompleteData as any)[field];
        
        const request = createMockRequest({ formData: incompleteData });
        const response = await POST(request);
        
        expect(response.status).toBe(400);
      }
    });
  });
});