import { renderHook, act } from '@testing-library/react';
import { useAIEnhancement } from '@/lib/hooks/useAIEnhancement';
import { IssueFormData } from '@/lib/types/issue';

// Mock fetch
global.fetch = jest.fn();

describe('useAIEnhancement - API Key Requirements', () => {
  const mockFormData: IssueFormData = {
    type: 'feature',
    title: 'Test Feature',
    description: 'Test description',
    priority: 'high',
    assignee: 'test.user',
    context: {
      targetUsers: 'All users',
      businessValue: 'High value',
      successCriteria: 'Test criteria',
    },
    implementation: {
      requirements: 'Test requirements',
      approach: 'Test approach',
      dependencies: [],
      affectedFiles: [],
    },
    technical: {
      components: ['TestComponent'],
    },
  };

  const mockEnhancements = {
    acceptanceCriteria: ['AC1', 'AC2'],
    edgeCases: ['EC1', 'EC2'],
    technicalConsiderations: ['TC1'],
    finalPrompt: 'Test prompt',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('API Key Required Response', () => {
    it('handles 403 response with requiresApiKey flag', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'OpenAI API key required',
          message: 'Please configure your OpenAI API key in Settings to use AI-enhanced features.',
          requiresApiKey: true,
        }),
      });

      const { result } = renderHook(() => useAIEnhancement());

      await act(async () => {
        await result.current.enhance(mockFormData);
      });

      expect(result.current.requiresApiKey).toBe(true);
      expect(result.current.error).toBe('Please configure your OpenAI API key in Settings to use AI-enhanced features.');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.enhancements).not.toBeNull(); // Should have default enhancements
    });

    it('sets requiresApiKey to false for other errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error',
        }),
      });

      const { result } = renderHook(() => useAIEnhancement());

      await act(async () => {
        await result.current.enhance(mockFormData);
      });

      expect(result.current.requiresApiKey).toBe(false);
      expect(result.current.error).toBe('Internal server error');
      expect(result.current.enhancements).not.toBeNull(); // Should have default enhancements
    });

    it('provides default enhancements when API key is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'OpenAI API key required',
          message: 'Please configure your OpenAI API key',
          requiresApiKey: true,
        }),
      });

      const { result } = renderHook(() => useAIEnhancement());

      await act(async () => {
        await result.current.enhance(mockFormData);
      });

      expect(result.current.enhancements).toEqual(expect.objectContaining({
        acceptanceCriteria: expect.any(Array),
        edgeCases: expect.any(Array),
        technicalConsiderations: expect.any(Array),
        finalPrompt: expect.any(String),
      }));
    });

    it('clears requiresApiKey flag when clearError is called', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'OpenAI API key required',
          requiresApiKey: true,
        }),
      });

      const { result } = renderHook(() => useAIEnhancement());

      await act(async () => {
        await result.current.enhance(mockFormData);
      });

      expect(result.current.requiresApiKey).toBe(true);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.requiresApiKey).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('resets requiresApiKey on new enhance call', async () => {
      // First call returns API key required
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'OpenAI API key required',
          requiresApiKey: true,
        }),
      });

      const { result } = renderHook(() => useAIEnhancement());

      await act(async () => {
        await result.current.enhance(mockFormData);
      });

      expect(result.current.requiresApiKey).toBe(true);

      // Second call succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enhancements: mockEnhancements,
          usage: { totalTokens: 100, requestCount: 1, estimatedCost: 0.5 },
        }),
      });

      await act(async () => {
        await result.current.enhance(mockFormData);
      });

      expect(result.current.requiresApiKey).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.enhancements).toEqual(mockEnhancements);
    });
  });

  describe('Successful Enhancement', () => {
    it('handles successful response with API key configured', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          enhancements: mockEnhancements,
          usage: { totalTokens: 100, requestCount: 1, estimatedCost: 0.5 },
        }),
      });

      const { result } = renderHook(() => useAIEnhancement());

      await act(async () => {
        await result.current.enhance(mockFormData);
      });

      expect(result.current.requiresApiKey).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.enhancements).toEqual(mockEnhancements);
      expect(result.current.usage).toEqual({
        totalTokens: 100,
        requestCount: 1,
        estimatedCost: 0.5,
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAIEnhancement());

      await act(async () => {
        await result.current.enhance(mockFormData);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.requiresApiKey).toBe(false);
      expect(result.current.enhancements).not.toBeNull(); // Should have default enhancements
    });

    it('handles non-403 error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Rate limit exceeded',
        }),
      });

      const { result } = renderHook(() => useAIEnhancement());

      await act(async () => {
        await result.current.enhance(mockFormData);
      });

      expect(result.current.error).toBe('Rate limit exceeded');
      expect(result.current.requiresApiKey).toBe(false);
    });
  });

  describe('Default Enhancements', () => {
    it('provides appropriate defaults for each issue type', async () => {
      const issueTypes: IssueFormData['type'][] = ['feature', 'bug', 'epic', 'technical-debt'];

      for (const type of issueTypes) {
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 403,
          json: async () => ({
            error: 'OpenAI API key required',
            requiresApiKey: true,
          }),
        });

        const { result } = renderHook(() => useAIEnhancement());

        await act(async () => {
          await result.current.enhance({ ...mockFormData, type });
        });

        expect(result.current.enhancements).toBeDefined();
        expect(result.current.enhancements?.acceptanceCriteria.length).toBeGreaterThan(0);
        expect(result.current.enhancements?.edgeCases.length).toBeGreaterThan(0);
        expect(result.current.enhancements?.technicalConsiderations.length).toBeGreaterThan(0);
        expect(result.current.enhancements?.finalPrompt).toBeTruthy();
      }
    });
  });
});