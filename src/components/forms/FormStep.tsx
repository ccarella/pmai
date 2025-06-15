'use client';

import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormStep as FormStepType, FormField } from '@/lib/types/form';
import { IssueFormData } from '@/lib/types/issue';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IssuePreview } from '@/components/preview/IssuePreview';

interface FormStepProps {
  step: FormStepType;
  data: Partial<IssueFormData>;
  onNext: (stepData: Partial<IssueFormData>) => void | Promise<void>;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
}

export const FormStep: React.FC<FormStepProps> = ({
  step,
  data,
  onNext,
  onBack,
  isFirstStep,
  isLastStep,
  isSubmitting: externalIsSubmitting = false,
}) => {
  // Get initial values for this step's fields
  const getInitialValues = () => {
    const values: Record<string, unknown> = {};
    step.fields.forEach(field => {
      const value = getNestedValue(data, field.name);
      // For multiselect fields, ensure we have an array
      if (field.type === 'multiselect') {
        values[field.name] = value || [];
      } else {
        values[field.name] = value ?? '';
      }
    });
    return values;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValidating },
    clearErrors,
    setValue,
    watch,
  } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(step.validation as any),
    defaultValues: getInitialValues(),
    mode: 'onTouched',
  });

  const onSubmit = useCallback(async (formData: Record<string, unknown>) => {
    // Convert flat form data to nested structure if needed
    const nestedData = convertToNestedData(formData);
    await onNext(nestedData);
  }, [onNext]);

  const renderField = (field: FormField) => {
    // Check if field should be shown based on conditional logic
    if (field.conditional && !field.conditional(data as IssueFormData)) {
      return null;
    }

    const error = getNestedError(errors, field.name) as { message?: string } | undefined;
    const fieldProps = {
      ...register(field.name),
      placeholder: field.placeholder,
      required: field.required,
      error: error?.message,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        register(field.name).onChange(e);
        // Clear error when user starts typing
        if (error) {
          clearErrors(field.name);
        }
      },
    };

    const label = (
      <label htmlFor={field.name} className="block text-sm font-medium text-foreground mb-1">
        {field.label} {field.required && <span className="text-error">*</span>}
      </label>
    );

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name}>
            {label}
            <Input id={field.name} type="text" {...fieldProps} />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name}>
            {label}
            <Textarea id={field.name} {...fieldProps} />
          </div>
        );

      case 'multiselect':
        const currentValue = watch(field.name) || [];
        return (
          <div key={field.name}>
            {label}
            <MultiSelect
              name={field.name}
              value={currentValue as string[]}
              onChange={(value) => {
                setValue(field.name, value);
                if (error) {
                  clearErrors(field.name);
                }
              }}
              placeholder={field.placeholder}
              error={error?.message}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.name}>
            {label}
            <select
              id={field.name}
              {...register(field.name)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-input-bg hover:border-accent/50 transition-all duration-200"
            >
              <option value="">Select an option</option>
              {/* Options would be passed in field config in real implementation */}
            </select>
            {error && <p className="mt-1 text-sm text-error">{error.message}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  const isLoading = isValidating || isSubmitting || externalIsSubmitting;

  // Special handling for preview step
  if (step.id === 'preview') {
    return (
      <IssuePreview
        formData={data}
        onEdit={onBack}
        onSubmit={() => onNext({})}
      />
    );
  }

  return (
    <Card className="mt-6">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        <p className="text-muted mb-6">{step.description}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step.fields.map(renderField)}

          <div className="flex justify-between pt-6">
            {!isFirstStep && (
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                disabled={isLoading}
              >
                Back
              </Button>
            )}

            <Button
              type="submit"
              variant="primary"
              className={isFirstStep ? 'ml-auto' : ''}
              disabled={isLoading}
              loading={isLoading}
            >
              {isLastStep ? 'Submit' : 'Next'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

// Helper function to get nested values from data object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  return keys.reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
}

// Helper function to get nested errors
function getNestedError(errors: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  return keys.reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], errors);
}

// Helper function to convert flat form data to nested structure
function convertToNestedData(formData: Record<string, unknown>): Partial<IssueFormData> {
  const result: Record<string, unknown> = {};

  Object.keys(formData).forEach(key => {
    const keys = key.split('.');
    let current = result;

    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        current[k] = formData[key];
      } else {
        if (!current[k]) {
          current[k] = {};
        }
        current = current[k] as Record<string, unknown>;
      }
    });
  });

  return result as Partial<IssueFormData>;
}