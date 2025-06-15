import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressiveForm } from '@/components/forms/ProgressiveForm';
import { FormStep } from '@/lib/types/form';
import { IssueFormData } from '@/lib/types/issue';
import { z } from 'zod';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the useFormPersistence hook
jest.mock('@/lib/hooks/useFormPersistence', () => ({
  useFormPersistence: jest.fn(),
}));

describe('ProgressiveForm', () => {
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
        title: z.string().min(1, 'Title is required'),
        description: z.string().min(1, 'Description is required'),
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
  ];

  const mockInitialData: Partial<IssueFormData> = {
    type: 'feature',
    title: '',
    description: '',
  };

  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first step by default', () => {
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
      />
    );

    // Check that the form step is rendered with the title as a heading
    expect(screen.getByRole('heading', { name: 'Basic Information' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
  });

  it('renders StepIndicator with correct props', () => {
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
      />
    );

    const stepIndicator = screen.getByRole('navigation', { name: /Form progress/i });
    expect(stepIndicator).toBeInTheDocument();
    
    // Check for step buttons instead of text to avoid duplicates
    expect(screen.getByRole('button', { name: /Basic Information/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Business Context/i })).toBeInTheDocument();
  });

  it('navigates to next step when Next button is clicked with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
      />
    );

    // Fill in the form fields
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test Issue Title');
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test issue description');

    // Click Next
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Should now be on step 2
    await waitFor(() => {
      expect(screen.getByLabelText('Business Value')).toBeInTheDocument();
      expect(screen.getByLabelText('Target Users')).toBeInTheDocument();
    });
  });

  it('shows validation errors when trying to proceed with invalid data', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
      />
    );

    // Try to click Next without filling required fields
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  it('navigates back to previous step when Back button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
      />
    );

    // Fill first step and go to next
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test Issue Title');
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test issue description');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Wait for second step
    await waitFor(() => {
      expect(screen.getByLabelText('Business Value')).toBeInTheDocument();
    });

    // Click Back
    await user.click(screen.getByRole('button', { name: /Back/i }));

    // Should be back on first step with data preserved
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Test Issue Title');
      expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('Test issue description');
    });
  });

  it('preserves form data when navigating between steps', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
      />
    );

    // Fill first step
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test Title');
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test Description');
    
    // Go to next step
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Fill second step
    await waitFor(() => screen.getByRole('textbox', { name: /business value/i }));
    await user.type(screen.getByRole('textbox', { name: /business value/i }), 'High value feature');
    
    // Go back
    await user.click(screen.getByRole('button', { name: /Back/i }));

    // Data should be preserved
    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toHaveValue('Test Title');
      expect(screen.getByLabelText('Description')).toHaveValue('Test Description');
    });

    // Go forward again
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Second step data should also be preserved
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /business value/i })).toHaveValue('High value feature');
    });
  });

  it('calls onSubmit when form is completed', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
      />
    );

    // Fill first step
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test Title');
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test Description');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Fill second step
    await waitFor(() => screen.getByRole('textbox', { name: /business value/i }));
    await user.type(screen.getByRole('textbox', { name: /business value/i }), 'High value');
    await user.type(screen.getByRole('textbox', { name: /target users/i }), 'All users');

    // Submit form
    await user.click(screen.getByRole('button', { name: /Submit/i }));

    // Should call onSubmit with all form data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        type: 'feature',
        title: 'Test Title',
        description: 'Test Description',
        context: {
          businessValue: 'High value',
          targetUsers: 'All users',
        },
      }));
    });
  });

  it('allows navigation by clicking on step indicator', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
      />
    );

    // Fill first step and go to next
    await user.type(screen.getByLabelText('Title'), 'Test Title');
    await user.type(screen.getByLabelText('Description'), 'Test Description');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Wait for second step
    await waitFor(() => screen.getByRole('heading', { name: 'Business Context' }));

    // Click on first step in indicator
    await user.click(screen.getByRole('button', { name: /Basic Information.*Completed/i }));

    // Should be back on first step
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    });
  });

  it('disables Back button on first step', () => {
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
      />
    );

    const backButton = screen.queryByRole('button', { name: /Back/i });
    expect(backButton).not.toBeInTheDocument();
  });

  it('shows Submit button on last step instead of Next', async () => {
    const user = userEvent.setup();
    
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={mockInitialData}
      />
    );

    // Fill first step and go to next
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test Title');
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test Description');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // On last step, should show Submit instead of Next
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument();
    });
  });

  it('initializes with provided initial data', () => {
    const initialDataWithValues: Partial<IssueFormData> = {
      type: 'bug',
      title: 'Initial Title',
      description: 'Initial Description',
    };

    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={mockOnSubmit}
        initialData={initialDataWithValues}
      />
    );

    expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Initial Title');
    expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('Initial Description');
  });

  it('handles loading state during form submission', async () => {
    const user = userEvent.setup();
    
    // Mock a slow submission
    const slowSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <ProgressiveForm
        steps={mockSteps}
        onSubmit={slowSubmit}
        initialData={mockInitialData}
      />
    );

    // Fill all steps
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test Title');
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test Description');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => screen.getByRole('textbox', { name: /business value/i }));
    await user.type(screen.getByRole('textbox', { name: /business value/i }), 'High value');
    await user.type(screen.getByRole('textbox', { name: /target users/i }), 'All users');

    // Submit form
    await user.click(screen.getByRole('button', { name: /Submit/i }));

    // Should show loading state
    expect(screen.getByRole('button', { name: /Submit/i })).toBeDisabled();

    // Wait for submission to complete
    await waitFor(() => {
      expect(slowSubmit).toHaveBeenCalled();
    });
  });
});