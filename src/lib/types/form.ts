import { z } from 'zod';
import { IssueFormData } from './issue';

export interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validation: z.ZodType<any>;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  placeholder?: string;
  required?: boolean;
  conditional?: (formData: IssueFormData) => boolean;
}