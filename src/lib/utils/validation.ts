import { z } from 'zod';

// Smart Prompt validation schema
export const smartPromptSchema = z.object({
  title: z.string().max(70, 'Title must be 70 characters or less').optional(),
  prompt: z.string().min(1, 'Prompt is required'),
});

// Validation for the two-field form
export const validateSmartPrompt = (data: { title?: string; prompt: string }) => {
  // If title is provided, validate it's between 5-70 chars
  if (data.title && (data.title.length < 5 || data.title.length > 70)) {
    throw new Error('Title must be between 5 and 70 characters');
  }
  
  // If no title provided, use first 60 chars of prompt as fallback
  const titleToUse = data.title?.trim() || data.prompt.slice(0, 60).trim();
  
  if (!titleToUse) {
    throw new Error('Title is required or prompt must be long enough to generate title');
  }
  
  if (!data.prompt.trim()) {
    throw new Error('Prompt is required');
  }
  
  return {
    title: titleToUse,
    prompt: data.prompt.trim(),
  };
};

// Legacy schemas (deprecated but kept for backwards compatibility)
export const baseIssueSchema = z.object({
  type: z.enum(['feature', 'bug', 'epic', 'technical-debt']),
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(1000),
});

export const contextSchema = z.object({
  businessValue: z.string().min(3),
  targetUsers: z.string().min(3),
  successCriteria: z.string().optional(),
});

export const implementationSchema = z.object({
  requirements: z.string().min(10),
  dependencies: z.array(z.string()),
  approach: z.string().min(10),
  affectedFiles: z.array(z.string()),
});