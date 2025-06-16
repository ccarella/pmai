import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressiveForm } from '@/components/forms/ProgressiveForm';
import { FormStep } from '@/lib/types/form';
import { IssueFormData } from '@/lib/types/issue';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock FormProvider
const mockFormData: Partial<IssueFormData> = {
  type: 'feature',
  title: '',
  description: '',
};
const mockUpdateFormData = jest.fn();

jest.mock('@/components/providers/FormProvider', () => ({
  useFormContext: () => ({
    formData: mockFormData,
    updateFormData: mockUpdateFormData,
    resetForm: jest.fn(),
    isDataLoaded: true,
  }),
}));

// Mock IssuePreview component
jest.mock('@/components/preview/IssuePreview', () => ({
  IssuePreview: ({ onEdit, onSubmit }: any) => (
    <div>
      <h2>Preview</h2>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onSubmit}>Create Issue</button>
    </div>
  ),
}));

describe('ProgressiveForm', () => {
  const mockPush = jest.fn();
  
  const mockSteps: FormStep[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Provide basic details',
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          placeholder: 'Enter title',
          required: true,
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Enter description',
          required: true,
        },
      ],
      validation: z.object({
        title: z.string().min(10),
        description: z.string().min(50),
      }),
    },
    {
      id: 'context',
      title: 'Business Context',
      description: 'Explain the business value',
      fields: [
        {
          name: 'context.businessValue',
          label: 'Business Value',
          type: 'textarea',
          placeholder: 'Describe the business value',
          required: true,
        },
        {
          name: 'context.targetUsers',
          label: 'Target Users',
          type: 'text',
          placeholder: 'Who will benefit?',
          required: true,
        },
      ],
      validation: z.object({
        context: z.object({
          businessValue: z.string().min(1, 'Business value is required'),
          targetUsers: z.string().min(1, 'Target users is required'),
        }),
      }),
    },
    {
      id: 'preview',
      title: 'Preview & Generate',
      description: 'Review your issue',
      fields: [],
      validation: z.object({}),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders the current step', () => {
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={0}
      />
    );

    expect(screen.getByRole('heading', { name: 'Basic Information' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
  });

  it('renders preview step correctly', () => {
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={2} // Preview step
      />
    );

    expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Issue' })).toBeInTheDocument();
  });

  it('renders StepIndicator with correct props', () => {
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={0}
      />
    );

    const stepIndicator = screen.getByRole('navigation', { name: /Form progress/i });
    expect(stepIndicator).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /Basic Information/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Business Context/i })).toBeInTheDocument();
  });

  it.skip('navigates to next step when Next button is clicked with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={0}
      />
    );

    // Fill in the form fields
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test Issue Title with enough characters');
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test issue description that is long enough to meet the 50 character minimum validation requirement');

    // Click Next
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Should navigate to next step
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/create/feature/context');
    });
  });

  it('shows validation errors when trying to proceed with invalid data', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={0}
      />
    );

    // Try to click Next without filling required fields
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Should not navigate due to validation
    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('navigates back when Back button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={1} // Second step
      />
    );

    // Click Back
    await user.click(screen.getByRole('button', { name: /Back/i }));

    // Should navigate to previous step
    expect(mockPush).toHaveBeenCalledWith('/create/feature/basic');
  });

  it('allows navigation by clicking on step indicator', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={2} // On preview step
      />
    );

    // Click on first step in indicator
    await user.click(screen.getByRole('button', { name: /Basic Information/i }));

    // Should navigate to that step
    expect(mockPush).toHaveBeenCalledWith('/create/feature/basic');
  });

  it('does not show Back button on first step', () => {
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={0}
      />
    );

    const backButton = screen.queryByRole('button', { name: /Back/i });
    expect(backButton).not.toBeInTheDocument();
  });

  it('shows Submit button on last non-preview step', () => {
    render(
      <ProgressiveForm
        issueType="feature"
        steps={[mockSteps[0], mockSteps[1]]} // Without preview
        currentStep={1} // Last step
      />
    );

    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument();
  });

  it.skip('updates form data when navigating to next step', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={0}
      />
    );

    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test Title with more than ten characters');
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test Description that is long enough to meet the 50 character minimum validation requirement');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalledWith({
        title: 'Test Title with more than ten characters',
        description: 'Test Description that is long enough to meet the 50 character minimum validation requirement',
      });
    });
  });

  it('handles multiselect fields correctly', () => {
    const stepsWithMultiselect: FormStep[] = [{
      id: 'technical',
      title: 'Technical Details',
      description: 'Technical information',
      fields: [{
        name: 'technical.components',
        label: 'Components',
        type: 'multiselect',
        placeholder: 'Add components',
        required: true,
      }],
      validation: z.object({
        technical: z.object({
          components: z.array(z.string()).min(1),
        }),
      }),
    }];

    render(
      <ProgressiveForm
        issueType="feature"
        steps={stepsWithMultiselect}
        currentStep={0}
      />
    );

    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add components')).toBeInTheDocument();
  });

  it('handles preview step edit action', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={2} // Preview step
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    // Should navigate back to previous step
    expect(mockPush).toHaveBeenCalledWith('/create/feature/context');
  });

  it('restricts step navigation to completed steps only', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        issueType="feature"
        steps={mockSteps}
        currentStep={0} // First step
      />
    );

    // Try to click on a future step
    const contextStepButton = screen.getByRole('button', { name: /Business Context/i });
    await user.click(contextStepButton);

    // Should not navigate
    expect(mockPush).not.toHaveBeenCalled();
  });
});