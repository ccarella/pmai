import { z } from 'zod';

export const baseIssueSchema = z.object({
  type: z.enum(['feature', 'bug', 'epic', 'technical-debt']),
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(1000),
});

export const contextSchema = z.object({
  businessValue: z.string().min(20),
  targetUsers: z.string().min(10),
  successCriteria: z.string().optional(),
});

export const featureTechnicalSchema = z.object({
  components: z.array(z.string()).min(1),
});

export const bugTechnicalSchema = z.object({
  stepsToReproduce: z.string().min(20),
  expectedBehavior: z.string().min(10),
  actualBehavior: z.string().min(10),
});

export const epicTechnicalSchema = z.object({
  subFeatures: z.array(z.string()).min(1),
});

export const technicalDebtSchema = z.object({
  improvementAreas: z.array(z.string()).min(1),
});

export const implementationSchema = z.object({
  requirements: z.string().min(10),
  dependencies: z.array(z.string()),
  approach: z.string().min(10),
  affectedFiles: z.array(z.string()),
});

// Combined schemas for each issue type
export const featureFormSchema = z.object({
  ...baseIssueSchema.shape,
  context: contextSchema,
  technical: featureTechnicalSchema,
  implementation: implementationSchema,
});

export const bugFormSchema = z.object({
  ...baseIssueSchema.shape,
  context: contextSchema,
  technical: bugTechnicalSchema,
  implementation: implementationSchema,
});

export const epicFormSchema = z.object({
  ...baseIssueSchema.shape,
  context: contextSchema,
  technical: epicTechnicalSchema,
  implementation: implementationSchema,
});

export const technicalDebtFormSchema = z.object({
  ...baseIssueSchema.shape,
  context: contextSchema,
  technical: technicalDebtSchema,
  implementation: implementationSchema,
});

// Helper function to get the right schema based on issue type
export const getIssueSchema = (type: string) => {
  switch (type) {
    case 'feature':
      return featureFormSchema;
    case 'bug':
      return bugFormSchema;
    case 'epic':
      return epicFormSchema;
    case 'technical-debt':
      return technicalDebtFormSchema;
    default:
      throw new Error(`Invalid issue type: ${type}`);
  }
};