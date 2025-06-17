import { renderHook } from '@testing-library/react';
import { useRepositoryChange } from '../useRepositoryChange';

describe('useRepositoryChange', () => {
  let eventListeners: { [key: string]: EventListener[] } = {};

  beforeEach(() => {
    eventListeners = {};
    
    // Mock addEventListener and removeEventListener
    jest.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: EventListener) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(handler);
    });

    jest.spyOn(window, 'removeEventListener').mockImplementation((event: string, handler: EventListener) => {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(h => h !== handler);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call callback when repository-switched event is dispatched', () => {
    const mockCallback = jest.fn();
    const testRepository = 'owner/test-repo';

    renderHook(() => useRepositoryChange(mockCallback));

    // Dispatch custom event
    const event = new CustomEvent('repository-switched', {
      detail: { repository: testRepository },
    });

    // Trigger the event
    eventListeners['repository-switched']?.forEach(handler => {
      handler(event);
    });

    expect(mockCallback).toHaveBeenCalledWith(testRepository);
  });

  it('should update callback when it changes', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const testRepository = 'owner/test-repo';

    const { rerender } = renderHook(
      ({ callback }) => useRepositoryChange(callback),
      { initialProps: { callback: mockCallback1 } }
    );

    // Update the callback
    rerender({ callback: mockCallback2 });

    // Dispatch custom event
    const event = new CustomEvent('repository-switched', {
      detail: { repository: testRepository },
    });

    // Trigger the event
    eventListeners['repository-switched']?.forEach(handler => {
      handler(event);
    });

    expect(mockCallback1).not.toHaveBeenCalled();
    expect(mockCallback2).toHaveBeenCalledWith(testRepository);
  });

  it('should cleanup event listener on unmount', () => {
    const mockCallback = jest.fn();

    const { unmount } = renderHook(() => useRepositoryChange(mockCallback));

    expect(window.addEventListener).toHaveBeenCalledWith(
      'repository-switched',
      expect.any(Function)
    );

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'repository-switched',
      expect.any(Function)
    );
  });

  it('should respect dependencies array', () => {
    const mockCallback = jest.fn();
    let dependency = 'initial';

    const { rerender } = renderHook(
      () => useRepositoryChange(mockCallback, [dependency])
    );


    // Change dependency
    dependency = 'changed';
    rerender();

    // Should have removed old listener and added new one
    expect(window.removeEventListener).toHaveBeenCalled();
    expect(window.addEventListener).toHaveBeenCalledTimes(2); // Initial + after dependency change
  });

  it('should handle multiple simultaneous hooks', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const testRepository = 'owner/test-repo';

    renderHook(() => useRepositoryChange(mockCallback1));
    renderHook(() => useRepositoryChange(mockCallback2));

    // Dispatch custom event
    const event = new CustomEvent('repository-switched', {
      detail: { repository: testRepository },
    });

    // Trigger the event
    eventListeners['repository-switched']?.forEach(handler => {
      handler(event);
    });

    expect(mockCallback1).toHaveBeenCalledWith(testRepository);
    expect(mockCallback2).toHaveBeenCalledWith(testRepository);
  });
});