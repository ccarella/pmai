import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate-title/route';
import { AIEnhancementService } from '@/lib/services/ai-enhancement';
import { checkRateLimit } from '@/lib/utils/rate-limit';

// Mock dependencies
jest.mock('@/lib/services/ai-enhancement');
jest.mock('@/lib/utils/rate-limit');

const mockAIEnhancementService = AIEnhancementService as jest.MockedClass<typeof AIEnhancementService>;
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;

// Helper to create mock requests
const createMockRequest = (body?: any, headers: Record<string, string> = {}) => {
  return {
    json: jest.fn().mockResolvedValue(body || {}),
    headers: {
      get: (key: string) => headers[key] || null,
    },
  } as unknown as NextRequest;
};

describe('API /api/generate-title', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = '50';
    process.env.MAX_MONTHLY_COST_USD = '10';
    
    // Default rate limit mock
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 49,
      resetAt: Date.now() + 3600000,
    });
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.RATE_LIMIT_REQUESTS_PER_HOUR;
    delete process.env.MAX_MONTHLY_COST_USD;
  });

  describe('POST', () => {
    describe('request validation', () => {
      it('should reject requests with missing prompt', async () => {
        const request = createMockRequest({});
        const response = await POST(request);
        
        expect(response.status).toBe(400);
        const responseData = await response.json();
        expect(responseData.error).toBe('Invalid request data');
        expect(responseData.details).toContainEqual(
          expect.objectContaining({
            message: 'Required',
          })
        );
      });

      it('should reject requests with short prompt', async () => {
        const request = createMockRequest({ prompt: 'too short' });
        const response = await POST(request);
        
        expect(response.status).toBe(400);
        const responseData = await response.json();
        expect(responseData.error).toBe('Invalid request data');
        expect(responseData.details).toContainEqual(
          expect.objectContaining({
            message: 'Prompt must be at least 10 characters long',
          })
        );
      });

      it('should accept valid prompts', async () => {
        // Mock the service to avoid OpenAI API calls
        delete process.env.OPENAI_API_KEY;

        const request = createMockRequest({ 
          prompt: 'This is a valid prompt for testing title generation' 
        });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.title).toBeDefined();
        expect(responseData.isGenerated).toBe(false); // Should be fallback
      });
    });

    describe('rate limiting', () => {
      it('should respect rate limits', async () => {
        mockCheckRateLimit.mockResolvedValue({
          allowed: false,
          remaining: 0,
          resetAt: Date.now() + 3600000,
        });

        const request = createMockRequest({ 
          prompt: 'This is a valid prompt for testing' 
        });
        const response = await POST(request);
        
        expect(response.status).toBe(429);
        const responseData = await response.json();
        expect(responseData.error).toContain('Rate limit exceeded');
      });

      it('should use configured rate limit', async () => {
        process.env.RATE_LIMIT_REQUESTS_PER_HOUR = '100';
        
        const request = createMockRequest({ 
          prompt: 'This is a valid prompt for testing' 
        });
        await POST(request);
        
        expect(mockCheckRateLimit).toHaveBeenCalledWith(request, 100);
      });
    });

    describe('AI service availability', () => {
      it('should return fallback title when no API key', async () => {
        delete process.env.OPENAI_API_KEY;
        
        const request = createMockRequest({ 
          prompt: 'This is a valid prompt for testing fallback behavior' 
        });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.title).toBeDefined();
        expect(responseData.isGenerated).toBe(false);
      });

      it('should handle cost limit exceeded', async () => {
        const mockService = {
          getUsageStats: jest.fn().mockReturnValue({
            totalTokens: 1000000,
            requestCount: 100,
            estimatedCost: 15.0 // Exceeds $10 limit
          })
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);

        const request = createMockRequest({ 
          prompt: 'This is a valid prompt for testing cost limits' 
        });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.title).toBeDefined();
        expect(responseData.isGenerated).toBe(false);
        expect(responseData.warning).toContain('Monthly cost limit reached');
      });
    });

    describe('AI title generation', () => {
      beforeEach(() => {
        const mockService = {
          openai: {
            chat: {
              completions: {
                create: jest.fn().mockResolvedValue({
                  choices: [{ 
                    message: { 
                      content: JSON.stringify({
                        title: 'AI Generated Title',
                        alternatives: ['Alternative 1', 'Alternative 2', 'Alternative 3']
                      })
                    }
                  }],
                  usage: { 
                    total_tokens: 150,
                    prompt_tokens: 100,
                    completion_tokens: 50
                  }
                })
              }
            }
          },
          getUsageStats: jest.fn().mockReturnValue({
            totalTokens: 150,
            requestCount: 1,
            estimatedCost: 0.003
          })
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);
      });

      it('should generate AI title successfully', async () => {
        const request = createMockRequest({ 
          prompt: 'As a user, I want to be able to upload files to the system so that I can share documents with my team' 
        });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.title).toBe('AI Generated Title');
        expect(responseData.alternatives).toEqual(['Alternative 1', 'Alternative 2', 'Alternative 3']);
        expect(responseData.isGenerated).toBe(true);
      });

      it('should handle AI service errors gracefully', async () => {
        const mockService = {
          openai: {
            chat: {
              completions: {
                create: jest.fn().mockRejectedValue(new Error('OpenAI API Error'))
              }
            }
          },
          getUsageStats: jest.fn().mockReturnValue({
            totalTokens: 0,
            requestCount: 0,
            estimatedCost: 0
          })
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);

        const request = createMockRequest({ 
          prompt: 'This prompt will cause an AI service error' 
        });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.title).toBeDefined();
        expect(responseData.isGenerated).toBe(false);
      });

      it('should handle malformed AI responses', async () => {
        const mockService = {
          openai: {
            chat: {
              completions: {
                create: jest.fn().mockResolvedValue({
                  choices: [{ 
                    message: { 
                      content: 'invalid json response'
                    }
                  }],
                  usage: { total_tokens: 50 }
                })
              }
            }
          },
          getUsageStats: jest.fn().mockReturnValue({
            totalTokens: 50,
            requestCount: 1,
            estimatedCost: 0.001
          })
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);

        const request = createMockRequest({ 
          prompt: 'This will result in malformed AI response' 
        });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.title).toBeDefined();
        expect(responseData.isGenerated).toBe(false);
      });

      it('should truncate long titles', async () => {
        const longTitle = 'This is an extremely long title that exceeds the seventy character limit and should be truncated';
        
        const mockService = {
          openai: {
            chat: {
              completions: {
                create: jest.fn().mockResolvedValue({
                  choices: [{ 
                    message: { 
                      content: JSON.stringify({
                        title: longTitle,
                        alternatives: []
                      })
                    }
                  }],
                  usage: { total_tokens: 100 }
                })
              }
            }
          },
          getUsageStats: jest.fn().mockReturnValue({
            totalTokens: 100,
            requestCount: 1,
            estimatedCost: 0.002
          })
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);

        const request = createMockRequest({ 
          prompt: 'Generate a very long title that needs truncation' 
        });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.title.length).toBeLessThanOrEqual(70);
        expect(responseData.title).toMatch(/\.\.\.$/); // Should end with ...
      });
    });

    describe('fallback title generation', () => {
      it('should generate reasonable fallback titles', async () => {
        delete process.env.OPENAI_API_KEY;
        
        const request = createMockRequest({ 
          prompt: 'Fix the bug in the authentication system where users cannot log in with special characters in their passwords' 
        });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.title).toBeDefined();
        expect(responseData.title.length).toBeGreaterThan(0);
        expect(responseData.title.length).toBeLessThanOrEqual(50);
        expect(responseData.isGenerated).toBe(false);
      });

      it('should handle short prompts for fallback', async () => {
        delete process.env.OPENAI_API_KEY;
        
        const request = createMockRequest({ 
          prompt: 'Short fix for something' // Make it long enough to pass validation
        });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        const responseData = await response.json();
        expect(responseData.title).toBe('Short fix for something');
        expect(responseData.isGenerated).toBe(false);
      });

      it('should handle empty prompt gracefully', async () => {
        const request = createMockRequest({ 
          prompt: '   ' // Only whitespace - too short
        });
        const response = await POST(request);
        
        expect(response.status).toBe(400); // Should fail validation first
      });
    });

    describe('response headers', () => {
      it('should include rate limit headers', async () => {
        const mockService = {
          openai: {
            chat: {
              completions: {
                create: jest.fn().mockResolvedValue({
                  choices: [{ message: { content: JSON.stringify({ title: 'Test' }) } }],
                  usage: { total_tokens: 50 }
                })
              }
            }
          },
          getUsageStats: jest.fn().mockReturnValue({
            totalTokens: 50,
            requestCount: 1,
            estimatedCost: 0.001
          })
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);

        const request = createMockRequest({ 
          prompt: 'Test prompt for header validation' 
        });
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
        expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
        expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
      });
    });
  });
});