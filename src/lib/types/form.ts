import { z } from 'zod';
import { IssueFormData } from './issue';

export interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  validation: z.ZodSchema;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  placeholder?: string;
  required?: boolean;
  conditional?: (formData: IssueFormData) => boolean;
}