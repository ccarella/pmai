import {
  pageVariants,
  staggerContainer,
  staggerItem,
  cardVariants,
  buttonVariants,
  fieldVariants,
  errorShake,
  successCheck,
  loadingPulse,
  tabContent,
  fadeIn,
  scaleFade,
  heroText,
} from '@/lib/animations/variants';

describe('Animation Variants', () => {
  describe('pageVariants', () => {
    it('should have correct initial state', () => {
      expect(pageVariants.initial).toEqual({
        opacity: 0,
        y: 20,
      });
    });

    it('should have correct animate state', () => {
      expect(pageVariants.animate).toEqual({
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: 'easeOut',
        },
      });
    });

    it('should have correct exit state', () => {
      expect(pageVariants.exit).toEqual({
        opacity: 0,
        y: -20,
        transition: {
          duration: 0.3,
          ease: 'easeIn',
        },
      });
    });
  });

  describe('staggerContainer', () => {
    it('should have correct hidden state', () => {
      expect(staggerContainer.hidden).toEqual({ opacity: 0 });
    });

    it('should have correct show state with stagger settings', () => {
      expect(staggerContainer.show).toEqual({
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1,
        },
      });
    });
  });

  describe('staggerItem', () => {
    it('should have correct hidden state', () => {
      expect(staggerItem.hidden).toEqual({
        opacity: 0,
        y: 20,
        scale: 0.95,
      });
    });

    it('should have correct show state', () => {
      expect(staggerItem.show).toEqual({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      });
    });
  });

  describe('cardVariants', () => {
    it('should have correct rest state', () => {
      expect(cardVariants.rest).toEqual({
        scale: 1,
        rotateX: 0,
        rotateY: 0,
        transition: {
          duration: 0.2,
          ease: 'easeOut',
        },
      });
    });

    it('should have correct hover state', () => {
      expect(cardVariants.hover).toEqual({
        scale: 1.02,
        transition: {
          duration: 0.2,
          ease: 'easeOut',
        },
      });
    });

    it('should have correct tap state', () => {
      expect(cardVariants.tap).toEqual({
        scale: 0.98,
        transition: {
          duration: 0.1,
          ease: 'easeOut',
        },
      });
    });
  });

  describe('buttonVariants', () => {
    it('should have correct rest state', () => {
      expect(buttonVariants.rest).toEqual({ scale: 1 });
    });

    it('should have correct hover state', () => {
      expect(buttonVariants.hover).toEqual({
        scale: 1.05,
        transition: {
          duration: 0.2,
          ease: 'easeOut',
        },
      });
    });

    it('should have correct tap state', () => {
      expect(buttonVariants.tap).toEqual({
        scale: 0.95,
        transition: {
          duration: 0.1,
          ease: 'easeOut',
        },
      });
    });
  });

  describe('fieldVariants', () => {
    it('should have correct initial state', () => {
      expect(fieldVariants.initial).toEqual({
        opacity: 0,
        y: 10,
      });
    });

    it('should have correct animate state', () => {
      expect(fieldVariants.animate).toEqual({
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      });
    });

    it('should have correct exit state', () => {
      expect(fieldVariants.exit).toEqual({
        opacity: 0,
        y: -10,
        transition: {
          duration: 0.2,
          ease: 'easeIn',
        },
      });
    });
  });

  describe('errorShake', () => {
    it('should have correct initial state', () => {
      expect(errorShake.initial).toEqual({ x: 0 });
    });

    it('should have correct animate state with shake sequence', () => {
      expect(errorShake.animate).toEqual({
        x: [-10, 10, -10, 10, 0],
        transition: {
          duration: 0.4,
          ease: 'easeInOut',
        },
      });
    });
  });

  describe('successCheck', () => {
    it('should have correct initial state', () => {
      expect(successCheck.initial).toEqual({
        pathLength: 0,
        opacity: 0,
      });
    });

    it('should have correct animate state with different transitions', () => {
      expect(successCheck.animate).toEqual({
        pathLength: 1,
        opacity: 1,
        transition: {
          pathLength: { duration: 0.5, ease: 'easeInOut' },
          opacity: { duration: 0.3 },
        },
      });
    });
  });

  describe('loadingPulse', () => {
    it('should have correct initial state', () => {
      expect(loadingPulse.initial).toEqual({ opacity: 0.3 });
    });

    it('should have correct animate state with infinite loop', () => {
      expect(loadingPulse.animate).toEqual({
        opacity: [0.3, 0.8, 0.3],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    });
  });

  describe('tabContent', () => {
    it('should have correct initial state', () => {
      expect(tabContent.initial).toEqual({
        opacity: 0,
        x: 20,
      });
    });

    it('should have correct animate state', () => {
      expect(tabContent.animate).toEqual({
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      });
    });

    it('should have correct exit state', () => {
      expect(tabContent.exit).toEqual({
        opacity: 0,
        x: -20,
        transition: {
          duration: 0.2,
          ease: 'easeIn',
        },
      });
    });
  });

  describe('fadeIn', () => {
    it('should have correct initial state', () => {
      expect(fadeIn.initial).toEqual({ opacity: 0 });
    });

    it('should have correct animate state', () => {
      expect(fadeIn.animate).toEqual({
        opacity: 1,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      });
    });
  });

  describe('scaleFade', () => {
    it('should have correct initial state', () => {
      expect(scaleFade.initial).toEqual({
        opacity: 0,
        scale: 0.9,
      });
    });

    it('should have correct animate state', () => {
      expect(scaleFade.animate).toEqual({
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      });
    });
  });

  describe('heroText', () => {
    it('should have correct initial state', () => {
      expect(heroText.initial).toEqual({
        opacity: 0,
        y: 30,
      });
    });

    it('should have correct animate state', () => {
      expect(heroText.animate).toEqual({
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          ease: 'easeOut',
        },
      });
    });
  });

  describe('Variant consistency', () => {
    it('should have consistent opacity transitions', () => {
      const variants = [pageVariants, fieldVariants, tabContent, fadeIn, scaleFade, heroText];
      
      variants.forEach((variant) => {
        if (variant.initial && typeof variant.initial === 'object' && 'opacity' in variant.initial) {
          expect(variant.initial.opacity).toBe(0);
        }
        if (variant.animate && typeof variant.animate === 'object' && 'opacity' in variant.animate) {
          expect(variant.animate.opacity).toBe(1);
        }
      });
    });

    it('should use easeOut for enter animations', () => {
      const enterVariants = [
        pageVariants.animate,
        staggerItem.show,
        cardVariants.rest,
        buttonVariants.hover,
        fieldVariants.animate,
        tabContent.animate,
        fadeIn.animate,
        scaleFade.animate,
        heroText.animate,
      ];

      enterVariants.forEach((variant) => {
        if (typeof variant === 'object' && 'transition' in variant && variant.transition) {
          const transition = variant.transition as any;
          if ('ease' in transition) {
            expect(transition.ease).toBe('easeOut');
          }
        }
      });
    });

    it('should use easeIn for exit animations', () => {
      const exitVariants = [pageVariants.exit, fieldVariants.exit, tabContent.exit];

      exitVariants.forEach((variant) => {
        if (typeof variant === 'object' && 'transition' in variant && variant.transition) {
          const transition = variant.transition as any;
          expect(transition.ease).toBe('easeIn');
        }
      });
    });
  });
});