import { AIEnhancementService } from '@/lib/services/ai-enhancement';
import { IssueFormData } from '@/lib/types/issue';
import OpenAI from 'openai';
import { ChatCompletion } from 'openai/resources/chat/completions';

// Mock OpenAI
jest.mock('openai');

describe('AIEnhancementService', () => {
  let service: AIEnhancementService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<OpenAI>;
    
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);
    service = new AIEnhancementService('test-api-key');
  });

  describe('enhanceIssue', () => {
    const mockFeatureData: IssueFormData = {
      type: 'feature',
      title: 'Add user authentication',
      description: 'Implement a secure user authentication system with login and registration',
      context: {
        businessValue: 'Allow users to have personalized experiences and secure access',
        targetUsers: 'All application users',
        successCriteria: 'Users can register, login, and logout successfully',
      },
      technical: {
        components: ['auth', 'user', 'database'],
      },
      implementation: {
        requirements: 'JWT tokens, bcrypt for passwords, email verification',
        dependencies: ['jsonwebtoken', 'bcrypt', 'nodemailer'],
        approach: 'Use Next.js API routes with JWT authentication',
        affectedFiles: ['/api/auth/*', '/components/auth/*'],
      },
    };

    it('should enhance a feature issue with AI-generated content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              acceptanceCriteria: [
                'Users can register with email and password',
                'Users can login with valid credentials',
                'Users receive appropriate error messages for invalid inputs',
              ],
              edgeCases: [
                'Handle duplicate email registrations',
                'Prevent brute force attacks with rate limiting',
                'Handle password reset for non-existent emails gracefully',
              ],
              technicalConsiderations: [
                'Store passwords using bcrypt with salt rounds >= 10',
                'Implement JWT token refresh mechanism',
                'Add CSRF protection for authentication endpoints',
              ],
              finalPrompt: 'I need you to implement a complete user authentication system...',
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValueOnce(mockResponse as ChatCompletion);

      const result = await service.enhanceIssue(mockFeatureData);

      expect(result).toEqual({
        acceptanceCriteria: expect.arrayContaining([
          expect.stringContaining('register'),
          expect.stringContaining('login'),
          expect.stringContaining('error messages'),
        ]),
        edgeCases: expect.arrayContaining([
          expect.stringContaining('duplicate'),
          expect.stringContaining('brute force'),
          expect.stringContaining('password reset'),
        ]),
        technicalConsiderations: expect.arrayContaining([
          expect.stringContaining('bcrypt'),
          expect.stringContaining('JWT'),
          expect.stringContaining('CSRF'),
        ]),
        finalPrompt: expect.stringContaining('implement a complete user authentication system'),
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4-turbo-preview',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('GitHub issue enhancement'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining(mockFeatureData.description),
          }),
        ]),
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });
    });

    it('should handle bug issues with appropriate prompts', async () => {
      const mockBugData: IssueFormData = {
        type: 'bug',
        title: 'Login fails with special characters',
        description: 'Users cannot login when password contains special characters',
        context: {
          businessValue: 'Fix critical authentication issue affecting users',
          targetUsers: 'Users with special characters in passwords',
          successCriteria: 'All valid passwords work correctly',
        },
        technical: {
          stepsToReproduce: '1. Create account with password containing @#$\n2. Try to login\n3. Login fails',
          expectedBehavior: 'User should be able to login',
          actualBehavior: 'Login fails with 401 error',
        },
        implementation: {
          requirements: 'Fix password encoding/escaping',
          dependencies: [],
          approach: 'Review password handling in auth endpoints',
          affectedFiles: ['/api/auth/login'],
        },
      };

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              acceptanceCriteria: ['Special characters are properly handled'],
              edgeCases: ['Unicode characters', 'SQL injection attempts'],
              technicalConsiderations: ['Proper escaping', 'Character encoding'],
              finalPrompt: 'Fix the authentication bug...',
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValueOnce(mockResponse as ChatCompletion);

      const result = await service.enhanceIssue(mockBugData);

      expect(result.acceptanceCriteria).toContain('Special characters are properly handled');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Steps to Reproduce'),
            }),
          ]),
        })
      );
    });

    it('should gracefully handle API errors with fallback enhancements', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(new Error('API Error'));

      const result = await service.enhanceIssue(mockFeatureData);

      expect(result).toEqual({
        acceptanceCriteria: expect.arrayContaining([
          expect.stringContaining('feature works as described'),
        ]),
        edgeCases: expect.arrayContaining([
          expect.stringContaining('error states'),
        ]),
        technicalConsiderations: expect.arrayContaining([
          expect.stringContaining('security'),
        ]),
        finalPrompt: expect.stringContaining('implement this feature'),
      });
    });

    it('should respect token limits in prompts', async () => {
      const longDescription = 'A'.repeat(5000); // Very long description
      const longFormData = {
        ...mockFeatureData,
        description: longDescription,
      };

      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              acceptanceCriteria: ['Test'],
              edgeCases: ['Test'],
              technicalConsiderations: ['Test'],
              finalPrompt: 'Test',
            }),
          },
        }],
      } as ChatCompletion);

      await service.enhanceIssue(longFormData);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: expect.any(Number),
        })
      );
    });

    it('should handle epic issue types with sub-feature breakdown', async () => {
      const mockEpicData: IssueFormData = {
        type: 'epic',
        title: 'E-commerce Platform',
        description: 'Build complete e-commerce platform',
        context: {
          businessValue: 'Enable online sales',
          targetUsers: 'Customers and merchants',
          successCriteria: 'Full e-commerce functionality',
        },
        technical: {
          subFeatures: ['Product catalog', 'Shopping cart', 'Checkout', 'Order management'],
        },
        implementation: {
          requirements: 'Complete e-commerce solution',
          dependencies: ['stripe', 'inventory-system'],
          approach: 'Microservices architecture',
          affectedFiles: ['multiple'],
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              acceptanceCriteria: ['Product catalog is functional'],
              edgeCases: ['Payment failures', 'Inventory conflicts'],
              technicalConsiderations: ['Scalability', 'Transaction handling'],
              finalPrompt: 'Implement e-commerce platform with multiple features...',
            }),
          },
        }],
      } as ChatCompletion);

      const result = await service.enhanceIssue(mockEpicData);

      expect(result.technicalConsiderations).toContain('Scalability');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Sub-features'),
            }),
          ]),
        })
      );
    });

    it('should handle technical debt issues appropriately', async () => {
      const mockTechDebtData: IssueFormData = {
        type: 'technical-debt',
        title: 'Refactor authentication module',
        description: 'Current auth implementation is difficult to maintain',
        context: {
          businessValue: 'Reduce maintenance costs and improve developer productivity',
          targetUsers: 'Development team',
          successCriteria: 'Cleaner, more maintainable code',
        },
        technical: {
          improvementAreas: ['Code duplication', 'Complex logic', 'Poor error handling'],
        },
        implementation: {
          requirements: 'Refactor without changing functionality',
          dependencies: [],
          approach: 'Extract common logic, improve error handling',
          affectedFiles: ['/lib/auth/*'],
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              acceptanceCriteria: ['No regression in functionality'],
              edgeCases: ['Backward compatibility'],
              technicalConsiderations: ['Test coverage', 'Performance impact'],
              finalPrompt: 'Refactor the authentication module...',
            }),
          },
        }],
      } as ChatCompletion);

      const result = await service.enhanceIssue(mockTechDebtData);

      expect(result.acceptanceCriteria).toContain('No regression in functionality');
      expect(result.technicalConsiderations).toContain('Test coverage');
    });
  });

  describe('buildPrompt', () => {
    it('should build appropriate prompts for each issue type', () => {
      const featureData: IssueFormData = {
        type: 'feature',
        title: 'Test Feature',
        description: 'Test Description',
        context: {
          businessValue: 'Test Value',
          targetUsers: 'Test Users',
          successCriteria: 'Test Criteria',
        },
        technical: {
          components: ['test'],
        },
        implementation: {
          requirements: 'Test Requirements',
          dependencies: [],
          approach: 'Test Approach',
          affectedFiles: [],
        },
      };

      // Access private method through type assertion for testing
      const serviceWithPrivate = service as AIEnhancementService & {
        buildPrompt: (data: IssueFormData) => string;
      };
      const prompt = serviceWithPrivate.buildPrompt(featureData);

      expect(prompt).toContain('feature request');
      expect(prompt).toContain(featureData.title);
      expect(prompt).toContain(featureData.description);
      expect(prompt).toContain(featureData.context.businessValue);
    });
  });

  describe('cost protection', () => {
    it('should track and limit API usage', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              acceptanceCriteria: ['Test'],
              edgeCases: ['Test'],
              technicalConsiderations: ['Test'],
              finalPrompt: 'Test',
            }),
          },
        }],
        usage: {
          total_tokens: 1000,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as ChatCompletion);

      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        await service.enhanceIssue({
          type: 'feature',
          title: `Test ${i}`,
          description: 'Test',
          context: { businessValue: 'Test', targetUsers: 'Test', successCriteria: 'Test' },
          technical: { components: ['test'] },
          implementation: { requirements: 'Test', dependencies: [], approach: 'Test', affectedFiles: [] },
        });
      }

      const usage = service.getUsageStats();
      expect(usage.totalTokens).toBe(5000);
      expect(usage.requestCount).toBe(5);
    });
  });
});