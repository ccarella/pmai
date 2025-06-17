'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import Link from 'next/link';

interface AsyncJob {
  jobId: string;
  repository: string;
  createdAt: string;
}

interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    issueUrl: string;
    issueNumber: number;
    repository: string;
    title: string;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export default function ProcessingPage() {
  const router = useRouter();
  const [job, setJob] = useState<AsyncJob | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    // Get job info from localStorage
    const jobData = localStorage.getItem('async-job');
    if (!jobData) {
      router.push('/create');
      return;
    }

    const parsedJob = JSON.parse(jobData) as AsyncJob;
    setJob(parsedJob);
  }, [router]);

  useEffect(() => {
    if (!job || !isPolling) return;

    const pollJobStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${job.jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }

        const status = await response.json() as JobStatus;
        setJobStatus(status);
        setPollCount(prev => prev + 1);

        // Handle completion
        if (status.status === 'completed') {
          setIsPolling(false);
          showToast('Issue published successfully!', 'success');
          
          // Store result for success page
          localStorage.setItem('published-issue', JSON.stringify({
            issueUrl: status.result!.issueUrl,
            repository: status.result!.repository,
            title: status.result!.title,
          }));
          
          // Clean up async job data
          localStorage.removeItem('async-job');
          
          // Redirect to success page after a short delay
          setTimeout(() => {
            router.push('/create/success');
          }, 1500);
        }

        // Handle failure
        if (status.status === 'failed') {
          setIsPolling(false);
          showToast(status.error || 'Issue creation failed', 'error');
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        
        // Stop polling after too many attempts
        if (pollCount > 60) { // 5 minutes at 5-second intervals
          setIsPolling(false);
          showToast('Job status check timed out', 'error');
        }
      }
    };

    // Poll immediately
    pollJobStatus();

    // Set up polling interval
    const interval = setInterval(pollJobStatus, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [job, isPolling, pollCount, router]);

  const getStatusIcon = () => {
    if (!jobStatus) return null;

    switch (jobStatus.status) {
      case 'pending':
        return (
          <svg className="animate-pulse w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    if (!jobStatus) return 'Initializing...';

    switch (jobStatus.status) {
      case 'pending':
        return 'Waiting in queue...';
      case 'processing':
        return 'Creating and publishing your issue...';
      case 'completed':
        return 'Issue published successfully!';
      case 'failed':
        return 'Issue creation failed';
    }
  };

  if (!job) {
    return null;
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 max-w-2xl min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Creating Your Issue</h1>
        <p className="text-muted">
          Your issue is being created in the background. You can safely close this page.
        </p>
      </div>

      <Card className="p-8 mb-6">
        <div className="flex flex-col items-center space-y-6">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <span className="text-lg font-medium">{getStatusText()}</span>
          </div>

          {jobStatus && (
            <div className="w-full space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Status:</span>
                <span className="font-medium capitalize">{jobStatus.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Repository:</span>
                <span className="font-medium">{job.repository}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Job ID:</span>
                <span className="font-mono text-xs">{job.jobId}</span>
              </div>
            </div>
          )}

          {jobStatus?.status === 'failed' && jobStatus.error && (
            <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-red-600 dark:text-red-400 text-sm">
                Error: {jobStatus.error}
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-2 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Background Processing
        </h3>
        <p className="text-sm text-muted mb-3">
          Your issue is being created asynchronously. This means:
        </p>
        <ul className="list-disc list-inside text-sm text-muted space-y-1">
          <li>The process continues even if you close this page</li>
          <li>AI generation and GitHub publishing happen in the background</li>
          <li>You&apos;ll be notified when the issue is ready</li>
        </ul>
      </div>

      <div className="flex gap-4 justify-center">
        <Link href="/create">
          <Button variant="secondary">
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
  );
}