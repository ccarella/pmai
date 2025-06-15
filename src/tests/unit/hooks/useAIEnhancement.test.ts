import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIEnhancement } from '@/lib/hooks/useAIEnhancement';
import { IssueFormData } from '@/lib/types/issue';

// Mock fetch
global.fetch = jest.fn();

describe('useAIEnhancement', () => {
  const mockFormData: IssueFormData = {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enhance form data successfully', async () => {
    const mockEnhancements = {
      acceptanceCriteria: ['AC1', 'AC2'],
      edgeCases: ['EC1', 'EC2'],
      technicalConsiderations: ['TC1', 'TC2'],
      finalPrompt: 'Final prompt for Claude Code',
    };

    const mockResponse = {
      enhancements: mockEnhancements,
      usage: {
        totalTokens: 1000,
        requestCount: 1,
        estimatedCost: 0.045,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAIEnhancement());

    expect(result.current.enhancements).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.enhance(mockFormData);
    });

    expect(result.current.enhancements).toEqual(mockEnhancements);
    expect(result.current.usage).toEqual(mockResponse.usage);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    expect(global.fetch).toHaveBeenCalledWith('/api/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ formData: mockFormData }),
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Rate limit exceeded' }),
    });

    const { result } = renderHook(() => useAIEnhancement());

    await act(async () => {
      await result.current.enhance(mockFormData);
    });

    expect(result.current.error).toBe('Rate limit exceeded');
    expect(result.current.isLoading).toBe(false);
    
    // Should fall back to default enhancements
    expect(result.current.enhancements).not.toBeNull();
    expect(result.current.enhancements?.acceptanceCriteria).toContain(
      'Feature functions as described in requirements'
    );
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAIEnhancement());

    await act(async () => {
      await result.current.enhance(mockFormData);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
    
    // Should fall back to default enhancements
    expect(result.current.enhancements).not.toBeNull();
  });

  it('should show loading state during enhancement', async () => {
    let resolvePromise: (value: Response) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(promise);

    const { result } = renderHook(() => useAIEnhancement());

    act(() => {
      result.current.enhance(mockFormData);
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => ({
          enhancements: {
            acceptanceCriteria: ['AC1'],
            edgeCases: ['EC1'],
            technicalConsiderations: ['TC1'],
            finalPrompt: 'Prompt',
          },
          usage: { totalTokens: 100, requestCount: 1, estimatedCost: 0.0045 },
        }),
      } as Response);
      await promise;
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should clear errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    const { result } = renderHook(() => useAIEnhancement());

    await act(async () => {
      await result.current.enhance(mockFormData);
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should provide appropriate default enhancements for each issue type', async () => {
    const issueTypes: IssueFormData['type'][] = ['feature', 'bug', 'epic', 'technical-debt'];

    for (const type of issueTypes) {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const { result } = renderHook(() => useAIEnhancement());
      
      const testData = { ...mockFormData, type };

      await act(async () => {
        await result.current.enhance(testData);
      });

      expect(result.current.enhancements).not.toBeNull();
      expect(result.current.enhancements?.acceptanceCriteria.length).toBeGreaterThan(0);
      expect(result.current.enhancements?.edgeCases.length).toBeGreaterThan(0);
      expect(result.current.enhancements?.technicalConsiderations.length).toBeGreaterThan(0);
      expect(result.current.enhancements?.finalPrompt).toBeTruthy();
    }
  });
});