import { renderHook, act } from '@testing-library/react';
import { useFormPersistence, loadPersistedFormData, clearPersistedFormData } from '@/lib/hooks/useFormPersistence';
import { IssueFormData } from '@/lib/types/issue';

// Mock localStorage
let localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: jest.fn((key: string) => localStorageStore[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: jest.fn(() => {
    localStorageStore = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock console methods
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('useFormPersistence', () => {
  const STORAGE_KEY = 'pmai-issue-form-data';
  const mockFormData: Partial<IssueFormData> = {
    type: 'feature',
    title: 'Test Feature',
    description: 'Test description',
    priority: 'high',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorageStore = {};
    localStorageMock.clear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('useFormPersistence hook', () => {
    it('saves form data to localStorage after debounce delay', () => {
      renderHook(() => useFormPersistence(mockFormData));

      // Should not save immediately
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      // Fast forward time by debounce delay
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(mockFormData)
      );
    });

    it('debounces multiple rapid updates', () => {
      const { rerender } = renderHook(
        ({ formData }) => useFormPersistence(formData),
        { initialProps: { formData: mockFormData } }
      );

      // Update form data multiple times rapidly
      rerender({ formData: { ...mockFormData, title: 'Updated 1' } });
      act(() => jest.advanceTimersByTime(500));
      
      rerender({ formData: { ...mockFormData, title: 'Updated 2' } });
      act(() => jest.advanceTimersByTime(500));
      
      rerender({ formData: { ...mockFormData, title: 'Final Update' } });

      // Should not have saved yet
      expect(localStorageMock.setItem).not.toHaveBeenCalled();

      // Fast forward to complete debounce
      act(() => jest.advanceTimersByTime(1000));

      // Should only save once with final data
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ ...mockFormData, title: 'Final Update' })
      );
    });

    it('does not save empty form data', () => {
      renderHook(() => useFormPersistence({}));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      renderHook(() => useFormPersistence(mockFormData));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to save form data to localStorage:',
        expect.any(Error)
      );
    });

    it('clears timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { unmount } = renderHook(() => useFormPersistence(mockFormData));

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('clears previous timeout when form data changes', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { rerender } = renderHook(
        ({ formData }) => useFormPersistence(formData),
        { initialProps: { formData: mockFormData } }
      );

      // Update form data
      rerender({ formData: { ...mockFormData, title: 'Updated' } });

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('loadPersistedFormData', () => {
    it('loads saved form data from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockFormData));

      const result = loadPersistedFormData();

      expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result).toEqual(mockFormData);
    });

    it('returns null when no data is saved', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const result = loadPersistedFormData();

      expect(result).toBeNull();
    });

    it('handles JSON parse errors gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      const result = loadPersistedFormData();

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load persisted form data:',
        expect.any(Error)
      );
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = loadPersistedFormData();

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load persisted form data:',
        expect.any(Error)
      );
    });
  });

  describe('clearPersistedFormData', () => {
    it('removes form data from localStorage', () => {
      clearPersistedFormData();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      clearPersistedFormData();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to clear persisted form data:',
        expect.any(Error)
      );
    });
  });

  describe('Integration tests', () => {
    it('saves and loads form data correctly', () => {
      // Save data using the hook
      renderHook(() => useFormPersistence(mockFormData));
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Mock localStorage to return the saved data
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockFormData));

      // Load the data
      const loaded = loadPersistedFormData();
      expect(loaded).toEqual(mockFormData);
    });

    it('clears saved data correctly', () => {
      // Save data
      renderHook(() => useFormPersistence(mockFormData));
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Clear data
      clearPersistedFormData();

      // Verify it's cleared
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });
});