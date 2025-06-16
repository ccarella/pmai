import { NextRequest } from 'next/server';
import { POST } from '@/app/api/create-issue/route';

// Mock modules first before any imports
jest.mock('@/lib/services/ai-enhancement');
jest.mock('@/lib/utils/rate-limit');

describe('/api/create-issue', () => {
  const originalEnv = process.env;
  let mockCheckRateLimit: jest.Mock;
  let mockGetRateLimitHeaders: jest.Mock;
  let AIEnhancementService: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    process.env = { ...originalEnv };
    
    // Setup rate limit mocks
    const rateLimitModule = jest.requireMock('@/lib/utils/rate-limit') as {
      checkRateLimit: jest.Mock;
      getRateLimitHeaders: jest.Mock;
    };
    mockCheckRateLimit = rateLimitModule.checkRateLimit;
    mockGetRateLimitHeaders = rateLimitModule.getRateLimitHeaders;
    
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 19,
      resetAt: Date.now() + 3600000,
    });
    
    mockGetRateLimitHeaders.mockReturnValue({
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': '19',
      'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString(),
    });
    
    // Setup AI service mock
    const aiModule = jest.requireMock('@/lib/services/ai-enhancement') as {
      AIEnhancementService: jest.Mock;
    };
    AIEnhancementService = aiModule.AIEnhancementService;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns enhanced issue with OpenAI when API key is present', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    const mockOpenAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            markdown: '# Enhanced Issue\n\nThis is an enhanced issue',
            claudePrompt: 'Enhanced Claude prompt',
            summary: {
              type: 'feature',
              priority: 'high',
              estimatedEffort: 'medium',
            },
          }),
        },
      }],
      usage: {
        total_tokens: 500,
      },
    };

    const mockService = {
      openai: {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockOpenAIResponse),
          },
        },
      },
      usage: {
        totalTokens: 0,
        requestCount: 0,
        estimatedCost: 0,
      },
      getUsageStats: jest.fn().mockReturnValue({
        totalTokens: 500,
        requestCount: 1,
        estimatedCost: 0.0225,
      }),
    };
    
    AIEnhancementService.mockImplementation(() => mockService);

    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Issue',
        prompt: 'Create a user authentication system',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('original', 'Create a user authentication system');
    expect(data).toHaveProperty('markdown');
    expect(data).toHaveProperty('claudePrompt');
    expect(data).toHaveProperty('summary');
    expect(data.summary).toEqual({
      type: 'feature',
      priority: 'high',
      estimatedEffort: 'medium',
    });
    expect(data).toHaveProperty('usage');
  });

  it('returns basic issue when no OpenAI API key is set', async () => {
    delete process.env.OPENAI_API_KEY;
    
    AIEnhancementService.mockImplementation(() => null);

    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Issue',
        prompt: 'Create a user authentication system',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('original', 'Create a user authentication system');
    expect(data.markdown).toContain('# Test Issue');
    expect(data.claudePrompt).toContain('Please implement: Test Issue');
    expect(data.summary).toEqual({
      type: 'feature',
      priority: 'medium',
      estimatedEffort: 'medium',
    });
  });

  it('handles missing prompt with 400 error', async () => {
    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Issue',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid request data');
    expect(data).toHaveProperty('details');
  });

  it('uses prompt excerpt as title when title is not provided', async () => {
    delete process.env.OPENAI_API_KEY;
    
    AIEnhancementService.mockImplementation(() => null);

    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'This is a very long prompt that should be truncated to create a title for the issue',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.markdown).toContain('# This is a very long prompt that should be truncated to creat');
  });

  it('validates title length', async () => {
    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'a'.repeat(100), // Too long
        prompt: 'Test prompt',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error', 'Invalid request data');
    expect(data.details[0].message).toContain('Title must be 70 characters or less');
  });

  it('respects rate limits', async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 3600000,
    });

    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1',
      },
      body: JSON.stringify({
        title: 'Test Issue',
        prompt: 'Test prompt',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toHaveProperty('error', 'Rate limit exceeded. Please try again later.');
    expect(data).toHaveProperty('resetAt');
  });

  it('respects monthly cost limits', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.MAX_MONTHLY_COST_USD = '5';

    const mockService = {
      getUsageStats: jest.fn().mockReturnValue({
        totalTokens: 200000,
        requestCount: 100,
        estimatedCost: 10, // Exceeds limit
      }),
    };
    
    AIEnhancementService.mockImplementation(() => mockService);

    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Issue',
        prompt: 'Test prompt',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Monthly cost limit exceeded');
    expect(data.usage.estimatedCost).toBe(10);
  });

  it('handles OpenAI API errors gracefully', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    const mockService = {
      openai: {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API Error')),
          },
        },
      },
      usage: {
        totalTokens: 0,
        requestCount: 0,
        estimatedCost: 0,
      },
      getUsageStats: jest.fn().mockReturnValue({
        totalTokens: 0,
        requestCount: 0,
        estimatedCost: 0,
      }),
    };
    
    AIEnhancementService.mockImplementation(() => mockService);

    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Issue',
        prompt: 'Create a user authentication system',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should fall back to basic issue generation
    expect(data).toHaveProperty('original', 'Create a user authentication system');
    expect(data.markdown).toContain('# Test Issue');
    expect(data.claudePrompt).toContain('Please implement: Test Issue');
  });

  it('handles JSON parse errors from OpenAI', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    const mockOpenAIResponse = {
      choices: [{
        message: {
          content: 'Invalid JSON response',
        },
      }],
      usage: {
        total_tokens: 500,
      },
    };

    const mockService = {
      openai: {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockOpenAIResponse),
          },
        },
      },
      usage: {
        totalTokens: 0,
        requestCount: 0,
        estimatedCost: 0,
      },
      getUsageStats: jest.fn().mockReturnValue({
        totalTokens: 500,
        requestCount: 1,
        estimatedCost: 0.0225,
      }),
    };
    
    AIEnhancementService.mockImplementation(() => mockService);

    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Issue',
        prompt: 'Create a user authentication system',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should fall back to basic issue generation
    expect(data).toHaveProperty('original', 'Create a user authentication system');
    expect(data.markdown).toContain('# Test Issue');
    expect(data.claudePrompt).toContain('Please implement: Test Issue');
  });
});