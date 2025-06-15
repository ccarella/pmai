import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full space-y-8 text-center">
        <h1 className="text-5xl font-bold mb-4">
          GitHub Issue Generator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create comprehensive, AI-optimized GitHub issues for Claude Code
        </p>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Transform your product requirements into detailed, technically-sound GitHub issues
            that help AI coding assistants understand exactly what needs to be built.
          </p>
        </div>

        <div className="pt-8">
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600 px-6 py-3 text-lg"
          >
            Create New Issue
          </Link>
        </div>

        <div className="pt-16 text-sm text-gray-500">
          <p>Built with Next.js, React Hook Form, and Zod validation</p>
          <p className="mt-2">Optimized for TDD with comprehensive test coverage</p>
        </div>
      </main>
    </div>
  );
}