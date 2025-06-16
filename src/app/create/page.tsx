'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SmartPromptForm } from '@/components/forms/SmartPromptForm';
import { pageVariants } from '@/lib/animations/variants';

export default function CreateIssuePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: { title: string; prompt: string }) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/create-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create issue');
      }

      const result = await response.json();
      
      // Store the result and navigate to preview
      localStorage.setItem('created-issue', JSON.stringify(result));
      router.push('/preview');
      
    } catch (error) {
      console.error('Error creating issue:', error);
      // Handle error - could show toast notification
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
        <SmartPromptForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </motion.div>
    </motion.div>
  );
}