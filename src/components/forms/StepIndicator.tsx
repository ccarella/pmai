'use client';

import React from 'react';
import { FormStep } from '@/lib/types/form';

interface StepIndicatorProps {
  steps: FormStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  compact?: boolean;
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
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
            <li 
              key={step.id} 
              className={`
                flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}
                ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                ${status === 'completed' ? 'text-blue-600' : ''}
                ${status === 'current' ? 'text-blue-600' : ''}
                ${status === 'future' ? 'text-gray-400' : ''}
              `}
              data-testid={`step-${index}`}
            >
              <button
                onClick={() => handleStepClick(index)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={status === 'future'}
                aria-label={getAriaLabel(step, index)}
                aria-current={status === 'current' ? 'step' : undefined}
                className={`
                  flex items-center relative
                  ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                  ${status === 'completed' ? 'text-blue-600' : ''}
                  ${status === 'current' ? 'text-blue-600' : ''}
                  ${status === 'future' ? 'text-gray-400' : ''}
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg
                `}
              >
                {/* Step circle */}
                <div className="relative flex items-center">
                  <div
                    data-testid={`step-circle-${index}`}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-colors duration-200
                      ${status === 'completed' ? 'bg-blue-600 text-white' : ''}
                      ${status === 'current' ? 'bg-blue-600 text-white' : ''}
                      ${status === 'future' ? 'bg-gray-200 text-gray-500' : ''}
                    `}
                  >
                    {status === 'completed' ? (
                      <svg 
                        data-testid={`step-${index}-completed`}
                        className="w-5 h-5" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step text */}
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${!compact ? 'lg:text-base' : ''}`}>
                      {step.title}
                    </p>
                    {!compact && step.description && (
                      <p className="text-xs text-gray-500 mt-0.5 hidden lg:block">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div 
                  data-testid={`connector-${index}`}
                  className={`
                    flex-1 h-1 mx-4 transition-colors duration-200
                    ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};