# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.3.3 application using the App Router, TypeScript, and Tailwind CSS v4. The application is a GitHub Issue Generator that helps create comprehensive, AI-optimized GitHub issues for AI coding assistants like Claude Code.

**Key Technologies:**
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with PostCSS
- **Database**: Upstash Redis (via Prisma adapter)
- **Authentication**: NextAuth.js v4 with GitHub OAuth
- **AI Integration**: OpenAI GPT-4 for content enhancement
- **PWA**: Progressive Web App with offline support

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run linting
npm run lint

# Generate encryption key for sensitive data
npm run generate-key
```

## Architecture

- **App Router**: All routes are defined in `src/app/` directory
- **Server Components**: Components are server-side by default. Use `"use client"` directive for client-side interactivity
- **Styling**: Tailwind CSS v4 with PostCSS. Global styles in `src/app/globals.css`
- **TypeScript**: Strict mode enabled with path alias `@/*` mapping to `src/*`
- **Form Management**: React Hook Form with Zod validation
- **State Management**: Context API for form persistence
- **Testing**: Jest with React Testing Library, Playwright for E2E
- **Database**: Upstash Redis with Prisma adapter for data persistence
- **Authentication**: NextAuth.js with GitHub OAuth provider
- **Middleware**: Authentication protection for sensitive routes
- **PWA**: Service worker with extensive caching strategies

## Code Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout with HTML structure and fonts
│   ├── page.tsx           # Home page (landing)
│   ├── globals.css        # Global styles and Tailwind directives
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth.js endpoints
│   │   ├── create-issue/ # Issue creation with AI
│   │   ├── enhance/      # AI content enhancement
│   │   ├── generate-*    # AI generation endpoints
│   │   ├── github/       # GitHub API integration
│   │   ├── onboarding/   # User onboarding endpoints
│   │   └── user/         # User profile management
│   ├── create/
│   │   ├── page.tsx      # Issue type selection
│   │   └── [type]/[step]/ # Dynamic form steps
│   ├── onboarding/       # Onboarding flow pages
│   ├── preview/          # Issue preview page
│   └── settings/         # User settings pages
├── components/
│   ├── forms/            # Form-related components
│   ├── ui/               # Reusable UI components
│   ├── preview/          # Issue preview components
│   ├── providers/        # Context providers
│   └── onboarding/       # Onboarding components
├── lib/
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Form steps configuration
│   ├── templates/       # Markdown/prompt templates
│   ├── utils/           # Utility functions
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── auth-config.ts   # NextAuth configuration
│   └── redis.ts         # Redis client setup
├── middleware.ts        # Route protection middleware
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   ├── e2e/            # E2E tests
│   └── __mocks__/      # Mock implementations
└── scripts/            # Utility scripts
```

## Design System

The application uses a modern, minimalist design with:
- **Color Scheme**: Standard Tailwind colors with blue accent
- **Typography**: Clean, readable fonts optimized for technical content
- **Components**: Consistent UI components from `src/components/ui/`
- **Responsive**: Mobile-first design approach
- **Accessibility**: ARIA labels and keyboard navigation support
- **Dark Mode**: System preference detection (future enhancement)

## Key Features

1. **Multi-step Form Wizard**: Progressive form with validation
2. **Issue Type Support**: Feature, Bug, Epic, Technical Debt
3. **AI Enhancement**: Integration for generating acceptance criteria
4. **Automatic Title Generation**: Intelligent title generation without manual interaction
   - AI-powered title generation using OpenAI's GPT-4
   - Fallback to text processing when AI is unavailable
   - Automatic detection and replacement of generic titles
   - Integration with both SmartPrompt form and GitHub publishing
5. **Form Persistence**: LocalStorage-based form data saving
6. **Markdown Generation**: Creates GitHub-ready issue content
7. **Claude Prompt Generation**: Optimized prompts for AI assistance
8. **GitHub Integration**: OAuth authentication and direct issue publishing
   - NextAuth.js v4 for GitHub OAuth (requires OAuth App, not GitHub App)
   - Repository selector with private repo support
   - Direct "Publish to GitHub" from preview page
   - Pull request status tracking and mergeability checks
   - Automatic title generation during GitHub issue creation
   - Upstash Redis for storing GitHub connection data
9. **User Onboarding**: Guided setup flow for new users
   - GitHub connection setup
   - Repository selection
   - Optional OpenAI API key configuration
   - Progress tracking and skip options
10. **Security Features**:
    - API key encryption using AES-256
    - Rate limiting for API endpoints
    - Cost protection with monthly limits
    - Secure token storage
11. **Progressive Web App (PWA)**:
    - Offline support with service worker
    - App manifest for installability
    - Extensive caching strategies
    - Custom offline page

## API Routes

### Authentication
- `/api/auth/[...nextauth]` - NextAuth.js authentication endpoints
- `/api/debug/github-auth` - Debug endpoint for GitHub authentication

### AI Features
- `/api/enhance` - Enhance issue content with AI
- `/api/generate-issue` - Generate complete issue content
- `/api/generate-title` - Generate issue titles automatically
- `/api/create-issue` - Create GitHub issues with AI enhancements

### GitHub Integration
- `/api/github/repositories` - List user's GitHub repositories
- `/api/github/selected-repo` - Manage selected repository
- `/api/github/added-repos` - Track user's added repositories
- `/api/github/issues` - Manage GitHub issues
- `/api/github/publish` - Publish issues to GitHub
- `/api/github/pr-status` - Check pull request status
- `/api/github/pr/merge` - Merge pull requests
- `/api/github/pr/mergeability` - Check if PR can be merged

### User Management
- `/api/user/openai-key` - Manage user's OpenAI API key
- `/api/user/openai-key/status` - Check OpenAI key validity
- `/api/user/openai-key/validate` - Validate OpenAI API key
- `/api/user/skip-review` - Toggle skip review preference
- `/api/user/usage-stats` - Track user usage statistics

### Onboarding
- `/api/onboarding/status` - Check onboarding progress
- `/api/onboarding/complete` - Mark onboarding as complete

## Testing Strategy

### Test Structure
- **Unit tests**: `tests/unit/` and `src/tests/unit/`
- **Integration tests**: `tests/integration/` and `src/tests/integration/`
- **E2E tests**: `tests/e2e/` (Playwright)
- **API route tests**: Alongside routes in `__tests__/` directories

### Testing Tools
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **Mock implementations**: Located in `tests/__mocks__/`

### Test Coverage
- Unit tests for all components and utilities
- Integration tests for API routes
- Form validation testing
- Accessibility testing with ARIA attributes
- Authentication flow testing
- AI feature testing with mocked responses

### Mock Files
- `@upstash/redis` - Redis client mock
- `lucide-react` - Icon library mock
- `next/server` - Next.js server utilities
- `octokit` - GitHub API client
- `openai` - OpenAI API client
- `react-markdown` - Markdown renderer

### Running Tests
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:e2e        # E2E tests
npm run test:e2e:ui     # E2E with UI
```

## Development Workflow

### Feature Development
1. Create a new branch from `main`: `git checkout -b feature/issue-number`
2. Write tests first (TDD approach)
3. Implement the feature following existing patterns
4. Run tests and linting: `npm test && npm run lint`
5. Fix any failures or linting issues
6. Commit with descriptive messages
7. Push branch and create pull request

### Pull Request Process
1. Create PR with clear description
2. Reference the original issue
3. Monitor Vercel preview deployment
4. Check GitHub Actions test results
5. Fix any CI/CD failures
6. Request review when all checks pass
7. Address review feedback
8. Merge after approval

### Code Style Guidelines
- Follow existing code patterns
- Use TypeScript strict mode
- Prefer functional components
- Use proper error handling
- Add appropriate logging
- Include unit tests for new code
- Update documentation as needed

## GitHub Integration Setup

**Important**: Use a GitHub **OAuth App**, not a GitHub App!

1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Configure:
   - Application name: Your app name
   - Homepage URL: Your app URL (e.g., `https://pmai.goodcrypto.xyz`)
   - Authorization callback URL: `{YOUR_URL}/api/auth/callback/github`
3. Set environment variables (see Environment Variables section)

## Environment Variables

### Required
- `GITHUB_CLIENT_ID` - GitHub OAuth App client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth App client secret
- `NEXTAUTH_SECRET` - Random string for session encryption
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token
- `ENCRYPTION_KEY` - 64-character hex key for encryption (generate with `npm run generate-key`)

### Optional
- `NEXTAUTH_URL` - Your app URL (auto-detected on Vercel)
- `OPENAI_API_KEY` - Global OpenAI API key (users can provide their own)
- `NEXT_PUBLIC_APP_URL` - Public app URL
- `DATABASE_URL` - Database URL for Prisma
- `REDIS_URL` - Redis connection URL

### Rate Limiting & Cost Protection
- `RATE_LIMIT_REQUESTS_PER_HOUR` - Max requests per hour (default: 20)
- `RATE_LIMIT_MAX_TOKENS_PER_REQUEST` - Max tokens per request (default: 2000)
- `MAX_MONTHLY_COST_USD` - Monthly cost limit in USD (default: 10)

### Legacy/Compatibility
- `KV_URL` - Legacy Upstash Redis URL
- `KV_REST_API_URL` - Legacy REST API URL
- `KV_REST_API_TOKEN` - Legacy REST API token
- `KV_REST_API_READ_ONLY_TOKEN` - Legacy read-only token

### Development
- `NODE_ENV` - Node environment (development/production)
- `CI` - CI environment flag

## Security Best Practices

1. **API Key Encryption**:
   - All user API keys are encrypted using AES-256
   - Generate encryption key: `npm run generate-key`
   - Never commit the encryption key to version control
   - Rotate encryption keys periodically

2. **Rate Limiting**:
   - Configure appropriate rate limits for production
   - Consider using Redis-based rate limiting for distributed systems
   - Monitor rate limit violations

3. **Authentication**:
   - Always use HTTPS in production
   - Configure strong session secrets
   - Implement proper logout functionality
   - Monitor authentication failures

4. **Cost Protection**:
   - Set reasonable monthly cost limits
   - Monitor API usage and costs
   - Implement user-level cost tracking
   - Alert on unusual usage patterns

## Custom Hooks

### Form & State Management
- `useFormPersistence` - Persist form data to localStorage
- `useOnboardingGuard` - Manage onboarding flow and redirects

### AI Features
- `useAIEnhancement` - Handle AI-powered content enhancement

### GitHub Integration
- `usePRStatuses` - Track pull request statuses

## Services

### AI Services
- `ai-enhancement.ts` - AI content enhancement logic
- `auto-title-generation.ts` - Automatic title generation

### User Management
- `onboarding.ts` - Onboarding flow management
- `user-storage.ts` - User profile and preferences

## Middleware Configuration

The application uses Next.js middleware (`src/middleware.ts`) for route protection:

### Protected Routes
- `/settings/openai` - Requires authentication
- `/api/user/*` - All user API endpoints

### Behavior
- Redirects unauthenticated users to home page for UI routes
- Returns 401 status for protected API routes
- Allows public access to all other routes

### Extending Middleware
To protect additional routes:
```typescript
// Add to protectedPaths array in middleware.ts
const protectedPaths = [
  '/settings/openai',
  '/api/user',
  '/your-new-protected-route'
]
```

## Troubleshooting

### Common Issues

1. **GitHub Authentication Fails**
   - Ensure you're using an OAuth App, not a GitHub App
   - Verify callback URL matches exactly
   - Check environment variables are set correctly
   - Use `/api/debug/github-auth` for debugging

2. **Redis Connection Errors**
   - Verify Upstash credentials are correct
   - Check if Redis instance is active
   - Ensure proper environment variables are set
   - Try both `UPSTASH_REDIS_*` and `KV_*` variables

3. **OpenAI API Issues**
   - Validate API key using `/api/user/openai-key/validate`
   - Check rate limits and usage
   - Ensure cost limits aren't exceeded
   - Verify key has proper permissions

4. **Build Failures**
   - Run `npm install` to ensure dependencies are installed
   - Check for TypeScript errors: `npm run build`
   - Clear `.next` cache: `rm -rf .next`
   - Verify all environment variables are set

5. **Test Failures**
   - Update snapshots if UI changed: `npm test -- -u`
   - Check mock implementations are up to date
   - Ensure test environment variables are set
   - Run specific test file: `npm test -- path/to/test`

6. **PWA Not Working**
   - Check if service worker is registered
   - Verify HTTPS is enabled (required for PWA)
   - Clear browser cache and service worker
   - Check manifest.json is accessible

### Debug Endpoints

- `/api/debug/github-auth` - Check GitHub auth configuration
- Browser DevTools → Application → Service Workers
- Browser DevTools → Application → Storage

### Logging

Enable debug logging by setting:
```bash
DEBUG=pmai:*
```

### Support

For issues not covered here:
1. Check existing GitHub issues
2. Review recent commits for changes
3. Create a new issue with reproduction steps