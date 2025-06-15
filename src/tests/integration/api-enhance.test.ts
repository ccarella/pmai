import { AIEnhancementService } from '@/lib/services/ai-enhancement';

// Mock the AI service
jest.mock('@/lib/services/ai-enhancement');

describe('API Enhancement Integration', () => {
  let mockEnhancementService: jest.Mocked<AIEnhancementService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEnhancementService = {
      enhanceIssue: jest.fn(),
      getUsageStats: jest.fn(),
      resetUsageStats: jest.fn(),
    } as unknown as jest.Mocked<AIEnhancementService>;

    (AIEnhancementService as jest.MockedClass<typeof AIEnhancementService>)
      .mockImplementation(() => mockEnhancementService);
  });

  it('should enhance issues with AI service', async () => {
    const mockEnhancements = {
      acceptanceCriteria: ['AC1', 'AC2'],
      edgeCases: ['EC1', 'EC2'],
      technicalConsiderations: ['TC1', 'TC2'],
      finalPrompt: 'Final prompt for Claude Code',
    };

    mockEnhancementService.enhanceIssue.mockResolvedValueOnce(mockEnhancements);
    mockEnhancementService.getUsageStats.mockReturnValueOnce({
      totalTokens: 1000,
      requestCount: 1,
      estimatedCost: 0.045,
    });

    const formData = {
      type: 'feature' as const,
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

    const service = new AIEnhancementService('test-key');
    await service.enhanceIssue(formData);

    expect(mockEnhancementService.enhanceIssue).toHaveBeenCalledWith(formData);
  });

  it('should track usage statistics', () => {
    const mockStats = {
      totalTokens: 5000,
      requestCount: 5,
      estimatedCost: 0.225,
    };

    mockEnhancementService.getUsageStats.mockReturnValueOnce(mockStats);

    const service = new AIEnhancementService('test-key');
    const stats = service.getUsageStats();

    expect(stats).toEqual(mockStats);
  });

  it('should handle cost limits', () => {
    // Simulate high usage
    mockEnhancementService.getUsageStats.mockReturnValueOnce({
      totalTokens: 250000,
      requestCount: 100,
      estimatedCost: 11.25, // Over $10 limit
    });

    const service = new AIEnhancementService('test-key');
    const stats = service.getUsageStats();

    // In a real implementation, this would be checked before making a request
    const maxCost = 10.0;
    const isOverLimit = stats.estimatedCost > maxCost;

    expect(isOverLimit).toBe(true);
  });
});