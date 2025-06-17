# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.3.3 application using the App Router, TypeScript, and Tailwind CSS v4. The application is a GitHub Issue Generator that helps create comprehensive, AI-optimized GitHub issues for AI coding assistants like Claude Code.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run test
npm test

# Run linting
npm run lint

# Run tests
npm test
```

## Architecture

- **App Router**: All routes are defined in `src/app/` directory
- **Server Components**: Components are server-side by default. Use `"use client"` directive for client-side interactivity
- **Styling**: Tailwind CSS v4 with PostCSS. Global styles in `src/app/globals.css`
- **TypeScript**: Strict mode enabled with path alias `@/*` mapping to `src/*`
- **Form Management**: React Hook Form with Zod validation
- **State Management**: Context API for form persistence
- **Testing**: Jest with React Testing Library

## Code Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout with HTML structure and fonts
│   ├── page.tsx           # Home page (landing)
│   ├── globals.css        # Global styles and Tailwind directives
│   └── create/
│       ├── page.tsx       # Issue type selection
│       └── [type]/[step]/ # Dynamic form steps
├── components/
│   ├── forms/            # Form-related components
│   ├── ui/               # Reusable UI components
│   ├── preview/          # Issue preview components
│   └── providers/        # Context providers
├── lib/
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Form steps configuration
│   ├── templates/       # Markdown/prompt templates
│   ├── utils/           # Utility functions
│   ├── hooks/           # Custom React hooks
│   └── services/        # API services
└── tests/               # Test files
```

## Design System

**NOTE: There is an active PR (#8) implementing a Dracula theme redesign. The main branch currently uses the default color scheme.**

- **Current (main branch)**: Standard Tailwind colors (blue, gray, etc.)
- **Pending (PR #8)**: Dracula theme with purple accents and dark mode optimizations

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
   - Automatic title generation during GitHub issue creation
   - Upstash Redis for storing GitHub connection data

## Testing Strategy

- Unit tests for all components and utilities
- Integration tests for API routes
- Form validation testing
- Accessibility testing with ARIA attributes

## Development Workflow

1. Create a new branch for features
2. Write tests first (TDD approach)
3. Implement the feature
4. Run `npm test` and fix any failures
5. Create a pull request
6. Monitor PR for test results
7. Fix any issues that arise
8. Notify when PR is ready to merge

## GitHub Integration Setup

**Important**: Use a GitHub **OAuth App**, not a GitHub App!

1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Configure:
   - Application name: Your app name
   - Homepage URL: Your app URL (e.g., `https://pmai.goodcrypto.xyz`)
   - Authorization callback URL: `{YOUR_URL}/api/auth/callback/github`
3. Set environment variables:
   - `GITHUB_CLIENT_ID`: From OAuth App
   - `GITHUB_CLIENT_SECRET`: From OAuth App
   - `NEXTAUTH_SECRET`: Random string for session encryption
   - `NEXTAUTH_URL`: Your app URL (auto-detected on Vercel)
   - `UPSTASH_REDIS_REST_URL`: From Upstash console
   - `UPSTASH_REDIS_REST_TOKEN`: From Upstash console