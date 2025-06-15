import { FormStep } from '@/lib/types/form';
import { IssueType, IssueFormData } from '@/lib/types/issue';
import {
  baseIssueSchema,
  contextSchema,
  featureTechnicalSchema,
  bugTechnicalSchema,
  epicTechnicalSchema,
  technicalDebtSchema,
  implementationSchema,
} from '@/lib/utils/validation';
import { z } from 'zod';

// Base steps that are common to all issue types
const getBaseSteps = (): FormStep[] => [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Provide a clear title and description for your issue',
    fields: [
      {
        name: 'title',
        label: 'Issue Title',
        type: 'text',
        placeholder: 'e.g., Add user authentication with social login',
        required: true,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Describe what you want to build or fix in detail...',
        required: true,
      },
    ],
    validation: z.object({
      title: baseIssueSchema.shape.title,
      description: baseIssueSchema.shape.description,
    }),
  },
  {
    id: 'context',
    title: 'Business Context',
    description: 'Help us understand the business value and target users',
    fields: [
      {
        name: 'context.businessValue',
        label: 'Business Value',
        type: 'textarea',
        placeholder: 'What business problem does this solve? What value does it provide?',
        required: true,
      },
      {
        name: 'context.targetUsers',
        label: 'Target Users',
        type: 'text',
        placeholder: 'Who will benefit from this? e.g., "Premium subscribers", "Admin users"',
        required: true,
      },
      {
        name: 'context.successCriteria',
        label: 'Success Criteria',
        type: 'textarea',
        placeholder: 'How will we know when this is successfully completed?',
        required: false,
      },
    ],
    validation: contextSchema,
  },
];

// Technical steps specific to each issue type
const featureTechnicalStep: FormStep = {
  id: 'technical',
  title: 'Technical Details',
  description: 'Specify the components affected by this feature',
  fields: [
    {
      name: 'technical.components',
      label: 'Affected Components',
      type: 'multiselect',
      placeholder: 'Enter component names (e.g., "UserProfile", "AuthService")',
      required: true,
    },
  ],
  validation: featureTechnicalSchema,
};

const bugTechnicalStep: FormStep = {
  id: 'technical',
  title: 'Bug Details',
  description: 'Help us understand and reproduce the issue',
  fields: [
    {
      name: 'technical.stepsToReproduce',
      label: 'Steps to Reproduce',
      type: 'textarea',
      placeholder: '1. Go to...\n2. Click on...\n3. See error...',
      required: true,
    },
    {
      name: 'technical.expectedBehavior',
      label: 'Expected Behavior',
      type: 'textarea',
      placeholder: 'What should happen?',
      required: true,
    },
    {
      name: 'technical.actualBehavior',
      label: 'Actual Behavior',
      type: 'textarea',
      placeholder: 'What actually happens?',
      required: true,
    },
  ],
  validation: bugTechnicalSchema,
};

const epicTechnicalStep: FormStep = {
  id: 'technical',
  title: 'Epic Breakdown',
  description: 'Break down this epic into smaller features',
  fields: [
    {
      name: 'technical.subFeatures',
      label: 'Sub-features',
      type: 'multiselect',
      placeholder: 'List the main features that make up this epic',
      required: true,
    },
  ],
  validation: epicTechnicalSchema,
};

const technicalDebtStep: FormStep = {
  id: 'technical',
  title: 'Improvement Areas',
  description: 'Identify what needs to be improved',
  fields: [
    {
      name: 'technical.improvementAreas',
      label: 'Areas to Improve',
      type: 'multiselect',
      placeholder: 'e.g., "Database query optimization", "Component refactoring"',
      required: true,
    },
  ],
  validation: technicalDebtSchema,
};

// Implementation step common to all types
const implementationStep: FormStep = {
  id: 'implementation',
  title: 'Implementation Details',
  description: 'Provide technical implementation guidance',
  fields: [
    {
      name: 'implementation.requirements',
      label: 'Technical Requirements',
      type: 'textarea',
      placeholder: 'List any technical requirements or constraints',
      required: true,
    },
    {
      name: 'implementation.dependencies',
      label: 'Dependencies',
      type: 'multiselect',
      placeholder: 'External libraries, APIs, or services needed',
      required: false,
    },
    {
      name: 'implementation.approach',
      label: 'Suggested Approach',
      type: 'textarea',
      placeholder: 'Describe how you think this should be implemented',
      required: true,
    },
    {
      name: 'implementation.affectedFiles',
      label: 'Affected Files',
      type: 'multiselect',
      placeholder: 'List files that will likely need changes',
      required: false,
    },
  ],
  validation: implementationSchema,
};

// Preview step (no validation needed)
const previewStep: FormStep = {
  id: 'preview',
  title: 'Preview & Generate',
  description: 'Review your issue and generate the final output',
  fields: [],
  validation: z.object({}),
};

// Get form steps based on issue type
export function getFormSteps(type: IssueType): FormStep[] {
  const baseSteps = getBaseSteps();
  
  switch (type) {
    case 'feature':
      return [...baseSteps, featureTechnicalStep, implementationStep, previewStep];
    case 'bug':
      return [...baseSteps, bugTechnicalStep, implementationStep, previewStep];
    case 'epic':
      return [...baseSteps, epicTechnicalStep, implementationStep, previewStep];
    case 'technical-debt':
      return [...baseSteps, technicalDebtStep, implementationStep, previewStep];
    default:
      throw new Error(`Invalid issue type: ${type}`);
  }
}

// Get step validation schema
export function getStepValidation(type: IssueType, stepId: string) {
  const steps = getFormSteps(type);
  const step = steps.find(s => s.id === stepId);
  return step?.validation || z.object({});
}

// Check if all required steps are complete
export function isFormComplete(type: IssueType, formData: Partial<IssueFormData>): boolean {
  const steps = getFormSteps(type);
  
  // Need to validate each step's specific data shape
  try {
    // Validate basic info
    const basicStep = steps.find(s => s.id === 'basic');
    if (basicStep) {
      basicStep.validation.parse({
        title: formData.title,
        description: formData.description,
      });
    }
    
    // Validate context
    const contextStep = steps.find(s => s.id === 'context');
    if (contextStep) {
      contextStep.validation.parse(formData.context);
    }
    
    // Validate technical based on type
    const technicalStep = steps.find(s => s.id === 'technical');
    if (technicalStep) {
      technicalStep.validation.parse(formData.technical);
    }
    
    // Validate implementation
    const implementationStep = steps.find(s => s.id === 'implementation');
    if (implementationStep) {
      implementationStep.validation.parse(formData.implementation);
    }
    
    return true;
  } catch {
    return false;
  }
}