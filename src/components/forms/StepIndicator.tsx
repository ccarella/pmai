'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FormStep } from '@/lib/types/form';
import { successCheck } from '@/lib/animations/variants';

interface StepIndicatorProps {
  steps: FormStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  compact?: boolean;
  className?: string;
}

const StepIndicatorComponent: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick,
  compact = false,
  className = ''
}) => {
  const isStepCompleted = (stepIndex: number) => stepIndex < currentStep;
  const isStepCurrent = (stepIndex: number) => stepIndex === currentStep;
  const isStepClickable = (stepIndex: number) => stepIndex <= currentStep && onStepClick;

  const handleStepClick = (stepIndex: number) => {
    if (isStepClickable(stepIndex)) {
      onStepClick!(stepIndex);
    }
  };

  const handleKeyDown = (stepIndex: number, e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isStepClickable(stepIndex)) {
      e.preventDefault();
      onStepClick!(stepIndex);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (isStepCompleted(stepIndex)) return 'completed';
    if (isStepCurrent(stepIndex)) return 'current';
    return 'future';
  };

  const getAriaLabel = (step: FormStep, stepIndex: number) => {
    const status = getStepStatus(stepIndex);
    if (status === 'completed') return `${step.title} - Completed`;
    if (status === 'current') return `${step.title} - Current step`;
    return `${step.title} - Not available`;
  };

  return (
    <nav 
      aria-label="Form progress" 
      className={`w-full ${className}`}
    >
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isClickable = isStepClickable(index);
          
          return (
            <motion.li 
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`
                flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}
                ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                ${status === 'completed' ? 'text-accent' : ''}
                ${status === 'current' ? 'text-accent' : ''}
                ${status === 'future' ? 'text-muted' : ''}
              `}
              data-testid={`step-${index}`}
            >
              <motion.button
                onClick={() => handleStepClick(index)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={status === 'future'}
                aria-label={getAriaLabel(step, index)}
                aria-current={status === 'current' ? 'step' : undefined}
                className={`
                  flex items-center relative
                  ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                  ${status === 'completed' ? 'text-accent' : ''}
                  ${status === 'current' ? 'text-accent' : ''}
                  ${status === 'future' ? 'text-muted' : ''}
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent rounded-lg
                `}
                whileHover={isClickable ? { scale: 1.05 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
              >
                {/* Step circle */}
                <div className="relative flex items-center">
                  <motion.div
                    data-testid={`step-circle-${index}`}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-colors duration-200
                      ${status === 'completed' ? 'bg-accent text-foreground' : ''}
                      ${status === 'current' ? 'bg-accent text-foreground' : ''}
                      ${status === 'future' ? 'bg-card-bg text-muted border-2 border-border' : ''}
                    `}
                    animate={status === 'current' ? {
                      boxShadow: ['0 0 0 0px rgba(183, 148, 244, 0.3)', '0 0 0 8px rgba(183, 148, 244, 0)']
                    } : {}}
                    transition={status === 'current' ? {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeOut'
                    } : {}}
                  >
                    {status === 'completed' ? (
                      <motion.svg 
                        data-testid={`step-${index}-completed`}
                        className="w-5 h-5" 
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
                      </motion.svg>
                    ) : (
                      <motion.span 
                        className="text-sm font-medium"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        {index + 1}
                      </motion.span>
                    )}
                  </motion.div>
                  
                  {/* Step text */}
                  <motion.div 
                    className="ml-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                  >
                    <p className={`text-sm font-medium ${!compact ? 'lg:text-base' : ''}`}>
                      {step.title}
                    </p>
                    {!compact && step.description && (
                      <p className="text-xs text-muted mt-0.5 hidden lg:block">
                        {step.description}
                      </p>
                    )}
                  </motion.div>
                </div>
              </motion.button>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-4 bg-border relative overflow-hidden">
                  <motion.div
                    data-testid={`connector-${index}`}
                    className="absolute inset-0 bg-gradient-to-r from-accent to-secondary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: index < currentStep ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.3, ease: 'easeOut' }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
};

export const StepIndicator = React.memo(StepIndicatorComponent);