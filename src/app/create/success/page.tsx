'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { pageVariants } from '@/lib/animations/variants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface PublishedIssue {
  issueUrl: string;
  repository: string;
  title: string;
}

export default function CreateSuccessPage() {
  const router = useRouter();
  const [publishedIssue, setPublishedIssue] = useState<PublishedIssue | null>(null);

  useEffect(() => {
    // Load published issue data from localStorage
    const stored = localStorage.getItem('published-issue');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPublishedIssue(data);
        // Clear the stored data
        localStorage.removeItem('published-issue');
      } catch (error) {
        console.error('Error parsing published issue data:', error);
        router.push('/create');
      }
    } else {
      // No data available, redirect to create page
      router.push('/create');
    }
  }, [router]);

  if (!publishedIssue) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 max-w-4xl min-h-screen"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Issue Published Successfully!
        </h1>
        <p className="text-muted">
          Your issue has been created on GitHub
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted mb-1">Title</h3>
              <p className="text-foreground">{publishedIssue.title}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted mb-1">Repository</h3>
              <p className="text-foreground font-mono text-sm">{publishedIssue.repository}</p>
            </div>

            <div className="pt-4 border-t border-border">
              <a
                href={publishedIssue.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:text-accent-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                View Issue on GitHub
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/create">
            <Button variant="primary">
              Create Another Issue
            </Button>
          </Link>
          
          <Link href="/issues">
            <Button variant="secondary">
              View All Issues
            </Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}