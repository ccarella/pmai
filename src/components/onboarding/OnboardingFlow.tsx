'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OnboardingStatus, OnboardingStep, getOnboardingSteps } from '@/lib/services/onboarding';

interface OnboardingFlowProps {
  initialStatus?: OnboardingStatus;
  onComplete?: () => void;
  onSkip?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialStatus,
  onComplete,
  onSkip,
}) => {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(initialStatus || null);
  const [loading, setLoading] = useState(!initialStatus);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!initialStatus) {
      fetchOnboardingStatus();
    }
  }, [initialStatus]);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      onComplete?.();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleSkip = async () => {
    setCompleting(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });
      onSkip?.();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const steps = getOnboardingSteps(status);
  const allComplete = steps.every(step => step.completed);
  const currentStep = steps.find(step => !step.completed);

  return (
    <Card className="max-w-2xl mx-auto" padding="lg">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to PMAI!</h2>
          <p className="text-muted">
            Let&apos;s get you set up so you can start creating AI-optimized GitHub issues.
          </p>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <StepCard
                  step={step}
                  isActive={currentStep?.id === step.id}
                  onNavigate={() => router.push(step.href || '#')}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={completing}
            className="text-muted hover:text-foreground"
          >
            Skip for now
          </Button>

          {allComplete ? (
            <Button
              variant="primary"
              onClick={handleComplete}
              loading={completing}
              className="min-w-[120px]"
            >
              Get Started
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => router.push(currentStep?.href || '#')}
              className="min-w-[120px]"
            >
              Continue Setup
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

interface StepCardProps {
  step: OnboardingStep;
  isActive: boolean;
  onNavigate: () => void;
}

const StepCard: React.FC<StepCardProps> = ({ step, isActive, onNavigate }) => {
  return (
    <motion.div
      className={`
        relative p-4 rounded-lg border transition-all cursor-pointer
        ${step.completed 
          ? 'bg-success/10 border-success/30 hover:border-success/50' 
          : isActive
          ? 'bg-accent/10 border-accent/30 hover:border-accent/50'
          : 'bg-card-bg border-border hover:border-accent/30'
        }
      `}
      onClick={onNavigate}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full
          ${step.completed 
            ? 'bg-success text-foreground' 
            : isActive
            ? 'bg-accent text-foreground'
            : 'bg-muted/20 text-muted'
          }
        `}>
          {step.completed ? (
            <Check className="w-5 h-5" />
          ) : (
            <span className="text-sm font-medium">
              {step.id === 'github' ? '1' : step.id === 'repository' ? '2' : '3'}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-foreground mb-1">{step.title}</h3>
          <p className="text-sm text-muted">{step.description}</p>
        </div>

        <ChevronRight className={`
          w-5 h-5 transition-colors
          ${step.completed ? 'text-success' : 'text-muted'}
        `} />
      </div>
    </motion.div>
  );
};