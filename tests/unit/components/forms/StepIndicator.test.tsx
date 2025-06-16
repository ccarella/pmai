import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepIndicator } from '@/components/forms/StepIndicator';
import { FormStep } from '@/lib/types/form';

describe('StepIndicator', () => {
  const mockSteps: FormStep[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Provide basic details about your issue',
      fields: [],
      validation: {} as any
    },
    {
      id: 'context',
      title: 'Business Context',
      description: 'Explain the business value and target users',
      fields: [],
      validation: {} as any
    },
    {
      id: 'technical',
      title: 'Technical Details',
      description: 'Provide technical specifications',
      fields: [],
      validation: {} as any
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your issue before submitting',
      fields: [],
      validation: {} as any
    }
  ];

  it('renders all step titles', () => {
    render(<StepIndicator steps={mockSteps} currentStep={0} />);
    
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Business Context')).toBeInTheDocument();
    expect(screen.getByText('Technical Details')).toBeInTheDocument();
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
  });

  it('shows step numbers', () => {
    render(<StepIndicator steps={mockSteps} currentStep={0} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('highlights the current step', () => {
    render(<StepIndicator steps={mockSteps} currentStep={1} />);
    
    const currentStepElement = screen.getByTestId('step-1');
    expect(currentStepElement).toHaveClass('text-accent');
    expect(currentStepElement.querySelector('[data-testid="step-circle-1"]')).toHaveClass('bg-accent');
  });

  it('shows completed steps with checkmarks', () => {
    render(<StepIndicator steps={mockSteps} currentStep={2} />);
    
    // Steps 0 and 1 should be completed
    expect(screen.getByTestId('step-0-completed')).toBeInTheDocument();
    expect(screen.getByTestId('step-1-completed')).toBeInTheDocument();
    
    // Step 2 is current, step 3 is not completed
    expect(screen.queryByTestId('step-2-completed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step-3-completed')).not.toBeInTheDocument();
  });

  it('shows inactive future steps in gray', () => {
    render(<StepIndicator steps={mockSteps} currentStep={1} />);
    
    const futureStep = screen.getByTestId('step-2');
    expect(futureStep).toHaveClass('text-muted');
    
    const futureStepCircle = futureStep.querySelector('[data-testid="step-circle-2"]');
    expect(futureStepCircle).toHaveClass('bg-card-bg');
  });

  it('renders connecting lines between steps', () => {
    render(<StepIndicator steps={mockSteps} currentStep={1} />);
    
    // Should have 3 connecting lines for 4 steps
    const connectors = screen.getAllByTestId(/connector-\d+/);
    expect(connectors).toHaveLength(3);
  });

  it('shows completed connectors for completed steps', () => {
    render(<StepIndicator steps={mockSteps} currentStep={2} />);
    
    // Connectors 0 and 1 should be completed (they have the gradient div inside)
    expect(screen.getByTestId('connector-0')).toHaveClass('bg-gradient-to-r');
    expect(screen.getByTestId('connector-1')).toHaveClass('bg-gradient-to-r');
    
    // Connector 2 should not be completed (no gradient div shown)
    const connector2 = screen.getByTestId('connector-2');
    expect(connector2).toBeInTheDocument();
  });

  it('handles click events when onStepClick is provided', async () => {
    const user = userEvent.setup();
    const mockOnStepClick = jest.fn();
    
    render(
      <StepIndicator 
        steps={mockSteps} 
        currentStep={2} 
        onStepClick={mockOnStepClick}
      />
    );
    
    // Click on a completed step
    await user.click(screen.getByText('Basic Information'));
    expect(mockOnStepClick).toHaveBeenCalledWith(0);
    
    // Click on current step
    await user.click(screen.getByText('Technical Details'));
    expect(mockOnStepClick).toHaveBeenCalledWith(2);
  });

  it('disables clicks on future steps', async () => {
    const user = userEvent.setup();
    const mockOnStepClick = jest.fn();
    
    render(
      <StepIndicator 
        steps={mockSteps} 
        currentStep={1} 
        onStepClick={mockOnStepClick}
      />
    );
    
    // Try to click on a future step
    await user.click(screen.getByText('Review & Submit'));
    expect(mockOnStepClick).not.toHaveBeenCalled();
  });

  it('shows cursor pointer only for clickable steps', () => {
    render(
      <StepIndicator 
        steps={mockSteps} 
        currentStep={2} 
        onStepClick={jest.fn()}
      />
    );
    
    // Completed and current steps should have cursor pointer
    expect(screen.getByTestId('step-0')).toHaveClass('cursor-pointer');
    expect(screen.getByTestId('step-1')).toHaveClass('cursor-pointer');
    expect(screen.getByTestId('step-2')).toHaveClass('cursor-pointer');
    
    // Future step should not have cursor pointer
    expect(screen.getByTestId('step-3')).toHaveClass('cursor-not-allowed');
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    const mockOnStepClick = jest.fn();
    
    render(
      <StepIndicator 
        steps={mockSteps} 
        currentStep={2} 
        onStepClick={mockOnStepClick}
      />
    );
    
    // Tab to first step
    await user.tab();
    expect(screen.getByRole('button', { name: /Basic Information/i })).toHaveFocus();
    
    // Press Enter to select
    await user.keyboard('{Enter}');
    expect(mockOnStepClick).toHaveBeenCalledWith(0);
  });

  it('has proper ARIA labels', () => {
    render(<StepIndicator steps={mockSteps} currentStep={1} />);
    
    expect(screen.getByRole('navigation', { name: /Form progress/i })).toBeInTheDocument();
    
    // Current step should have aria-current
    const currentStepButton = screen.getByRole('button', { name: /Business Context.*Current step/i });
    expect(currentStepButton).toHaveAttribute('aria-current', 'step');
    
    // Completed step should have proper label
    expect(screen.getByRole('button', { name: /Basic Information.*Completed/i })).toBeInTheDocument();
    
    // Future step should be disabled
    const futureStepButton = screen.getByRole('button', { name: /Review & Submit.*Not available/i });
    expect(futureStepButton).toBeDisabled();
  });

  it('supports compact mode', () => {
    render(<StepIndicator steps={mockSteps} currentStep={1} compact />);
    
    // In compact mode, descriptions should not be shown
    expect(screen.queryByText('Provide basic details about your issue')).not.toBeInTheDocument();
    expect(screen.queryByText('Explain the business value and target users')).not.toBeInTheDocument();
  });

  it('can receive custom className', () => {
    const { container } = render(
      <StepIndicator steps={mockSteps} currentStep={0} className="custom-class" />
    );
    
    expect(container.querySelector('nav')).toHaveClass('custom-class');
  });
});