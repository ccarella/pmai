import { NextRequest } from 'next/server';
import { POST } from '@/app/api/create-issue/route';

// Mock the AI service
jest.mock('@/lib/services/ai-enhancement', () => ({
  AIEnhancementService: jest.fn().mockImplementation(() => ({
    getUsageStats: jest.fn().mockReturnValue({
      totalTokens: 0,
      requestCount: 0,
      estimatedCost: 0,
    }),
  })),
}));

// Mock rate limiting
jest.mock('@/lib/utils/rate-limit', () => ({
  checkRateLimit: jest.fn().mockResolvedValue({
    allowed: true,
    remaining: 10,
    resetAt: Date.now() + 3600000,
  }),
  getRateLimitHeaders: jest.fn().mockReturnValue({}),
}));

describe('/api/create-issue', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.OPENAI_API_KEY;
  });

  it('creates basic issue when no AI service available', async () => {
    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Fix login bug',
        prompt: 'As a user, I want to be able to login so that I can access my account',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('markdown');
    expect(data).toHaveProperty('claudePrompt');
    expect(data).toHaveProperty('summary');
    expect(data.markdown).toContain('Fix login bug');
    expect(data.claudePrompt).toContain('Fix login bug');
    expect(data.summary).toEqual({
      type: 'feature',
      priority: 'medium',
      estimatedEffort: 'medium',
    });
  });

  it('validates request data', async () => {
    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Fix login bug',
        // Missing prompt
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid request data');
  });

  it('handles empty title by using prompt fallback', async () => {
    const longPrompt = 'As a premium user, I want to be able to export my data to CSV format so that I can analyze it in external tools and create reports';
    
    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      body: JSON.stringify({
        title: '',
        prompt: longPrompt,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.markdown).toContain('As a premium user, I want to be able to export my data to C');
    expect(data.claudePrompt).toContain(longPrompt);
  });

  it('handles malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
  });

  it('respects rate limiting', async () => {
    // Mock rate limit exceeded
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { checkRateLimit } = require('@/lib/utils/rate-limit');
    checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 3600000,
    });

    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Fix login bug',
        prompt: 'As a user, I want to login',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Rate limit exceeded');
  });

  it('generates proper markdown structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Add user authentication',
        prompt: 'As a new user, I want to create an account so that I can save my preferences',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Check markdown structure
    expect(data.markdown).toContain('# Add user authentication');
    expect(data.markdown).toContain('## Description');
    expect(data.markdown).toContain('## Acceptance Criteria');
    expect(data.markdown).toContain('## Technical Considerations');
    expect(data.markdown).toContain('## Implementation Notes');
    
    // Check Claude prompt structure
    expect(data.claudePrompt).toContain('Please implement: Add user authentication');
    expect(data.claudePrompt).toContain('Requirements:');
    expect(data.claudePrompt).toContain('As a new user, I want to create an account');
  });

  it('validates title length in request body', async () => {
    const longTitle = 'A'.repeat(71); // Too long
    
    const request = new NextRequest('http://localhost:3000/api/create-issue', {
      method: 'POST',
      body: JSON.stringify({
        title: longTitle,
        prompt: 'Valid prompt content',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid request data');
  });
});