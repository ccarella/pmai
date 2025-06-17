import { generateAutoTitle } from '@/lib/services/auto-title-generation';
import { AIEnhancementService } from '@/lib/services/ai-enhancement';

// Mock the AI enhancement service
jest.mock('@/lib/services/ai-enhancement');

const mockAIEnhancementService = AIEnhancementService as jest.MockedClass<typeof AIEnhancementService>;

describe('Auto Title Generation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('generateAutoTitle', () => {
    describe('when meaningful title is provided', () => {
      it('should return provided title when it is meaningful', async () => {
        const result = await generateAutoTitle(
          'This is the detailed description of the issue',
          'Implement user authentication'
        );

        expect(result.title).toBe('Implement user authentication');
        expect(result.isGenerated).toBe(false);
        expect(result.alternatives).toBeUndefined();
      });

      it('should trim provided title', async () => {
        const result = await generateAutoTitle(
          'Description',
          '  Fix login bug  '
        );

        expect(result.title).toBe('Fix login bug');
        expect(result.isGenerated).toBe(false);
      });

      it('should reject very short titles', async () => {
        const result = await generateAutoTitle(
          'This is a detailed description',
          'Fix'  // Too short - should fall back to content processing
        );

        // Without AI available, should fall back to content processing
        expect(result.title).toBe('This is a detailed description');
        expect(result.isGenerated).toBe(false);
      });
    });

    describe('when generic title is provided', () => {
      const genericTitles = [
        'Generated Issue',
        'new issue',
        'Issue',
        'feature request',
        'bug report',
        'enhancement'
      ];

      genericTitles.forEach(genericTitle => {
        it(`should reject generic title: "${genericTitle}"`, async () => {
          const result = await generateAutoTitle(
            'This is a meaningful description of the issue that needs to be addressed',
            genericTitle
          );

          // Should fall back to text processing since no AI key
          expect(result.title).not.toBe(genericTitle);
          expect(result.isGenerated).toBe(false);
        });
      });
    });

    describe('AI title generation', () => {
      beforeEach(() => {
        process.env.OPENAI_API_KEY = 'test-api-key';
      });

      it('should generate title using AI when available', async () => {
        const mockService = {
          openai: {
            chat: {
              completions: {
                create: jest.fn().mockResolvedValue({
                  choices: [{ 
                    message: { 
                      content: JSON.stringify({
                        title: 'Implement file upload feature',
                        alternatives: ['Add file upload functionality', 'Create document upload system']
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
          usage: {
            totalTokens: 0,
            requestCount: 0,
            estimatedCost: 0
          }
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);

        const result = await generateAutoTitle(
          'As a user, I want to upload files to share documents with my team',
          ''
        );

        expect(result.title).toBe('Implement file upload feature');
        expect(result.isGenerated).toBe(true);
        expect(result.alternatives).toEqual(['Add file upload functionality', 'Create document upload system']);
      });

      it('should handle AI errors gracefully', async () => {
        const mockService = {
          openai: {
            chat: {
              completions: {
                create: jest.fn().mockRejectedValue(new Error('AI API Error'))
              }
            }
          }
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);

        const result = await generateAutoTitle(
          'Fix the authentication bug where users cannot login',
          ''
        );

        // Should fall back to text processing (truncated to 50 chars)
        expect(result.title).toBe('Fix the authentication bug where users cannot l...');
        expect(result.isGenerated).toBe(false);
      });

      it('should handle malformed AI responses', async () => {
        const mockService = {
          openai: {
            chat: {
              completions: {
                create: jest.fn().mockResolvedValue({
                  choices: [{ 
                    message: { 
                      content: 'invalid json'
                    }
                  }],
                  usage: { total_tokens: 50 }
                })
              }
            }
          },
          usage: {
            totalTokens: 0,
            requestCount: 0,
            estimatedCost: 0
          }
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);

        const result = await generateAutoTitle(
          'Update the user interface to be more responsive',
          ''
        );

        // Should fall back to text processing
        expect(result.title).toBe('Update the user interface to be more responsive');
        expect(result.isGenerated).toBe(false);
      });

      it('should truncate very long AI-generated titles', async () => {
        const veryLongTitle = 'This is an extremely long title that definitely exceeds the seventy character limit and should be truncated';
        
        const mockService = {
          openai: {
            chat: {
              completions: {
                create: jest.fn().mockResolvedValue({
                  choices: [{ 
                    message: { 
                      content: JSON.stringify({
                        title: veryLongTitle,
                        alternatives: []
                      })
                    }
                  }],
                  usage: { total_tokens: 100 }
                })
              }
            }
          },
          usage: {
            totalTokens: 0,
            requestCount: 0,
            estimatedCost: 0
          }
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);

        const result = await generateAutoTitle(
          'This should generate a very long title',
          ''
        );

        expect(result.title.length).toBeLessThanOrEqual(70);
        expect(result.title).toMatch(/\.\.\.$/);
        expect(result.isGenerated).toBe(true);
      });

      it('should update usage stats after AI call', async () => {
        const mockUsage = {
          totalTokens: 0,
          requestCount: 0,
          estimatedCost: 0
        };

        const mockService = {
          openai: {
            chat: {
              completions: {
                create: jest.fn().mockResolvedValue({
                  choices: [{ 
                    message: { 
                      content: JSON.stringify({
                        title: 'Test Title',
                        alternatives: []
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
          usage: mockUsage
        };

        mockAIEnhancementService.mockImplementation(() => mockService as any);

        await generateAutoTitle(
          'Generate title and update usage stats',
          ''
        );

        // Verify usage stats were updated
        expect(mockUsage.totalTokens).toBe(150);
        expect(mockUsage.requestCount).toBe(1);
        expect(mockUsage.estimatedCost).toBeGreaterThan(0);
      });
    });

    describe('fallback title generation', () => {
      it('should generate reasonable fallback from full sentences', async () => {
        const result = await generateAutoTitle(
          'Fix the memory leak in the image processing module. This is causing the application to crash after processing multiple files.',
          ''
        );

        // The cleaned content (special chars removed): "Fix the memory leak in the image processing module  This is causing..."
        // First sentence split would be: "Fix the memory leak in the image processing module  " but it's >50 chars, so truncated
        expect(result.title).toBe('Fix the memory leak in the image processing mod...');
        expect(result.isGenerated).toBe(false);
      });

      it('should handle content without sentences', async () => {
        const result = await generateAutoTitle(
          'image upload bug memory leak performance issue',
          ''
        );

        expect(result.title).toBe('image upload bug memory leak performance issue');
        expect(result.isGenerated).toBe(false);
      });

      it('should truncate long content to 50 characters', async () => {
        const longContent = 'This is a very long description that should be truncated to fifty characters maximum for the fallback title';
        
        const result = await generateAutoTitle(longContent, '');

        expect(result.title.length).toBeLessThanOrEqual(50);
        expect(result.title).toMatch(/\.\.\.$/);
        expect(result.isGenerated).toBe(false);
      });

      it('should clean special characters from content', async () => {
        const result = await generateAutoTitle(
          'Fix @#$%^& the authentication !@#$ system',
          ''
        );

        // Special characters replaced with spaces, then normalized
        expect(result.title).toBe('Fix the authentication system');
        expect(result.isGenerated).toBe(false);
      });

      it('should handle empty content gracefully', async () => {
        const result = await generateAutoTitle('', '');

        expect(result.title).toBe('Generated Issue');
        expect(result.isGenerated).toBe(false);
      });

      it('should normalize whitespace', async () => {
        const result = await generateAutoTitle(
          'Fix    the    authentication     system    bug',
          ''
        );

        expect(result.title).toBe('Fix the authentication system bug');
        expect(result.isGenerated).toBe(false);
      });
    });

    describe('title validation', () => {
      it('should identify generic titles correctly', async () => {
        const genericInputs = [
          'generated issue',
          'GENERATED ISSUE',
          'Generated Issue',
          '  new issue  ',
          'issue',
          'feature request something', // starts with generic
          'enhancement',
          'bug report'
        ];

        for (const input of genericInputs) {
          const result = await generateAutoTitle(
            'This is a detailed description',
            input
          );
          
          // Should not use the generic title
          expect(result.title).not.toBe(input.trim());
        }
      });

      it('should accept non-generic titles', async () => {
        const validTitles = [
          'Implement user authentication',
          'Fix login bug',
          'Add dark mode toggle',
          'Update documentation',
          'Refactor API endpoints'
        ];

        for (const title of validTitles) {
          const result = await generateAutoTitle(
            'This is a detailed description',
            title
          );
          
          expect(result.title).toBe(title);
          expect(result.isGenerated).toBe(false);
        }
      });
    });
  });
});