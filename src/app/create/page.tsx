'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SmartPromptForm } from '@/components/forms/SmartPromptForm';
import { pageVariants } from '@/lib/animations/variants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useOnboardingGuard } from '@/lib/hooks/useOnboardingGuard';

export default function CreateIssuePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresApiKey, setRequiresApiKey] = useState(false);
  
  // Check onboarding status
  useOnboardingGuard();

  const handleSubmit = async (data: { title: string; prompt: string }) => {
    setIsSubmitting(true);
    setError(null);
    setRequiresApiKey(false);
    
    try {
      const response = await fetch('/api/create-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403 && result.requiresApiKey) {
          setRequiresApiKey(true);
          setError(result.message || 'OpenAI API key required');
          return;
        }
        throw new Error(result.error || 'Failed to create issue');
      }
      
      // Store the result and navigate to preview
      localStorage.setItem('created-issue', JSON.stringify(result));
      router.push('/preview');
      
    } catch (error) {
      console.error('Error creating issue:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Create New Issue
        </h1>
        <p className="text-muted">
          Generate comprehensive GitHub issues optimized for AI-assisted development
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {requiresApiKey && (
          <Card className="p-6 mb-6 bg-warning/10 border-warning/30">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-warning mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-warning mb-1">OpenAI API Key Required</h3>
                <p className="text-sm text-muted mb-3">
                  To use AI-powered issue generation, you need to configure your personal OpenAI API key.
                </p>
                <Link href="/settings/openai">
                  <Button variant="primary" size="sm">
                    Configure API Key
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
        
        {error && !requiresApiKey && (
          <Card className="p-4 mb-6 bg-error/10 border-error/30">
            <p className="text-error font-medium">Error: {error}</p>
          </Card>
        )}
        
        <SmartPromptForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </motion.div>
    </motion.div>
  );
}