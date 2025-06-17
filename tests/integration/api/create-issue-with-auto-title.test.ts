import { NextRequest } from 'next/server';
import { POST } from '@/app/api/create-issue/route';
import { AIEnhancementService } from '@/lib/services/ai-enhancement';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { generateAutoTitle } from '@/lib/services/auto-title-generation';

// Mock dependencies
jest.mock('@/lib/services/ai-enhancement');
jest.mock('@/lib/utils/rate-limit');
jest.mock('@/lib/services/auto-title-generation');

const mockAIEnhancementService = AIEnhancementService as jest.MockedClass<typeof AIEnhancementService>;
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;
const mockGenerateAutoTitle = generateAutoTitle as jest.MockedFunction<typeof generateAutoTitle>;

// Helper to create mock requests
const createMockRequest = (body?: any) => {
  return {
    json: jest.fn().mockResolvedValue(body || {}),
  } as unknown as NextRequest;
};

describe('Create Issue API with Auto Title Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = '20';
    process.env.MAX_MONTHLY_COST_USD = '10';
    
    // Default rate limit mock
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 19,
      resetAt: Date.now() + 3600000,
    });

    // Default auto title generation mock
    mockGenerateAutoTitle.mockResolvedValue({
      title: 'Auto Generated Title',
      isGenerated: true,
      alternatives: ['Alternative 1', 'Alternative 2'],
    });
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.RATE_LIMIT_REQUESTS_PER_HOUR;
    delete process.env.MAX_MONTHLY_COST_USD;
  });

  describe('automatic title generation integration', () => {
    it('should generate title automatically when not provided', async () => {
      const mockService = {
        getUsageStats: jest.fn().mockReturnValue({
          totalTokens: 150,
          requestCount: 1,
          estimatedCost: 0.003,
        }),
      };

      mockAIEnhancementService.mockImplementation(() => mockService as any);

      const request = createMockRequest({
        prompt: 'As a user, I want to upload files to share documents with my team',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      
      // Should call auto title generation
      expect(mockGenerateAutoTitle).toHaveBeenCalledWith(
        'As a user, I want to upload files to share documents with my team',
        undefined
      );

      const responseData = await response.json();
      expect(responseData.generatedTitle).toBe('Auto Generated Title');
      expect(responseData.titleAlternatives).toEqual(['Alternative 1', 'Alternative 2']);
    });

    it('should generate title when provided title is generic', async () => {
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'Implement file upload feature',
        isGenerated: true,
        alternatives: ['Add file upload functionality', 'Create document upload system'],
      });

      const mockService = {
        getUsageStats: jest.fn().mockReturnValue({
          totalTokens: 200,
          requestCount: 1,
          estimatedCost: 0.004,
        }),
      };

      mockAIEnhancementService.mockImplementation(() => mockService as any);

      const request = createMockRequest({
        title: 'New Feature', // Generic title
        prompt: 'Implement file upload functionality for sharing documents',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      
      expect(mockGenerateAutoTitle).toHaveBeenCalledWith(
        'Implement file upload functionality for sharing documents',
        'New Feature'
      );

      const responseData = await response.json();
      expect(responseData.generatedTitle).toBe('Implement file upload feature');
      expect(responseData.titleAlternatives).toEqual(['Add file upload functionality', 'Create document upload system']);
    });

    it('should use provided title when meaningful', async () => {
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'Fix authentication bug',
        isGenerated: false,
      });

      const mockService = {
        getUsageStats: jest.fn().mockReturnValue({
          totalTokens: 100,
          requestCount: 1,
          estimatedCost: 0.002,
        }),
      };

      mockAIEnhancementService.mockImplementation(() => mockService as any);

      const request = createMockRequest({
        title: 'Fix authentication bug',
        prompt: 'Users cannot log in with special characters in passwords',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.generatedTitle).toBeUndefined(); // Not generated
      expect(responseData.titleAlternatives).toBeUndefined();
    });

    it('should work without AI service available', async () => {
      delete process.env.OPENAI_API_KEY;

      mockGenerateAutoTitle.mockResolvedValue({
        title: 'Fallback title from content processing',
        isGenerated: false,
      });

      const request = createMockRequest({
        prompt: 'Update the user interface to be more responsive and accessible',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      
      expect(mockGenerateAutoTitle).toHaveBeenCalledWith(
        'Update the user interface to be more responsive and accessible',
        undefined
      );

      const responseData = await response.json();
      expect(responseData.generatedTitle).toBeUndefined(); // Fallback, not AI generated
    });

    it('should handle auto title generation errors', async () => {
      mockGenerateAutoTitle.mockRejectedValue(new Error('Title generation failed'));

      const request = createMockRequest({
        prompt: 'This should cause a title generation error',
      });

      const response = await POST(request);

      // The API should handle this error internally
      expect(response.status).toBe(500);
    });
  });

  describe('enhanced issue generation with auto titles', () => {
    beforeEach(() => {
      const mockService = {
        getUsageStats: jest.fn().mockReturnValue({
          totalTokens: 500,
          requestCount: 2,
          estimatedCost: 0.01,
        }),
        openai: {
          chat: {
            completions: {
              create: jest.fn().mockResolvedValue({
                choices: [{ 
                  message: { 
                    content: JSON.stringify({
                      markdown: '# Generated Issue\n\nThis is enhanced content',
                      claudePrompt: 'Please implement this feature',
                      summary: {
                        type: 'feature',
                        priority: 'medium',
                        estimatedEffort: 'medium',
                      }
                    })
                  }
                }],
                usage: { total_tokens: 300 }
              })
            }
          }
        },
      };

      mockAIEnhancementService.mockImplementation(() => mockService as any);
    });

    it('should generate enhanced issue with auto title', async () => {
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'Implement advanced search functionality',
        isGenerated: true,
        alternatives: ['Add search feature', 'Create search system'],
      });

      const request = createMockRequest({
        prompt: 'Users need to be able to search through large datasets efficiently',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.markdown).toContain('# Implement advanced search functionality');
      expect(responseData.claudePrompt).toContain('Please implement this feature');
      expect(responseData.generatedTitle).toBe('Implement advanced search functionality');
      expect(responseData.titleAlternatives).toEqual(['Add search feature', 'Create search system']);
      expect(responseData.usage).toBeDefined();
    });

    it('should handle cost limits during enhanced generation', async () => {
      const expensiveService = {
        getUsageStats: jest.fn().mockReturnValue({
          totalTokens: 1000000,
          requestCount: 1000,
          estimatedCost: 15.0, // Exceeds $10 limit
        }),
      };

      mockAIEnhancementService.mockImplementation(() => expensiveService as any);

      const request = createMockRequest({
        prompt: 'This should hit the cost limit',
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
      const responseData = await response.json();
      expect(responseData.error).toContain('Monthly cost limit exceeded');
    });
  });

  describe('validation with auto titles', () => {
    it('should validate prompt is required', async () => {
      const request = createMockRequest({
        title: 'Some title',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('Invalid request data');
      expect(mockGenerateAutoTitle).not.toHaveBeenCalled();
    });

    it('should handle empty prompt', async () => {
      const request = createMockRequest({
        prompt: '',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(mockGenerateAutoTitle).not.toHaveBeenCalled();
    });

    it('should validate title length when provided', async () => {
      const longTitle = 'This is an extremely long title that definitely exceeds the seventy character limit set for issue titles';
      
      const request = createMockRequest({
        title: longTitle,
        prompt: 'Valid prompt content',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('Invalid request data');
      expect(responseData.details[0].message).toBe('Title must be 70 characters or less');
    });
  });

  describe('rate limiting with auto titles', () => {
    it('should respect rate limits', async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 3600000,
      });

      const request = createMockRequest({
        prompt: 'This should be rate limited',
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
      const responseData = await response.json();
      expect(responseData.error).toContain('Rate limit exceeded');
      expect(mockGenerateAutoTitle).not.toHaveBeenCalled();
    });
  });

  describe('response format', () => {
    it('should include title generation info in response', async () => {
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'Test Generated Title',
        isGenerated: true,
        alternatives: ['Alt A', 'Alt B'],
      });

      const mockService = {
        getUsageStats: jest.fn().mockReturnValue({
          totalTokens: 250,
          requestCount: 1,
          estimatedCost: 0.005,
        }),
      };

      mockAIEnhancementService.mockImplementation(() => mockService as any);

      const request = createMockRequest({
        prompt: 'Test prompt for response format validation',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      
      expect(responseData).toHaveProperty('original', 'Test prompt for response format validation');
      expect(responseData).toHaveProperty('generatedTitle', 'Test Generated Title');
      expect(responseData).toHaveProperty('titleAlternatives', ['Alt A', 'Alt B']);
      expect(responseData).toHaveProperty('usage');
    });

    it('should not include title generation info when using provided title', async () => {
      mockGenerateAutoTitle.mockResolvedValue({
        title: 'User Provided Title',
        isGenerated: false,
      });

      const mockService = {
        getUsageStats: jest.fn().mockReturnValue({
          totalTokens: 100,
          requestCount: 1,
          estimatedCost: 0.002,
        }),
      };

      mockAIEnhancementService.mockImplementation(() => mockService as any);

      const request = createMockRequest({
        title: 'User Provided Title',
        prompt: 'Description of the issue',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      
      expect(responseData.generatedTitle).toBeUndefined();
      expect(responseData.titleAlternatives).toBeUndefined();
    });
  });
});