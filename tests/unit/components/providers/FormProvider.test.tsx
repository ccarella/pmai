import React from 'react';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import { FormProvider, useFormContext } from '@/components/providers/FormProvider';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock console.error
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('FormProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FormProvider>{children}</FormProvider>
  );

  it('provides initial empty form data', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper });

    expect(result.current.formData).toEqual({});
    expect(result.current.isDataLoaded).toBe(true);
  });

  it('loads data from localStorage on mount', async () => {
    const storedData = {
      type: 'feature',
      title: 'Stored Title',
      description: 'Stored Description',
    };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedData));

    const { result } = renderHook(() => useFormContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isDataLoaded).toBe(true);
    });
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('pmai_form_data');
    expect(result.current.formData).toEqual(storedData);
  });

  it('updates form data correctly', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper });

    act(() => {
      result.current.updateFormData({
        type: 'bug',
        title: 'Test Bug',
      });
    });

    expect(result.current.formData).toEqual({
      type: 'bug',
      title: 'Test Bug',
    });
  });

  it('deep merges nested data', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper });

    act(() => {
      result.current.updateFormData({
        context: {
          businessValue: 'Initial value',
          targetUsers: 'Users',
        },
      });
    });

    act(() => {
      result.current.updateFormData({
        context: {
          businessValue: 'Updated value',
        },
      });
    });

    expect(result.current.formData.context).toEqual({
      businessValue: 'Updated value',
      targetUsers: 'Users',
    });
  });

  it('saves to localStorage when data changes', async () => {
    const { result } = renderHook(() => useFormContext(), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isDataLoaded).toBe(true);
    });

    act(() => {
      result.current.updateFormData({
        type: 'feature',
        title: 'New Feature',
      });
    });

    // Wait for the save to localStorage
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pmai_form_data',
        expect.stringContaining('"type":"feature"')
      );
    });

    expect(result.current.formData).toMatchObject({
      type: 'feature',
      title: 'New Feature',
    });
  });

  it('resets form data and clears localStorage', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper });

    act(() => {
      result.current.updateFormData({
        type: 'epic',
        title: 'Test Epic',
      });
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual({});
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('pmai_form_data');
  });

  it('handles invalid JSON in localStorage gracefully', async () => {
    localStorageMock.getItem.mockReturnValueOnce('invalid json');

    const { result } = renderHook(() => useFormContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isDataLoaded).toBe(true);
    });

    expect(result.current.formData).toEqual({});
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse stored form data:',
      expect.any(Error)
    );
  });

  it('throws error when used outside provider', () => {
    expect(() => {
      renderHook(() => useFormContext());
    }).toThrow('useFormContext must be used within FormProvider');
  });

  it('handles array values correctly', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper });

    act(() => {
      result.current.updateFormData({
        implementation: {
          dependencies: ['react', 'next'],
          affectedFiles: ['file1.ts', 'file2.ts'],
        },
      });
    });

    expect(result.current.formData.implementation).toEqual({
      dependencies: ['react', 'next'],
      affectedFiles: ['file1.ts', 'file2.ts'],
    });
  });
});