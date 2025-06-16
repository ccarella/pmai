import { renderHook, act, waitFor } from '@testing-library/react';
import { useAnimation } from 'framer-motion';
import {
  useStaggerAnimation,
  useReducedMotion,
  useCopyAnimation,
  usePageTransition,
  useMousePosition,
  useInViewAnimation,
} from '@/lib/animations/hooks';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  useAnimation: jest.fn(),
}));

describe('Animation Hooks', () => {
  describe('useStaggerAnimation', () => {
    let mockControls: any;

    beforeEach(() => {
      mockControls = {
        start: jest.fn().mockResolvedValue(undefined),
      };
      (useAnimation as jest.Mock).mockReturnValue(mockControls);
    });

    it('should start animation after delay', async () => {
      const { result } = renderHook(() => useStaggerAnimation(5, 100));

      // Wait for the delay and animation to complete
      await waitFor(() => {
        expect(mockControls.start).toHaveBeenCalledWith('show');
      });

      expect(result.current).toBe(mockControls);
    });

    it('should start animation immediately with no delay', async () => {
      renderHook(() => useStaggerAnimation(3, 0));

      await waitFor(() => {
        expect(mockControls.start).toHaveBeenCalledWith('show');
      });
    });

    it('should re-trigger animation when itemCount changes', async () => {
      const { rerender } = renderHook(
        ({ itemCount }) => useStaggerAnimation(itemCount, 0),
        { initialProps: { itemCount: 2 } }
      );

      await waitFor(() => {
        expect(mockControls.start).toHaveBeenCalledTimes(1);
      });

      rerender({ itemCount: 5 });

      await waitFor(() => {
        expect(mockControls.start).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('useReducedMotion', () => {
    let mockMatchMedia: jest.Mock;

    beforeEach(() => {
      mockMatchMedia = jest.fn();
      window.matchMedia = mockMatchMedia;
    });

    it('should detect reduced motion preference', () => {
      const mockMediaQueryList = {
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      mockMatchMedia.mockReturnValue(mockMediaQueryList);

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('should update when preference changes', () => {
      let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;
      const mockMediaQueryList = {
        matches: false,
        addEventListener: jest.fn((event, handler) => {
          if (event === 'change') changeHandler = handler;
        }),
        removeEventListener: jest.fn(),
      };
      mockMatchMedia.mockReturnValue(mockMediaQueryList);

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current).toBe(false);

      // Simulate preference change
      act(() => {
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });

      expect(result.current).toBe(true);
    });

    it('should clean up event listener on unmount', () => {
      const mockMediaQueryList = {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      mockMatchMedia.mockReturnValue(mockMediaQueryList);

      const { unmount } = renderHook(() => useReducedMotion());

      unmount();

      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('useCopyAnimation', () => {
    jest.useFakeTimers();

    afterEach(() => {
      jest.clearAllTimers();
    });

    it('should handle copy animation state', () => {
      const { result } = renderHook(() => useCopyAnimation());

      expect(result.current.copied).toBe(false);

      act(() => {
        result.current.triggerCopy();
      });

      expect(result.current.copied).toBe(true);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.copied).toBe(false);
    });

    it('should handle multiple triggers', () => {
      const { result } = renderHook(() => useCopyAnimation());

      // First trigger
      act(() => {
        result.current.triggerCopy();
      });

      expect(result.current.copied).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should still be true after 1000ms (less than 2000ms timeout)
      expect(result.current.copied).toBe(true);

      // Second trigger (doesn't clear the first timer)
      act(() => {
        result.current.triggerCopy();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // First timer completes (2000ms total)
      expect(result.current.copied).toBe(false);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Second timer also completes
      expect(result.current.copied).toBe(false);
    });
  });

  describe('usePageTransition', () => {
    let mockControls: any;

    beforeEach(() => {
      mockControls = {
        start: jest.fn().mockResolvedValue(undefined),
      };
      (useAnimation as jest.Mock).mockReturnValue(mockControls);
    });

    it('should start animate on mount', () => {
      const { result } = renderHook(() => usePageTransition());

      expect(mockControls.start).toHaveBeenCalledWith('animate');
      expect(result.current).toBe(mockControls);
    });
  });

  describe('useMousePosition', () => {
    it('should track mouse position relative to element', () => {
      const ref = { current: document.createElement('div') };
      
      // Mock getBoundingClientRect
      ref.current.getBoundingClientRect = jest.fn(() => ({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        right: 300,
        bottom: 300,
        x: 100,
        y: 100,
      }));

      const { result } = renderHook(() => useMousePosition(ref));

      expect(result.current).toEqual({ x: 0, y: 0 });

      // Simulate mouse move
      act(() => {
        const event = new MouseEvent('mousemove', {
          clientX: 200,
          clientY: 200,
        });
        ref.current?.dispatchEvent(event);
      });

      // Position should be normalized to -0.5 to 0.5 range
      expect(result.current).toEqual({ x: 0, y: 0 });

      // Test edge case - top left corner
      act(() => {
        const event = new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100,
        });
        ref.current?.dispatchEvent(event);
      });

      expect(result.current).toEqual({ x: -0.5, y: -0.5 });

      // Test edge case - bottom right corner
      act(() => {
        const event = new MouseEvent('mousemove', {
          clientX: 300,
          clientY: 300,
        });
        ref.current?.dispatchEvent(event);
      });

      expect(result.current).toEqual({ x: 0.5, y: 0.5 });
    });

    it('should reset position on mouse leave', () => {
      const ref = { current: document.createElement('div') };
      
      ref.current.getBoundingClientRect = jest.fn(() => ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
      }));

      const { result } = renderHook(() => useMousePosition(ref));

      // Move mouse
      act(() => {
        const event = new MouseEvent('mousemove', {
          clientX: 75,
          clientY: 75,
        });
        ref.current?.dispatchEvent(event);
      });

      expect(result.current).not.toEqual({ x: 0, y: 0 });

      // Mouse leave
      act(() => {
        const event = new MouseEvent('mouseleave');
        ref.current?.dispatchEvent(event);
      });

      expect(result.current).toEqual({ x: 0, y: 0 });
    });

    it('should handle null ref', () => {
      const ref = { current: null };
      const { result } = renderHook(() => useMousePosition(ref));

      expect(result.current).toEqual({ x: 0, y: 0 });
    });

    it('should clean up event listeners on unmount', () => {
      const ref = { current: document.createElement('div') };
      const removeEventListenerSpy = jest.spyOn(ref.current, 'removeEventListener');

      const { unmount } = renderHook(() => useMousePosition(ref));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    });
  });

  describe('useInViewAnimation', () => {
    let mockControls: any;
    let mockObserve: jest.Mock;
    let mockDisconnect: jest.Mock;
    let observerCallback: IntersectionObserverCallback | null = null;

    beforeEach(() => {
      mockControls = {
        start: jest.fn().mockResolvedValue(undefined),
      };
      (useAnimation as jest.Mock).mockReturnValue(mockControls);

      mockObserve = jest.fn();
      mockDisconnect = jest.fn();

      (global as any).IntersectionObserver = jest.fn((callback) => {
        observerCallback = callback;
        return {
          observe: mockObserve,
          disconnect: mockDisconnect,
          unobserve: jest.fn(),
        };
      });
    });

    it('should start animation when element is in view', () => {
      const { result } = renderHook(() => useInViewAnimation());

      // Set ref
      const element = document.createElement('div');
      act(() => {
        result.current.ref(element);
      });

      expect(mockObserve).toHaveBeenCalledWith(element);

      // Simulate element coming into view
      act(() => {
        if (observerCallback) {
          observerCallback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver
          );
        }
      });

      expect(mockControls.start).toHaveBeenCalledWith('animate');
    });

    it('should not start animation when element is not in view', () => {
      const { result } = renderHook(() => useInViewAnimation());

      const element = document.createElement('div');
      act(() => {
        result.current.ref(element);
      });

      // Simulate element not in view
      act(() => {
        if (observerCallback) {
          observerCallback(
            [{ isIntersecting: false } as IntersectionObserverEntry],
            {} as IntersectionObserver
          );
        }
      });

      expect(mockControls.start).not.toHaveBeenCalled();
    });

    it('should use custom threshold', () => {
      const { result } = renderHook(() => useInViewAnimation(0.5));

      // Set ref to trigger IntersectionObserver creation
      const element = document.createElement('div');
      act(() => {
        result.current.ref(element);
      });

      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { threshold: 0.5 }
      );
    });

    it('should disconnect observer on unmount', () => {
      const { result, unmount } = renderHook(() => useInViewAnimation());

      const element = document.createElement('div');
      act(() => {
        result.current.ref(element);
      });

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should handle null ref', () => {
      const { result } = renderHook(() => useInViewAnimation());

      act(() => {
        result.current.ref(null);
      });

      expect(mockObserve).not.toHaveBeenCalled();
    });
  });
});