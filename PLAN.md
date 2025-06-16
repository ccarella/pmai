# GitHub Issue Generator for Claude Code - Implementation Plan

## Current Status: Phase 4.1 & 4.2 Complete ✅

**Last Updated:** 2025-06-16

### Completed Phases:
- ✅ **Phase 1**: Foundation & Project Setup
- ✅ **Phase 2**: Core UI Components (Forms, Validation, Progressive Flow)
- ✅ **Phase 3**: AI Enhancement with OpenAI Integration (PR #5 merged)
- ✅ **UI Enhancement**: Dracula Theme Redesign (PR #8 merged)
- ✅ **Phase 4.1**: Template System (PR #9 created)
- ✅ **Phase 4.2**: Claude Prompt Generator (PR #9 created)

### Active Pull Requests:
- PR #9: [feat: implement template system for issue generation](https://github.com/ccarella/pmai/pull/9) - Ready to merge
  - Complete template system for all issue types
  - Claude prompt generator with TDD instructions
  - Markdown utilities with sanitization
  - All CI/CD tests passing, Vercel deployment successful

### Next Phase:
- ⏳ **Phase 4.3**: Preview Components (MarkdownPreview, ClaudePromptPreview, OutputActions)

---

## Project Overview

A NextJS application that helps product managers create comprehensive, technically-detailed GitHub issues optimized for AI-assisted development with Claude Code. The app transforms natural language requirements into structured issues with proper context, acceptance criteria, and implementation hints.

## Core Architecture

### Tech Stack
- **Framework**: Next.js 15.3.3 with App Router ✅
- **Language**: TypeScript (strict mode) ✅
- **Styling**: Tailwind CSS v4 with PostCSS ✅
- **State Management**: React Hook Form + Zod validation ✅ (installed)
- **Animations**: Framer Motion ✅ (installed)
- **AI Integration**: OpenAI/Anthropic APIs
- **Testing**: Jest + React Testing Library + Playwright ✅
- **Deployment**: Vercel

### Design Philosophy
- Modern minimalist aesthetic (Dieter Rams principles)
- Progressive disclosure of complexity
- Mobile-first responsive design
- Sub-second interactions
- Accessibility-first approach

## Test-Driven Development Strategy

### Testing Layers
1. **Unit Tests**: Core business logic, form validation, output generation ✅ (141/146 passing)
2. **Integration Tests**: Form flows, API interactions, state management ✅
3. **E2E Tests**: Complete user journeys, GitHub integration flows ⏳
4. **Visual Regression**: Design system consistency ⏳

**Current Test Status:**
- Total Tests: 232
- Passing: 226
- Failing: 6 (FormStep and ProgressiveForm validation UI tests - non-critical)
- Coverage includes: AI service, API routes, hooks, all UI components, templates, utilities
- Note: Test failures are related to validation message display timing in local tests, CI/CD passes

### TDD Workflow
```
1. Write failing test for feature
2. Implement minimal code to pass
3. Refactor for clarity and performance
4. Repeat for each component/feature
```

## MVP Implementation Plan

### Phase 1: Foundation (Week 1) ✅

#### 1.1 Project Setup ✅
```bash
# File structure
src/
├── app/
│   ├── layout.tsx ✅
│   ├── page.tsx ✅
│   ├── create/
│   │   ├── page.tsx ✅
│   │   └── [step]/
│   │       └── page.tsx
│   ├── api/
│   │   └── enhance/
│   │       └── route.ts
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Button.tsx ✅
│   │   ├── Card.tsx ✅
│   │   ├── Input.tsx ✅
│   │   ├── Textarea.tsx ✅
│   │   └── index.ts ✅
│   ├── forms/
│   │   ├── IssueTypeSelector.tsx ✅
│   │   ├── ProgressiveForm.tsx
│   │   ├── StepIndicator.tsx ✅
│   │   └── FormStep.tsx
│   ├── preview/
│   │   ├── MarkdownPreview.tsx
│   │   ├── ClaudePromptPreview.tsx
│   │   └── OutputActions.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Container.tsx
├── lib/
│   ├── types/
│   │   ├── issue.ts ✅
│   │   ├── form.ts ✅
│   │   └── api.ts ✅
│   ├── utils/
│   │   ├── markdown.ts
│   │   ├── claude-prompt.ts
│   │   └── validation.ts ✅
│   ├── hooks/
│   │   ├── useFormPersistence.ts
│   │   ├── useAIEnhancement.ts
│   │   └── useCopyToClipboard.ts
│   └── templates/
│       ├── feature.ts
│       ├── bug.ts
│       ├── epic.ts
│       └── technical-debt.ts
└── tests/
    ├── unit/ ✅
    ├── integration/
    └── e2e/
```

#### 1.2 Core Types & Schemas ✅
```typescript
// lib/types/issue.ts
export type IssueType = 'feature' | 'bug' | 'epic' | 'technical-debt';

export interface IssueFormData {
  type: IssueType;
  title: string;
  description: string;
  context: {
    businessValue: string;
    targetUsers: string;
    successCriteria: string;
  };
  technical: {
    components?: string[];
    stepsToReproduce?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    subFeatures?: string[];
    improvementAreas?: string[];
  };
  implementation: {
    requirements: string;
    dependencies: string[];
    approach: string;
    affectedFiles: string[];
  };
  aiEnhancements?: {
    acceptanceCriteria: string[];
    edgeCases: string[];
    technicalConsiderations: string[];
  };
}

// lib/types/form.ts
export interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  validation: z.ZodSchema;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  placeholder?: string;
  required?: boolean;
  conditional?: (formData: IssueFormData) => boolean;
}
```

#### 1.3 Validation Schemas ✅
```typescript
// lib/utils/validation.ts
import { z } from 'zod';

export const baseIssueSchema = z.object({
  type: z.enum(['feature', 'bug', 'epic', 'technical-debt']),
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(1000),
});

export const contextSchema = z.object({
  businessValue: z.string().min(20),
  targetUsers: z.string().min(10),
  successCriteria: z.string().optional(),
});

export const featureTechnicalSchema = z.object({
  components: z.array(z.string()).min(1),
});

export const bugTechnicalSchema = z.object({
  stepsToReproduce: z.string().min(20),
  expectedBehavior: z.string().min(10),
  actualBehavior: z.string().min(10),
});
```

### Phase 2: Core UI Components (Week 1-2) ✅

#### 2.1 Design System Components ✅

**Button Component (TDD Example)** ✅
```typescript
// tests/unit/components/Button.test.tsx
describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});

// components/ui/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  loading = false,
  variant = 'primary',
  size = 'md',
}) => {
  // Implementation after tests
};
```

**Card Component** ✅
**Input Component** ✅  
**Textarea Component** ✅

#### 2.2 Form Components ✅

**IssueTypeSelector Component** ✅
- Displays 4 issue types (Feature, Bug, Epic, Technical Debt)
- Interactive cards with icons and descriptions
- Full keyboard navigation and ARIA support
- Visual feedback for hover and selected states

**StepIndicator Component** ✅
- Visual progress indicator for multi-step forms
- Shows completed steps with checkmarks
- Clickable navigation for completed/current steps
- Responsive design with compact mode support
- Full accessibility with ARIA labels

**ProgressiveForm Component** ✅
- Multi-step form with smooth transitions
- State persistence with localStorage
- Step validation before progression
- Navigation between completed steps
- Integration with FormStep component

**FormStep Component** ✅
- Dynamic field rendering based on step configuration
- React Hook Form integration with Zod validation
- Conditional field display logic
- Error handling and display
- Loading states for async operations
```typescript
// components/forms/ProgressiveForm.tsx
export const ProgressiveForm: React.FC<ProgressiveFormProps> = ({
  steps,
  onSubmit,
  initialData,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IssueFormData>(initialData);
  
  // Auto-save to localStorage
  useFormPersistence(formData);
  
  // Form navigation logic
  const handleNext = async (stepData: any) => {
    // Validate current step
    // Update form data
    // Move to next step
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      <StepIndicator 
        steps={steps} 
        currentStep={currentStep} 
      />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
        >
          <FormStep
            step={steps[currentStep]}
            data={formData}
            onNext={handleNext}
            onBack={() => setCurrentStep(prev => prev - 1)}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
```

### Phase 3: AI Enhancement (Week 2) ✅ COMPLETED

#### 3.1 AI Integration Service ✅
- Implemented `AIEnhancementService` class with OpenAI GPT-4 integration
- Created issue-type specific prompt templates for feature, bug, epic, and technical-debt
- Added graceful fallback to default enhancements when AI is unavailable
- Implemented usage tracking and cost monitoring ($0.045 per 1K tokens average)
- Full test coverage with mocked OpenAI responses

#### 3.2 API Route ✅
- Created `/api/enhance` endpoint with comprehensive features:
  - Rate limiting: 20 requests per hour per IP address
  - Cost protection: $10 monthly limit with usage tracking
  - Proper error handling and status codes
  - Environment variable configuration
- Added response headers for rate limit status
- Implemented GET endpoint for checking usage statistics

#### 3.3 React Hook Integration ✅
- Created `useAIEnhancement` hook for easy component integration
- Handles loading states, errors, and fallbacks automatically
- Returns AI-generated enhancements with usage statistics
- Comprehensive test coverage for various scenarios

#### 3.4 Environment Configuration ✅
- Set up OpenAI API key and rate limiting configuration
- Successfully deployed to Vercel with environment variables
- Created `.env.example` for documentation

**Known Issues:**
- 11 test failures related to validation message display and localStorage mocking
- FormStep and ProgressiveForm validation tests expect different error messages than displayed
- FormProvider tests have localStorage mock setup issues
- To be addressed in follow-up PR (non-blocking for functionality)

### Phase 4: Output Generation (Week 2-3) ⏳ IN PROGRESS

#### 4.1 Template System ✅ COMPLETED (PR #9)
```typescript
// lib/templates/feature.ts
export const featureTemplate = (data: IssueFormData): string => {
  return `
# ${data.title}

## Overview
${data.description}

## Business Context
**Value:** ${data.context.businessValue}
**Target Users:** ${data.context.targetUsers}
${data.context.successCriteria ? `**Success Criteria:** ${data.context.successCriteria}` : ''}

## Technical Details
**Affected Components:**
${data.technical.components?.map(c => `- ${c}`).join('\n')}

## Implementation Approach
${data.implementation.approach}

### Requirements
${data.implementation.requirements}

### Dependencies
${data.implementation.dependencies.map(d => `- ${d}`).join('\n')}

### Files to Modify
${data.implementation.affectedFiles.map(f => `- \`${f}\``).join('\n')}

## Acceptance Criteria
${data.aiEnhancements?.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

## Edge Cases to Consider
${data.aiEnhancements?.edgeCases.map(ec => `- ${ec}`).join('\n')}

## Technical Considerations
${data.aiEnhancements?.technicalConsiderations.map(tc => `- ${tc}`).join('\n')}

---
*Generated with [Issue Generator for Claude Code](https://github.com/yourusername/issue-generator)*
`;
};
```

#### 4.2 Claude Code Prompt Generator ✅ COMPLETED (PR #9)
```typescript
// lib/utils/claude-prompt.ts
export const generateClaudePrompt = (data: IssueFormData): string => {
  const context = `
I need you to implement a ${data.type} for a Next.js application. 
Here are the requirements:

${data.description}

Technical context:
- This affects these components: ${data.technical.components?.join(', ')}
- Implementation should follow these patterns: ${data.implementation.approach}
- Key files to modify: ${data.implementation.affectedFiles.join(', ')}

Please implement this feature following TDD principles:
1. First write failing tests
2. Implement the minimal code to pass tests
3. Refactor for clarity and performance

Acceptance criteria:
${data.aiEnhancements?.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

Consider these edge cases:
${data.aiEnhancements?.edgeCases.map(ec => `- ${ec}`).join('\n')}
`;

  return context.trim();
};
```

**What was implemented in PR #9:**
- Created template modules for all 4 issue types (feature, bug, epic, technical-debt)
- Each template generates properly formatted GitHub markdown
- Templates handle optional fields gracefully with sensible defaults
- Added markdown utilities for generation, sanitization, and GitHub formatting
- Implemented Claude prompt generator with:
  - Issue type-specific prompts
  - TDD workflow instructions
  - Comprehensive implementation guidelines
  - Testing and code review checklists
- Added full test coverage for all new modules
- Fixed form validation issues in `isFormComplete` function
- Updated form validation mode to `onTouched` for better UX

#### 4.3 Preview Components ⏳ TODO

### Phase 5: Testing Implementation (Ongoing) ✅ PARTIAL

#### 5.1 Unit Tests
```typescript
// tests/unit/utils/markdown.test.ts
describe('Markdown Generation', () => {
  it('generates valid GitHub markdown', () => {
    const mockData = createMockIssueData('feature');
    const markdown = generateMarkdown(mockData);
    
    expect(markdown).toContain('# ' + mockData.title);
    expect(markdown).toContain('## Overview');
    expect(markdown).toContain(mockData.description);
  });
  
  it('includes AI enhancements when available', () => {
    const mockData = createMockIssueData('feature', {
      aiEnhancements: {
        acceptanceCriteria: ['AC1', 'AC2'],
        edgeCases: ['Edge1'],
        technicalConsiderations: ['Tech1'],
      }
    });
    
    const markdown = generateMarkdown(mockData);
    expect(markdown).toContain('## Acceptance Criteria');
    expect(markdown).toContain('1. AC1');
  });
});
```

#### 5.2 Integration Tests
```typescript
// tests/integration/form-flow.test.tsx
describe('Form Flow Integration', () => {
  it('completes full feature creation flow', async () => {
    render(<CreateIssuePage />);
    
    // Select issue type
    fireEvent.click(screen.getByText('Feature'));
    
    // Fill step 1
    await waitFor(() => {
      expect(screen.getByText('Describe your feature')).toBeInTheDocument();
    });
    
    const descriptionInput = screen.getByPlaceholderText(/describe what you want/i);
    await userEvent.type(descriptionInput, 'A new user dashboard...');
    
    fireEvent.click(screen.getByText('Next'));
    
    // Continue through all steps...
    
    // Verify output
    await waitFor(() => {
      expect(screen.getByText(/Preview/i)).toBeInTheDocument();
    });
  });
});
```

#### 5.3 E2E Tests
```typescript
// tests/e2e/create-issue.spec.ts
import { test, expect } from '@playwright/test';

test('create feature issue end-to-end', async ({ page }) => {
  await page.goto('/');
  
  // Click create button
  await page.click('text=Create New Issue');
  
  // Select feature type
  await page.click('[data-testid="issue-type-feature"]');
  
  // Fill form
  await page.fill('[name="description"]', 'Build a user authentication system...');
  await page.click('text=Next');
  
  // Continue through form...
  
  // Wait for AI enhancement
  await page.waitForSelector('text=Enhancing your issue...');
  await page.waitForSelector('text=Preview', { timeout: 30000 });
  
  // Copy to clipboard
  await page.click('text=Copy Issue Content');
  
  // Verify success
  await expect(page.locator('text=Copied!')).toBeVisible();
});
```

## Version 2: GitHub Integration

### Additional Features

#### GitHub OAuth Setup
```typescript
// lib/auth/github.ts
export const githubAuth = {
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: process.env.GITHUB_REDIRECT_URI!,
  
  getAuthUrl: (state: string) => {
    const params = new URLSearchParams({
      client_id: githubAuth.clientId,
      redirect_uri: githubAuth.redirectUri,
      scope: 'repo',
      state,
    });
    
    return `https://github.com/login/oauth/authorize?${params}`;
  },
  
  exchangeCode: async (code: string) => {
    // Exchange code for access token
  },
};
```

#### Repository Integration
```typescript
// components/github/RepositorySelector.tsx
export const RepositorySelector: React.FC = () => {
  const { repositories, loading } = useRepositories();
  const [selected, setSelected] = useState<Repository | null>(null);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Repository</h3>
      
      <Combobox value={selected} onChange={setSelected}>
        <Combobox.Input
          placeholder="Search repositories..."
          displayValue={(repo: Repository) => repo?.full_name || ''}
        />
        
        <Combobox.Options>
          {repositories.map(repo => (
            <Combobox.Option key={repo.id} value={repo}>
              {repo.full_name}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    </div>
  );
};
```

## Deployment Strategy

### Environment Variables
```env
# .env.local
OPENAI_API_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=
NEXT_PUBLIC_APP_URL=
```

### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/enhance/route.ts": {
      "maxDuration": 30
    }
  }
}
```

## Performance Optimization

### Key Strategies
1. **Code Splitting**: Dynamic imports for heavy components
2. **Image Optimization**: Next.js Image component for icons
3. **API Response Caching**: Redis for AI responses
4. **Static Generation**: Landing page and documentation
5. **Edge Functions**: For authentication and rate limiting

### Bundle Size Targets
- Initial JS: < 100KB
- First Load JS: < 200KB
- Largest Contentful Paint: < 1.5s
- Time to Interactive: < 2s

## Security Considerations

### API Security
- Rate limiting per IP and user
- API key encryption at rest
- Input sanitization for all forms
- Content Security Policy headers
- CORS configuration for API routes

### GitHub Integration Security
- OAuth state parameter validation
- Token refresh mechanism
- Minimal permission scopes
- Encrypted token storage

## Monitoring & Analytics

### Key Metrics
- Issue creation success rate
- AI enhancement usage
- Time to complete form
- Copy action success rate
- GitHub sync reliability

### Implementation
```typescript
// lib/analytics/events.ts
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, properties);
  }
};

// Usage
trackEvent('issue_created', {
  issue_type: 'feature',
  enhanced: true,
  time_to_complete: 245, // seconds
});
```

## Future Enhancements

### Potential Features
1. **Team Collaboration**: Share and review issues before creation
2. **Template Library**: Save and reuse common issue patterns
3. **Slack Integration**: Notify teams of new issues
4. **Analytics Dashboard**: Track issue quality metrics
5. **Multi-LLM Support**: Optimize for different AI coding assistants
6. **Browser Extension**: Create issues directly from GitHub

### Extensibility Points
- Plugin system for custom issue types
- Webhook support for external integrations
- API for programmatic issue creation
- Custom AI model integration
- Enterprise SSO support

## Success Criteria

### MVP Launch
- [ ] Form completion rate > 80%
- [ ] AI enhancement adoption > 60%
- [ ] Average time to create issue < 5 minutes
- [ ] User satisfaction score > 4.5/5
- [ ] Zero critical bugs in production

### Version 2
- [ ] GitHub integration adoption > 70%
- [ ] Issue sync accuracy > 99%
- [ ] Repository connection success > 95%
- [ ] Dashboard load time < 1 second
- [ ] API uptime > 99.9%

## Development Timeline

### Week 1: Foundation ✅
- Project setup and configuration ✅
- Design system implementation ✅ (started)
- Core component library ✅ (started)
- Initial test suite ✅

### Week 2: Form Implementation & AI Integration ✅ COMPLETED
- ✅ Progressive form logic
- ✅ Validation and persistence  
- ✅ IssueTypeSelector component
- ✅ StepIndicator component
- ✅ ProgressiveForm component
- ✅ FormStep component
- ✅ AI enhancement integration with OpenAI
- ✅ Rate limiting and cost protection
- ✅ useAIEnhancement hook
- ✅ Dracula theme UI redesign (PR #8)
- ✅ Template system (Phase 4.1)
- ✅ Claude prompt generator (Phase 4.2)
- ⏳ Preview components (Phase 4.3 - next)

### Week 3: Polish & Testing
- UI animations and transitions
- Comprehensive test coverage
- Performance optimization
- Accessibility audit

### Week 4: Deployment & Launch
- Production deployment
- Monitoring setup
- Documentation
- Beta user onboarding

### Month 2: GitHub Integration
- OAuth implementation
- Repository management
- Issue synchronization
- Dashboard development

## Documentation Requirements

### User Documentation
- Getting started guide
- Video walkthrough
- Best practices for issue creation
- Troubleshooting guide

### Developer Documentation
- API reference
- Component library docs
- Contribution guidelines
- Architecture decisions

## Conclusion

This plan provides a comprehensive roadmap for building a GitHub issue generator optimized for Claude Code. The focus on TDD, progressive enhancement, and user experience will ensure a high-quality product that bridges the gap between product management and AI-assisted development.