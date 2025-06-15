'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StepIndicator } from './StepIndicator';
import { FormStep } from './FormStep';
import { FormStep as FormStepType } from '@/lib/types/form';
import { IssueFormData, IssueType } from '@/lib/types/issue';
import { useFormContext } from '@/components/providers/FormProvider';

interface ProgressiveFormProps {
  issueType: IssueType;
  steps: FormStepType[];
  currentStep: number;
}

export const ProgressiveForm: React.FC<ProgressiveFormProps> = ({
  issueType,
  steps,
  currentStep,
}) => {
  const router = useRouter();
  const { formData, updateFormData } = useFormContext();

  const handleNext = useCallback(async (stepData: Partial<IssueFormData>) => {
    // Update form data with current step data
    updateFormData(stepData);

    // If this is the preview step, don't navigate
    if (steps[currentStep].id === 'preview') {
      return;
    }

    // Navigate to next step
    const nextStep = steps[currentStep + 1];
    if (nextStep) {
      router.push(`/create/${issueType}/${nextStep.id}`);
    }
  }, [currentStep, issueType, router, steps, updateFormData]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = steps[currentStep - 1];
      router.push(`/create/${issueType}/${prevStep.id}`);
    }
  }, [currentStep, issueType, router, steps]);

  const handleStepClick = useCallback((stepIndex: number) => {
    // Only allow navigation to previous steps or current step
    if (stepIndex <= currentStep) {
      const targetStep = steps[stepIndex];
      router.push(`/create/${issueType}/${targetStep.id}`);
    }
  }, [currentStep, issueType, router, steps]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <StepIndicator 
          steps={steps} 
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 100, opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -100, opacity: 0, scale: 0.95 }}
          transition={{ 
            duration: 0.3,
            ease: [0.645, 0.045, 0.355, 1.0]
          }}
        >
          <FormStep
            step={steps[currentStep]}
            data={formData}
            onNext={handleNext}
            onBack={handleBack}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
            isSubmitting={false}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};