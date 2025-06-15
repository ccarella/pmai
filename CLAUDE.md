# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.3.3 application using the App Router, TypeScript, and Tailwind CSS v4.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

- **App Router**: All routes are defined in `src/app/` directory
- **Server Components**: Components are server-side by default. Use `"use client"` directive for client-side interactivity
- **Styling**: Tailwind CSS v4 with PostCSS. Global styles in `src/app/globals.css`
- **TypeScript**: Strict mode enabled with path alias `@/*` mapping to `src/*`

## Code Structure

```
src/app/
├── layout.tsx    # Root layout with HTML structure and fonts
├── page.tsx      # Home page component
└── globals.css   # Global styles and Tailwind directives
```

## Key Configuration

- **Turbopack**: Development server uses `--turbopack` flag for faster builds
- **Fonts**: Uses Geist Sans and Geist Mono from Google Fonts
- **Dark Mode**: Supported via CSS `prefers-color-scheme` media query

## Prompt
Think about how you will approach this, create a new github branch, write tests first, implement the feauture, run npm test, fix anything that does not pass, make a pull request on github, monitor the pull request for all tests passing, fix anything that goes wrong and when everything passes notify me that the PR is safe to merge.