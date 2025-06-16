import { IssueFormData } from '@/lib/types/issue';
import { getTemplate } from '@/lib/templates';

export const generateMarkdown = (data: IssueFormData): string => {
  return getTemplate(data);
};

export const sanitizeMarkdown = (markdown: string): string => {
  // Remove any potential XSS vectors while preserving markdown formatting
  return markdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

export const formatMarkdownForGitHub = (markdown: string): string => {
  // Ensure proper line breaks for GitHub
  return markdown
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple line breaks
    .trim();
};