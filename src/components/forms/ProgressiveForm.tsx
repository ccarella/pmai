'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepIndicator } from './StepIndicator';
import { FormStep } from './FormStep';
import { FormStep as FormStepType } from '@/lib/types/form';
import { IssueFormData } from '@/lib/types/issue';
import { useFormPersistence } from '@/lib/hooks/useFormPersistence';

interface ProgressiveFormProps {
  steps: FormStepType[];
  onSubmit: (data: IssueFormData) => void | Promise<void>;
  initialData: Partial<IssueFormData>;
}

export const ProgressiveForm: React.FC<ProgressiveFormProps> = ({
  steps,
  onSubmit,
  initialData,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<IssueFormData>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save to localStorage
  useFormPersistence(formData);

  const handleNext = useCallback(async (stepData: Partial<IssueFormData>) => {
    // Update form data with current step data
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    // If this is the last step, submit the form
    if (currentStep === steps.length - 1) {
      setIsSubmitting(true);
      try {
        await onSubmit(updatedData as IssueFormData);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Move to next step
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, formData, onSubmit, steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const handleStepClick = useCallback((stepIndex: number) => {
    // Only allow navigation to previous steps or current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  }, [currentStep]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      <StepIndicator 
        steps={steps} 
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <FormStep
            step={steps[currentStep]}
            data={formData}
            onNext={handleNext}
            onBack={handleBack}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
            isSubmitting={isSubmitting}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};