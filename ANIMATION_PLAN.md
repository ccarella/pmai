# Animation Plan for GitHub Issue Generator

## Overview
This document outlines the comprehensive animation strategy for enhancing the user experience with smooth, purposeful animations throughout the application.

## Animation Principles
1. **Purpose-Driven**: Every animation should have a clear purpose (guide attention, provide feedback, enhance flow)
2. **Performance-First**: Keep animations smooth at 60fps, use GPU-accelerated transforms
3. **Consistent Timing**: Use consistent easing curves and durations across similar interactions
4. **Accessible**: Respect `prefers-reduced-motion` user preferences
5. **Subtle Enhancement**: Animations should enhance, not distract from the core functionality

## Animation Timing Standards
- **Micro-interactions**: 150-200ms (buttons, hovers)
- **UI Element Transitions**: 200-300ms (form fields, cards)
- **Page Transitions**: 300-400ms (route changes)
- **Stagger Delays**: 50-100ms between elements
- **Easing**: 
  - Default: `ease-out` (cubic-bezier(0, 0, 0.2, 1))
  - Bounce: `spring(1, 80, 10)`
  - Smooth: `ease-in-out`

## Implementation Plan

### 1. Global Animation Utilities
Create reusable animation variants and hooks:
- `src/lib/animations/variants.ts` - Shared animation variants
- `src/lib/animations/hooks.ts` - Animation hooks (useStagger, usePageTransition)
- `src/lib/animations/utils.ts` - Animation utilities

### 2. Page Transitions
- **Landing Page** (`/`):
  - Hero text: Fade up with slight scale
  - CTA buttons: Staggered entrance with spring
  - Background gradient: Subtle movement
  
- **Create Page** (`/create`):
  - Page title: Fade in from top
  - Issue type cards: Staggered scale-up entrance
  - Card hover: 3D tilt effect with shadow
  - Selection: Smooth scale and glow

- **Form Steps** (`/create/[type]/[step]`):
  - Step transition: Slide + fade between steps
  - Form fields: Staggered entrance from bottom
  - Error states: Shake animation with red pulse

### 3. Component Animations

#### Navigation & Progress
- **StepIndicator**:
  - Progress bar: Animated width expansion
  - Step dots: Scale up when active, pulse on complete
  - Checkmarks: Draw SVG path animation

#### Form Components
- **FormStep**:
  - Field entrance: Stagger with fade-up
  - Validation: Smooth error message slide-down
  - Loading: Skeleton pulse while AI enhances

- **Input/Textarea/MultiSelect**:
  - Focus: Subtle scale and shadow elevation
  - Error: Red pulse with shake
  - Success: Green checkmark fade-in

#### Cards & Buttons
- **Card**:
  - Hover: 3D tilt with perspective
  - Click: Scale down briefly
  - Selection: Glow effect with scale

- **Button**:
  - Hover: Subtle lift with shadow
  - Click: Scale down with ripple effect
  - Loading: Smooth spinner fade-in
  - Success: Checkmark morph animation

#### Preview Components
- **IssuePreview**:
  - Tab switch: Slide animation between views
  - Content reveal: Fade-in with slight scale
  - Copy action: Brief flash effect

### 4. Micro-interactions
- **Copy to Clipboard**: Brief scale + color flash
- **Form Submission**: Success ripple from button
- **AI Enhancement**: Pulsing glow during processing
- **Error Messages**: Attention-grabbing shake
- **Loading States**: Smooth skeleton animations

### 5. Special Effects
- **AI Enhancement Visualization**:
  - Thinking dots animation
  - Text streaming effect
  - Success sparkle burst

- **Route Transitions**:
  - Page-level fade with slight scale
  - Preserve scroll position
  - Loading bar at top

### 6. Accessibility Considerations
- Implement `prefers-reduced-motion` checks
- Provide animation toggle in settings
- Ensure animations don't interfere with screen readers
- Test with keyboard navigation

## Technical Implementation

### Framer Motion Patterns
```typescript
// Stagger children
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

// 3D card tilt
const cardVariants = {
  hover: {
    rotateY: 5,
    rotateX: 5,
    scale: 1.02,
    transition: { type: "spring", stiffness: 300 }
  }
}
```

### CSS Animation Utilities
```css
/* Attention pulse */
@keyframes attention-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Success checkmark */
@keyframes check-draw {
  to { stroke-dashoffset: 0; }
}

/* Error shake */
@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```

## Performance Guidelines
1. Use `transform` and `opacity` for animations (GPU-accelerated)
2. Avoid animating `width`, `height`, or `top/left` positioning
3. Use `will-change` sparingly for critical animations
4. Implement lazy loading for heavy animation components
5. Monitor performance with Chrome DevTools

## Testing Strategy
1. Visual regression tests for key animations
2. Performance benchmarks for complex animations
3. Accessibility testing with screen readers
4. Cross-browser animation compatibility
5. Mobile device performance testing

## Success Metrics
- All animations run at 60fps on modern devices
- Page transitions feel smooth and natural
- Micro-interactions provide clear feedback
- No accessibility regressions
- Positive user feedback on animation quality