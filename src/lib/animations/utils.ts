import { MotionProps } from 'framer-motion';

/**
 * Apply reduced motion settings to animation props
 */
export const withReducedMotion = (
  props: MotionProps,
  prefersReducedMotion: boolean
): MotionProps => {
  if (!prefersReducedMotion) return props;

  return {
    ...props,
    initial: false,
    animate: props.animate,
    transition: { duration: 0 }
  };
};

/**
 * Calculate 3D rotation based on mouse position
 */
export const calculate3DRotation = (
  mouseX: number,
  mouseY: number,
  maxRotation = 10
) => {
  return {
    rotateX: mouseY * maxRotation,
    rotateY: -mouseX * maxRotation
  };
};

/**
 * Generate spring transition config
 */
export const springTransition = (stiffness = 300, damping = 20) => ({
  type: 'spring' as const,
  stiffness,
  damping
});

/**
 * Generate ease transition config
 */
export const easeTransition = (duration = 0.3, ease = 'easeOut') => ({
  duration,
  ease
});

/**
 * Delay animation by index for stagger effects
 */
export const staggerDelay = (index: number, baseDelay = 0.1) => ({
  delay: index * baseDelay
});

/**
 * Create a ripple effect origin point
 */
export const getRippleOrigin = (event: React.MouseEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100
  };
};