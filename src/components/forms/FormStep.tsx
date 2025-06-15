'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormStep as FormStepType, FormField } from '@/lib/types/form';
import { IssueFormData } from '@/lib/types/issue';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface FormStepProps {
  step: FormStepType;
  data: Partial<IssueFormData>;
  onNext: (stepData: any) => void | Promise<void>;
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
  isSubmitting = false,
}) => {
  const [isValidating, setIsValidating] = useState(false);

  // Get initial values for this step's fields
  const getInitialValues = () => {
    const values: any = {};
    step.fields.forEach(field => {
      const value = getNestedValue(data, field.name);
      values[field.name] = value ?? '';
    });
    return values;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm({
    resolver: zodResolver(step.validation),
    defaultValues: getInitialValues(),
    mode: 'onSubmit',
  });

  const onSubmit = useCallback(async (formData: any) => {
    setIsValidating(true);
    try {
      // Convert flat form data to nested structure if needed
      const nestedData = convertToNestedData(formData);
      await onNext(nestedData);
    } finally {
      setIsValidating(false);
    }
  }, [onNext]);

  const renderField = (field: FormField) => {
    // Check if field should be shown based on conditional logic
    if (field.conditional && !field.conditional(data as IssueFormData)) {
      return null;
    }

    const error = getNestedError(errors, field.name);
    const fieldProps = {
      ...register(field.name),
      placeholder: field.placeholder,
      required: field.required,
      error: error?.message,
      onChange: (e: any) => {
        register(field.name).onChange(e);
        // Clear error when user starts typing
        if (error) {
          clearErrors(field.name);
        }
      },
    };

    const label = (
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
    );

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name}>
            {label}
            <Input id={field.name} type="text" {...fieldProps} />
            {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name}>
            {label}
            <Textarea id={field.name} {...fieldProps} />
            {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name}>
            {label}
            <select
              id={field.name}
              {...register(field.name)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an option</option>
              {/* Options would be passed in field config in real implementation */}
            </select>
            {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  const isLoading = isValidating || isSubmitting;

  return (
    <Card className="mt-6">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        <p className="text-gray-600 mb-6">{step.description}</p>

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
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  return keys.reduce((acc, key) => acc?.[key], obj);
}

// Helper function to get nested errors
function getNestedError(errors: any, path: string): any {
  const keys = path.split('.');
  return keys.reduce((acc, key) => acc?.[key], errors);
}

// Helper function to convert flat form data to nested structure
function convertToNestedData(formData: any): any {
  const result: any = {};

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
        current = current[k];
      }
    });
  });

  return result;
}