import { MotionProps } from 'framer-motion';
import {
  withReducedMotion,
  calculate3DRotation,
  springTransition,
  easeTransition,
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

});