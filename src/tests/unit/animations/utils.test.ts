import { MotionProps } from 'framer-motion';
import {
  withReducedMotion,
  calculate3DRotation,
  springTransition,
  easeTransition,
  staggerDelay,
  getRippleOrigin,
} from '@/lib/animations/utils';

describe('Animation Utils', () => {
  describe('withReducedMotion', () => {
    it('should return original props when reduced motion is false', () => {
      const props: MotionProps = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      };

      const result = withReducedMotion(props, false);

      expect(result).toEqual(props);
    });

    it('should disable animations when reduced motion is true', () => {
      const props: MotionProps = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      };

      const result = withReducedMotion(props, true);

      expect(result).toEqual({
        initial: false,
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0 },
      });
    });

    it('should preserve other props', () => {
      const props: MotionProps = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5 },
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.9 },
      };

      const result = withReducedMotion(props, true);

      expect(result).toEqual({
        initial: false,
        animate: { opacity: 1 },
        transition: { duration: 0 },
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.9 },
      });
    });
  });

  describe('calculate3DRotation', () => {
    it('should calculate rotation based on mouse position', () => {
      const result = calculate3DRotation(0.5, -0.5);

      expect(result).toEqual({
        rotateX: -5,
        rotateY: -5,
      });
    });

    it('should return zero rotation for center position', () => {
      const result = calculate3DRotation(0, 0);

      expect(result).toEqual({
        rotateX: 0,
        rotateY: -0, // JavaScript -0 !== 0 for Object.is
      });
    });

    it('should use custom max rotation', () => {
      const result = calculate3DRotation(0.5, 0.5, 20);

      expect(result).toEqual({
        rotateX: 10,
        rotateY: -10,
      });
    });

    it('should handle extreme positions', () => {
      const result = calculate3DRotation(1, -1, 15);

      expect(result).toEqual({
        rotateX: -15,
        rotateY: -15,
      });
    });

    it('should invert Y rotation', () => {
      const resultPositiveX = calculate3DRotation(0.5, 0);
      const resultNegativeX = calculate3DRotation(-0.5, 0);

      expect(resultPositiveX.rotateY).toBe(-5);
      expect(resultNegativeX.rotateY).toBe(5);
    });
  });

  describe('springTransition', () => {
    it('should return spring config with defaults', () => {
      const result = springTransition();

      expect(result).toEqual({
        type: 'spring',
        stiffness: 300,
        damping: 20,
      });
    });

    it('should return spring config with custom values', () => {
      const result = springTransition(500, 30);

      expect(result).toEqual({
        type: 'spring',
        stiffness: 500,
        damping: 30,
      });
    });

    it('should accept zero values', () => {
      const result = springTransition(0, 0);

      expect(result).toEqual({
        type: 'spring',
        stiffness: 0,
        damping: 0,
      });
    });
  });

  describe('easeTransition', () => {
    it('should return ease config with defaults', () => {
      const result = easeTransition();

      expect(result).toEqual({
        duration: 0.3,
        ease: 'easeOut',
      });
    });

    it('should return ease config with custom values', () => {
      const result = easeTransition(0.5, 'easeInOut');

      expect(result).toEqual({
        duration: 0.5,
        ease: 'easeInOut',
      });
    });

    it('should accept different ease types', () => {
      const easeTypes = ['linear', 'easeIn', 'easeOut', 'easeInOut'];
      
      easeTypes.forEach((ease) => {
        const result = easeTransition(0.2, ease);
        expect(result.ease).toBe(ease);
      });
    });
  });

  describe('staggerDelay', () => {
    it('should calculate delay based on index with default', () => {
      const result = staggerDelay(3);

      expect(result.delay).toBeCloseTo(0.3, 10);
    });

    it('should calculate delay with custom base delay', () => {
      const result = staggerDelay(5, 0.2);

      expect(result).toEqual({
        delay: 1,
      });
    });

    it('should handle zero index', () => {
      const result = staggerDelay(0);

      expect(result).toEqual({
        delay: 0,
      });
    });

    it('should handle negative base delay', () => {
      const result = staggerDelay(2, -0.1);

      expect(result).toEqual({
        delay: -0.2,
      });
    });

    it('should calculate correct delays for multiple items', () => {
      const delays = [0, 1, 2, 3, 4].map(i => staggerDelay(i, 0.15));

      expect(delays[0].delay).toBe(0);
      expect(delays[1].delay).toBeCloseTo(0.15, 10);
      expect(delays[2].delay).toBeCloseTo(0.3, 10);
      expect(delays[3].delay).toBeCloseTo(0.45, 10);
      expect(delays[4].delay).toBeCloseTo(0.6, 10);
    });
  });

  describe('getRippleOrigin', () => {
    it('should calculate ripple origin from click position', () => {
      const mockEvent = {
        clientX: 150,
        clientY: 150,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 100,
            top: 100,
            width: 200,
            height: 200,
            right: 300,
            bottom: 300,
            x: 100,
            y: 100,
          }),
        },
      } as unknown as React.MouseEvent<HTMLElement>;

      const result = getRippleOrigin(mockEvent);

      expect(result).toEqual({
        x: 25,
        y: 25,
      });
    });

    it('should handle click at top-left corner', () => {
      const mockEvent = {
        clientX: 0,
        clientY: 0,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
            x: 0,
            y: 0,
          }),
        },
      } as unknown as React.MouseEvent<HTMLElement>;

      const result = getRippleOrigin(mockEvent);

      expect(result).toEqual({
        x: 0,
        y: 0,
      });
    });

    it('should handle click at bottom-right corner', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 100,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
            x: 0,
            y: 0,
          }),
        },
      } as unknown as React.MouseEvent<HTMLElement>;

      const result = getRippleOrigin(mockEvent);

      expect(result).toEqual({
        x: 100,
        y: 100,
      });
    });

    it('should handle click at center', () => {
      const mockEvent = {
        clientX: 250,
        clientY: 250,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 200,
            top: 200,
            width: 100,
            height: 100,
            right: 300,
            bottom: 300,
            x: 200,
            y: 200,
          }),
        },
      } as unknown as React.MouseEvent<HTMLElement>;

      const result = getRippleOrigin(mockEvent);

      expect(result).toEqual({
        x: 50,
        y: 50,
      });
    });

    it('should handle different element sizes', () => {
      const mockEvent = {
        clientX: 100,
        clientY: 50,
        currentTarget: {
          getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 400,
            height: 200,
            right: 400,
            bottom: 200,
            x: 0,
            y: 0,
          }),
        },
      } as unknown as React.MouseEvent<HTMLElement>;

      const result = getRippleOrigin(mockEvent);

      expect(result).toEqual({
        x: 25,
        y: 25,
      });
    });
  });
});