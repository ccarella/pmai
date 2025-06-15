import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormStep } from '@/components/forms/FormStep';
import { FormStep as FormStepType } from '@/lib/types/form';
import { IssueFormData } from '@/lib/types/issue';
import { z } from 'zod';

describe('FormStep', () => {
  const mockStep: FormStepType = {
    id: 'test-step',
    title: 'Test Step',
    description: 'This is a test step',
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
      {
        name: 'priority',
        label: 'Priority',
        type: 'select',
        required: false,
      },
    ],
    validation: z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().min(1, 'Description is required'),
      priority: z.string().optional(),
    }),
  };

  const mockData: Partial<IssueFormData> = {
    type: 'feature',
    title: '',
    description: '',
  };

  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders step title and description', () => {
    render(
      <FormStep
        step={mockStep}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    expect(screen.getByText('Test Step')).toBeInTheDocument();
    expect(screen.getByText('This is a test step')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(
      <FormStep
        step={mockStep}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    // Check for form inputs by their id
    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /priority/i })).toBeInTheDocument();
  });

  it('renders correct input types for each field', () => {
    render(
      <FormStep
        step={mockStep}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    expect(titleInput.tagName).toBe('INPUT');
    expect(titleInput).toHaveAttribute('type', 'text');

    const descriptionInput = screen.getByRole('textbox', { name: /description/i });
    expect(descriptionInput.tagName).toBe('TEXTAREA');

    const prioritySelect = screen.getByRole('combobox', { name: /priority/i });
    expect(prioritySelect.tagName).toBe('SELECT');
  });

  it('displays required indicators for required fields', () => {
    render(
      <FormStep
        step={mockStep}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    // Check for asterisks within the label elements
    const titleLabel = screen.getByText(/title/i).closest('label');
    expect(titleLabel).toHaveTextContent('Title *');
    
    const descLabel = screen.getByText(/description/i).closest('label');
    expect(descLabel).toHaveTextContent('Description *');
    
    // Optional field should not have asterisk
    const priorityLabel = screen.getByText(/priority/i).closest('label');
    expect(priorityLabel).toHaveTextContent('Priority');
    expect(priorityLabel).not.toHaveTextContent('*');
  });

  it('initializes fields with existing data', () => {
    const dataWithValues: Partial<IssueFormData> = {
      type: 'feature',
      title: 'Existing Title',
      description: 'Existing Description',
    };

    render(
      <FormStep
        step={mockStep}
        data={dataWithValues}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue('Existing Title');
    expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('Existing Description');
  });

  it('validates form on submit with invalid data', async () => {
    const user = userEvent.setup();

    render(
      <FormStep
        step={mockStep}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Wait a bit for validation to trigger
    await waitFor(() => {
      // onNext should not be called due to validation failure
      expect(mockOnNext).not.toHaveBeenCalled();
    });

    // Check if error messages are present
    const titleError = await screen.findByText('Title is required');
    expect(titleError).toBeInTheDocument();
  });

  it('calls onNext with form data when validation passes', async () => {
    const user = userEvent.setup();

    render(
      <FormStep
        step={mockStep}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    // Fill in the form
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test Title');
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test Description');

    // Submit
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Should call onNext with the form data
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith({
        title: 'Test Title',
        description: 'Test Description',
        priority: '',
      });
    });
  });

  it('calls onBack when Back button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <FormStep
        step={mockStep}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /Back/i }));

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('does not render Back button on first step', () => {
    render(
      <FormStep
        step={mockStep}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={true}
        isLastStep={false}
      />
    );

    expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument();
  });

  it('renders Submit button instead of Next on last step', () => {
    render(
      <FormStep
        step={mockStep}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={true}
      />
    );

    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument();
  });

  it('handles conditional fields', () => {
    const stepWithConditionalField: FormStepType = {
      ...mockStep,
      fields: [
        ...mockStep.fields,
        {
          name: 'bugDetails',
          label: 'Bug Details',
          type: 'textarea',
          required: true,
          conditional: (data: IssueFormData) => data.type === 'bug',
        },
      ],
    };

    // Render with feature type - conditional field should not show
    const { rerender } = render(
      <FormStep
        step={stepWithConditionalField}
        data={{ ...mockData, type: 'feature' }}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    expect(screen.queryByRole('textbox', { name: /bug details/i })).not.toBeInTheDocument();

    // Rerender with bug type - conditional field should show
    rerender(
      <FormStep
        step={stepWithConditionalField}
        data={{ ...mockData, type: 'bug' }}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    expect(screen.getByRole('textbox', { name: /bug details/i })).toBeInTheDocument();
  });

  it('handles nested field names correctly', async () => {
    const user = userEvent.setup();

    const stepWithNestedFields: FormStepType = {
      ...mockStep,
      fields: [
        {
          name: 'context.businessValue',
          label: 'Business Value',
          type: 'textarea',
          required: true,
        },
        {
          name: 'context.targetUsers',
          label: 'Target Users',
          type: 'text',
          required: true,
        },
      ],
      validation: z.object({
        context: z.object({
          businessValue: z.string().min(1),
          targetUsers: z.string().min(1),
        }),
      }),
    };

    render(
      <FormStep
        step={stepWithNestedFields}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
      />
    );

    // Fill nested fields
    await user.type(screen.getByRole('textbox', { name: /business value/i }), 'High value');
    await user.type(screen.getByRole('textbox', { name: /target users/i }), 'All users');

    // Submit
    await user.click(screen.getByRole('button', { name: /Next/i }));

    // Should call onNext with nested data structure
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledWith({
        context: {
          businessValue: 'High value',
          targetUsers: 'All users',
        },
      });
    });
  });

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();

    render(
      <FormStep
        step={mockStep}
        data={mockData}
        onNext={mockOnNext}
        onBack={mockOnBack}
        isFirstStep={false}
        isLastStep={false}
        isSubmitting={true}
      />
    );

    // Buttons should be disabled when isSubmitting is true
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Back/i })).toBeDisabled();
  });

});