# Testing Expanding Card Animation

## To test the expanding card animation in the Issues tab:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Issues tab (ensure you're authenticated with GitHub first)

3. Click on any issue card to expand it and view the body content

4. Click again to collapse the card

## Features Implemented:

- ✅ Expanding/collapsing animation with smooth spring physics
- ✅ Body text revealed when expanded
- ✅ Visual indicator (chevron) that rotates when expanded
- ✅ Keyboard accessibility (Enter/Space keys)
- ✅ ARIA attributes for screen readers
- ✅ Respects user's motion preferences (prefers-reduced-motion)
- ✅ Selected issue highlighting preserved
- ✅ Works across all device sizes
- ✅ Comprehensive test coverage

## Animation Details:

- Uses Framer Motion's spring animation for natural feel
- Body content fades in with slight delay for better UX
- Layout animations ensure smooth height transitions
- Reduced motion support for accessibility compliance