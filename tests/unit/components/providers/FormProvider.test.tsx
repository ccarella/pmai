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
global.localStorage = localStorageMock as any;

describe('FormProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FormProvider>{children}</FormProvider>
  );

  it('provides initial empty form data', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper });

    expect(result.current.formData).toEqual({});
    expect(result.current.isDataLoaded).toBe(true);
  });

  it('loads data from localStorage on mount', () => {
    const storedData = {
      type: 'feature',
      title: 'Stored Title',
      description: 'Stored Description',
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData));

    const { result } = renderHook(() => useFormContext(), { wrapper });

    expect(result.current.isDataLoaded).toBe(true);
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

  it('saves to localStorage when data changes', () => {
    const { result } = renderHook(() => useFormContext(), { wrapper });

    act(() => {
      result.current.updateFormData({
        type: 'feature',
        title: 'New Feature',
      });
    });

    // The setItem is called after the state update
    expect(result.current.formData).toMatchObject({
      type: 'feature',
      title: 'New Feature',
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pmai_form_data',
      expect.stringContaining('"type":"feature"')
    );
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
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useFormContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.isDataLoaded).toBe(true);
    });

    expect(result.current.formData).toEqual({});
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse stored form data:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useFormContext());
    }).toThrow('useFormContext must be used within FormProvider');

    consoleSpy.mockRestore();
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