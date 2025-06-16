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

interface TitleSuggestion {
  title: string;
  alternatives?: string[];
  isGenerated: boolean;
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
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion | null>(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [titleGenerationError, setTitleGenerationError] = useState<string | null>(null);

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

    // Hide suggestions when user manually edits title
    if (field === 'title' && showTitleSuggestions) {
      setShowTitleSuggestions(false);
    }

    // Clear title generation error when user edits prompt
    if (field === 'prompt' && titleGenerationError) {
      setTitleGenerationError(null);
    }
  };

  const generateTitle = async () => {
    if (!formData.prompt.trim() || formData.prompt.length < 10) {
      setErrors(prev => ({ ...prev, prompt: 'Please enter a more detailed message to generate a title' }));
      return;
    }

    setIsGeneratingTitle(true);
    setTitleGenerationError(null);
    
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: formData.prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 429) {
          throw new Error(errorData?.error || 'Rate limit exceeded. Please try again later.');
        }
        throw new Error(errorData?.error || 'Failed to generate title');
      }

      const result: TitleSuggestion = await response.json();
      
      // Check if there was a warning from the API (e.g., cost limit reached)
      if ('warning' in result) {
        setTitleGenerationError(result.warning as string);
      }
      
      setTitleSuggestions(result);
      setShowTitleSuggestions(true);
      
      // Auto-populate the main title suggestion
      setFormData(prev => ({
        ...prev,
        title: result.title,
      }));
      
    } catch (error) {
      console.error('Title generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate title';
      setTitleGenerationError(errorMessage);
      
      // Fallback to first 60 characters of prompt
      const fallbackTitle = formData.prompt.slice(0, 60).trim();
      setFormData(prev => ({
        ...prev,
        title: fallbackTitle,
      }));
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const selectTitleSuggestion = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
    }));
    setShowTitleSuggestions(false);
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
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="title" className="block text-sm font-medium text-foreground">
                Name <span className="text-muted">(optional)</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateTitle}
                disabled={isSubmitting || isGeneratingTitle || !formData.prompt.trim()}
                loading={isGeneratingTitle}
                className="text-xs"
              >
                {isGeneratingTitle ? 'Generating...' : 'Generate Title'}
              </Button>
            </div>
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
            
            {/* Title Generation Error */}
            {titleGenerationError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{titleGenerationError}</p>
              </div>
            )}
            
            {/* Title Suggestions */}
            {showTitleSuggestions && titleSuggestions && titleSuggestions.alternatives && titleSuggestions.alternatives.length > 0 && (
              <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                <p className="text-xs text-muted mb-2">Alternative suggestions:</p>
                <div className="flex flex-wrap gap-1">
                  {titleSuggestions.alternatives.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectTitleSuggestion(suggestion)}
                      className="text-xs px-2 py-1 bg-background border rounded hover:bg-accent text-foreground transition-colors"
                      disabled={isSubmitting}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <p className="mt-1 text-xs text-muted">
              {formData.prompt.trim().length >= 10 
                ? 'Click "Generate Title" for AI suggestions, or leave empty to use the first 60 characters of your message'
                : 'Enter a detailed message above to enable AI title generation'
              }
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