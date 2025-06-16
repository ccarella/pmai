'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';

interface SmartPromptFormProps {
  onSubmit: (data: { title: string; prompt: string }) => void;
  isSubmitting?: boolean;
}

interface FormData {
  title: string;
  prompt: string;
}

interface FormErrors {
  title?: string;
  prompt?: string;
}

export const SmartPromptForm: React.FC<SmartPromptFormProps> = ({
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    prompt: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation: 5-70 characters or use fallback from prompt
    const titleToUse = formData.title.trim() || formData.prompt.slice(0, 60).trim();
    if (!titleToUse) {
      newErrors.title = 'Title is required or will be generated from message';
    } else if (formData.title.trim() && (formData.title.trim().length < 5 || formData.title.trim().length > 70)) {
      newErrors.title = 'Title must be between 5 and 70 characters';
    }

    // Prompt validation: non-empty
    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Use title or fallback to first 60 chars of prompt
    const finalTitle = formData.title.trim() || formData.prompt.slice(0, 60).trim();
    
    onSubmit({
      title: finalTitle,
      prompt: formData.prompt.trim(),
    });
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Name <span className="text-muted">(optional)</span>
            </label>
            <Input
              id="title"
              type="text"
              placeholder="Short verb phrase, e.g. Fix image upload >5 MB"
              value={formData.title}
              onChange={handleInputChange('title')}
              className={errors.title ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
            <p className="mt-1 text-xs text-muted">
              If empty, we&apos;ll use the first 60 characters of your message
            </p>
          </div>

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-foreground mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="prompt"
              placeholder="As a &lt;type of user&gt;, I want &lt;capability&gt; so that &lt;business value&gt;."
              value={formData.prompt}
              onChange={handleInputChange('prompt')}
              className={`min-h-[120px] ${errors.prompt ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
            {errors.prompt && (
              <p className="mt-1 text-sm text-red-500">{errors.prompt}</p>
            )}
            <p className="mt-1 text-xs text-muted">
              Describe your issue, feature request, or user story in detail
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="px-8"
            >
              {isSubmitting ? 'Creating Issue...' : 'Create Issue'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
};