'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { successCheck } from '@/lib/animations/variants';

interface OutputActionsProps {
  onEdit: () => void;
  onSubmit: () => void;
  onCopy: () => Promise<void>;
  copyLabel?: string;
  submitLabel?: string;
  editLabel?: string;
}

export const OutputActions: React.FC<OutputActionsProps> = ({
  onEdit,
  onSubmit,
  onCopy,
  copyLabel = 'Copy to Clipboard',
  submitLabel = 'Create Issue',
  editLabel = 'Edit',
}) => {
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit();
    setIsSubmitting(false);
  };

  return (
    <motion.div 
      className="flex justify-between mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button variant="secondary" onClick={onEdit}>
          {editLabel}
        </Button>
      </motion.div>
      <div className="space-x-3">
        <motion.div
          className="inline-block relative"
          animate={copied ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Button variant="secondary" onClick={handleCopy}>
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <motion.path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      variants={successCheck}
                      initial="initial"
                      animate="animate"
                    />
                  </svg>
                  Copied!
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {copyLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
          {copied && (
            <motion.div
              className="absolute inset-0 rounded-md pointer-events-none"
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                background: 'radial-gradient(circle, rgba(183, 148, 244, 0.3) 0%, transparent 70%)',
              }}
            />
          )}
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button onClick={handleSubmit} loading={isSubmitting}>
            {submitLabel}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};