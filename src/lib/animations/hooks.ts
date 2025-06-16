import { useEffect, useState } from 'react';
import { useAnimation } from 'framer-motion';

/**
 * Hook to handle staggered animations for lists
 */
export const useStaggerAnimation = (itemCount: number, delay = 0) => {
  const controls = useAnimation();

  useEffect(() => {
    const animateItems = async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      await controls.start('show');
    };
    animateItems();
  }, [controls, delay, itemCount]);

  return controls;
};

/**
 * Hook to detect and respect prefers-reduced-motion
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook for copy to clipboard animation
 */
export const useCopyAnimation = () => {
  const [copied, setCopied] = useState(false);

  const triggerCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { copied, triggerCopy };
};

/**
 * Hook for handling page transitions
 */
export const usePageTransition = () => {
  const controls = useAnimation();

  useEffect(() => {
    controls.start('animate');
  }, [controls]);

  return controls;
};

/**
 * Hook for mouse position tracking (for card tilt effects)
 */
export const useMousePosition = (ref: React.RefObject<HTMLElement | null>) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePosition({ x, y });
    };

    const handleMouseLeave = () => {
      setMousePosition({ x: 0, y: 0 });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref]);

  return mousePosition;
};

/**
 * Hook for intersection observer animations
 */
export const useInViewAnimation = (threshold = 0.1) => {
  const controls = useAnimation();
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start('animate');
        }
      },
      { threshold }
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, controls, threshold]);

  return { ref: setRef, controls };
};