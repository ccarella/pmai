'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FormProvider } from '@/components/providers/FormProvider';
import { ProgressiveForm } from '@/components/forms/ProgressiveForm';
import { getFormSteps } from '@/lib/config/form-steps';
import { IssueType } from '@/lib/types/issue';

const validIssueTypes = ['feature', 'bug', 'epic', 'technical-debt'];

export default function FormStepPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;
  const step = params.step as string;

  useEffect(() => {
    // Validate issue type
    if (!validIssueTypes.includes(type)) {
      router.push('/create');
    }
  }, [type, router]);

  const formSteps = getFormSteps(type as IssueType);
  const currentStepIndex = formSteps.findIndex(s => s.id === step);

  if (currentStepIndex === -1) {
    // Invalid step, redirect to first step
    router.push(`/create/${type}/${formSteps[0].id}`);
    return null;
  }

  return (
    <FormProvider>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ProgressiveForm
          issueType={type as IssueType}
          steps={formSteps}
          currentStep={currentStepIndex}
        />
      </div>
    </FormProvider>
  );
}