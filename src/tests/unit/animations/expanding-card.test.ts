import { expandingCard, issueBodyContent } from '@/lib/animations/variants';

describe('Expanding Card Animations', () => {
  describe('expandingCard variant', () => {
    it('should have collapsed state', () => {
      expect(expandingCard.collapsed).toEqual({
        height: 'auto',
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30
        }
      });
    });

    it('should have expanded state', () => {
      expect(expandingCard.expanded).toEqual({
        height: 'auto',
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30
        }
      });
    });
  });

  describe('issueBodyContent variant', () => {
    it('should have collapsed state with zero height and opacity', () => {
      expect(issueBodyContent.collapsed).toEqual({
        opacity: 0,
        height: 0,
        transition: {
          opacity: { duration: 0.2 },
          height: { duration: 0.3 }
        }
      });
    });

    it('should have expanded state with auto height and full opacity', () => {
      expect(issueBodyContent.expanded).toEqual({
        opacity: 1,
        height: 'auto',
        transition: {
          height: { duration: 0.3 },
          opacity: { duration: 0.2, delay: 0.1 }
        }
      });
    });

    it('should have proper transition timing', () => {
      // Check collapsed transition
      const collapsedTransition = issueBodyContent.collapsed.transition;
      expect(collapsedTransition.opacity.duration).toBe(0.2);
      expect(collapsedTransition.height.duration).toBe(0.3);

      // Check expanded transition
      const expandedTransition = issueBodyContent.expanded.transition;
      expect(expandedTransition.height.duration).toBe(0.3);
      expect(expandedTransition.opacity.duration).toBe(0.2);
      expect(expandedTransition.opacity.delay).toBe(0.1);
    });
  });
});