import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-background to-card-bg">
      <main className="max-w-4xl w-full space-y-8 text-center">
        <div className="mb-6">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-accent to-secondary text-transparent bg-clip-text animate-pulse">
            GitHub Issue Generator
          </h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-accent to-secondary rounded-full"></div>
        </div>
        <p className="text-xl text-muted mb-8 font-light">
          Create comprehensive, AI-optimized GitHub issues for Claude Code
        </p>
        
        <div className="space-y-4">
          <p className="text-muted leading-relaxed">
            Transform your product requirements into detailed, technically-sound GitHub issues
            that help AI coding assistants understand exactly what needs to be built.
          </p>
        </div>

        <div className="pt-8">
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-accent text-foreground hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20 focus-visible:ring-accent px-8 py-4 text-lg shadow-md active:scale-[0.98]"
          >
            Create New Issue
          </Link>
        </div>

        <div className="pt-16 text-sm text-muted/70 space-y-2">
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            Built with Next.js, React Hook Form, and Zod validation
          </p>
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-info rounded-full animate-pulse"></span>
            Optimized for TDD with comprehensive test coverage
          </p>
        </div>
      </main>
    </div>
  );
}