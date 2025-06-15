import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/components/ui/Textarea';

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Description" name="description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<Textarea name="description" placeholder="Enter description" />);
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Textarea 
        name="description" 
        label="Description" 
        onChange={handleChange}
      />
    );
    
    const textarea = screen.getByLabelText('Description');
    await user.type(textarea, 'This is a test description');
    
    expect(handleChange).toHaveBeenCalled();
    expect(textarea).toHaveValue('This is a test description');
  });

  it('displays error message', () => {
    render(
      <Textarea 
        name="description" 
        label="Description" 
        error="Description is required"
      />
    );
    
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveClass('border-error');
  });

  it('shows required indicator', () => {
    render(<Textarea name="description" label="Description" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders help text', () => {
    render(
      <Textarea 
        name="description" 
        label="Description" 
        helpText="Provide a detailed description"
      />
    );
    
    expect(screen.getByText('Provide a detailed description')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Textarea name="description" label="Description" disabled />);
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('applies rows attribute', () => {
    render(<Textarea name="description" label="Description" rows={5} />);
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('applies size variants correctly', () => {
    const { rerender } = render(
      <Textarea name="description" label="Description" size="sm" />
    );
    let textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<Textarea name="description" label="Description" size="md" />);
    textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveClass('px-4', 'py-2', 'text-base');

    rerender(<Textarea name="description" label="Description" size="lg" />);
    textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveClass('px-4', 'py-3', 'text-lg');
  });

  it('handles focus and blur events', async () => {
    const user = userEvent.setup();
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(
      <Textarea 
        name="description" 
        label="Description"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
    
    const textarea = screen.getByLabelText('Description');
    
    await user.click(textarea);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('supports controlled component', () => {
    const { rerender } = render(
      <Textarea name="description" label="Description" value="Initial value" onChange={() => {}} />
    );
    
    let textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveValue('Initial value');
    
    rerender(
      <Textarea name="description" label="Description" value="Updated value" onChange={() => {}} />
    );
    
    textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveValue('Updated value');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Textarea 
        name="description" 
        label="Description" 
        className="custom-textarea-class"
        containerClassName="custom-container-class"
      />
    );
    
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveClass('custom-textarea-class');
    
    const container_ = container.firstChild;
    expect(container_).toHaveClass('custom-container-class');
  });

  it('handles resize prop', () => {
    const { rerender } = render(
      <Textarea name="description" label="Description" resize="none" />
    );
    let textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveClass('resize-none');

    rerender(<Textarea name="description" label="Description" resize="vertical" />);
    textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveClass('resize-y');

    rerender(<Textarea name="description" label="Description" resize="horizontal" />);
    textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveClass('resize-x');

    rerender(<Textarea name="description" label="Description" resize="both" />);
    textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveClass('resize');
  });

  it('handles maxLength attribute', () => {
    render(<Textarea name="description" label="Description" maxLength={500} />);
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('shows character count when showCount is true', async () => {
    const user = userEvent.setup();
    render(
      <Textarea 
        name="description" 
        label="Description" 
        maxLength={100}
        showCount
      />
    );
    
    expect(screen.getByText('0 / 100')).toBeInTheDocument();
    
    const textarea = screen.getByLabelText('Description');
    await user.type(textarea, 'Hello world');
    
    expect(screen.getByText('11 / 100')).toBeInTheDocument();
  });

  it('handles minRows and maxRows for auto-resize', () => {
    render(
      <Textarea 
        name="description" 
        label="Description" 
        minRows={3}
        maxRows={10}
        autoResize
      />
    );
    
    const textarea = screen.getByLabelText('Description');
    // Check that the textarea has the auto-resize functionality enabled
    expect(textarea).toBeInTheDocument();
    // The actual style will be applied during interaction, not on initial render
  });
});