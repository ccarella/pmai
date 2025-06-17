'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { OnboardingFlow } from './OnboardingFlow';
import { OnboardingStatus } from '@/lib/services/onboarding';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialStatus?: OnboardingStatus;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialStatus,
}) => {
  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute -top-12 right-0 p-2 rounded-lg bg-card-bg/50 hover:bg-card-bg text-muted hover:text-foreground transition-colors"
                aria-label="Close onboarding"
              >
                <X className="w-5 h-5" />
              </button>
              
              <OnboardingFlow
                initialStatus={initialStatus}
                onComplete={handleComplete}
                onSkip={handleSkip}
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};