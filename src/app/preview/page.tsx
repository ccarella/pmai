'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PublishButton } from '@/components/PublishButton';
import { pageVariants } from '@/lib/animations/variants';

interface GeneratedIssue {
  original: string;
  markdown: string;
  claudePrompt: string;
  summary: {
    type: string;
    priority: string;
    estimatedEffort: string;
  };
}

export default function PreviewPage() {
  const router = useRouter();
  const [issue, setIssue] = useState<GeneratedIssue | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'markdown'>('markdown');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load the generated issue from localStorage
    const storedIssue = localStorage.getItem('created-issue');
    if (storedIssue) {
      try {
        setIssue(JSON.parse(storedIssue));
      } catch (error) {
        console.error('Failed to parse stored issue:', error);
        router.push('/create');
      }
    } else {
      // No issue data, redirect back to create
      router.push('/create');
    }
  }, [router]);

  const handleCopy = async () => {
    if (!issue) return;
    
    const textToCopy = activeTab === 'original' ? issue.original : issue.markdown;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    router.push('/create');
  };

  const extractTitle = (markdown: string): string => {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1] : 'Generated Issue';
  };

  if (!issue) {
    return (
      <motion.div 
        className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex items-center justify-center"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
          <p className="text-muted">Loading your issue...</p>
        </div>
      </motion.div>
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
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Issue Preview
        </h1>
        <p className="text-muted">
          Review your generated issue and make any adjustments
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-6"
      >
        {/* Summary Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Issue Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted">Type:</span>
              <div className="mt-1">
                <span className="inline-block px-2 py-1 bg-accent/20 text-accent rounded-md text-xs font-medium capitalize">
                  {issue.summary.type}
                </span>
              </div>
            </div>
            <div>
              <span className="font-medium text-muted">Priority:</span>
              <div className="mt-1">
                <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium capitalize ${
                  issue.summary.priority === 'high' 
                    ? 'bg-red-500/20 text-red-400' 
                    : issue.summary.priority === 'low'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {issue.summary.priority}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Preview Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Generated Content</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="p-2 rounded-md hover:bg-card-bg transition-colors duration-200 group"
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                )}
              </button>
              <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('original')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'original'
                    ? 'bg-accent text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground hover:bg-card-bg'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setActiveTab('markdown')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'markdown'
                    ? 'bg-accent text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground hover:bg-card-bg'
                }`}
              >
                GitHub Issue
              </button>
              </div>
            </div>
          </div>
          
          <div className="bg-input-bg border border-border rounded-md p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-card-bg">
            <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">
              {activeTab === 'original' ? issue.original : issue.markdown}
            </pre>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button variant="secondary" onClick={handleEdit}>
              Create New Issue
            </Button>
            <PublishButton
                title={extractTitle(issue.markdown)}
                body={issue.markdown}
                labels={[issue.summary.type]}
                onSuccess={(issueUrl) => {
                  console.log('Issue published:', issueUrl);
                }}
                onError={(error) => {
                  console.error('Failed to publish:', error);
                }}
              />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}