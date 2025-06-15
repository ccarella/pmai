import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email Address" name="email" />);
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<Input name="email" placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Input 
        name="email" 
        label="Email" 
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText('Email');
    await user.type(input, 'test@example.com');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test@example.com');
  });

  it('displays error message', () => {
    render(
      <Input 
        name="email" 
        label="Email" 
        error="Email is required"
      />
    );
    
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('border-error');
  });

  it('shows required indicator', () => {
    render(<Input name="email" label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders help text', () => {
    render(
      <Input 
        name="email" 
        label="Email" 
        helpText="We'll never share your email"
      />
    );
    
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Input name="email" label="Email" disabled />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('supports different input types', () => {
    const { rerender } = render(
      <Input name="password" label="Password" type="password" />
    );
    let input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    rerender(<Input name="email" label="Email" type="email" />);
    input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input name="tel" label="Phone" type="tel" />);
    input = screen.getByLabelText('Phone');
    expect(input).toHaveAttribute('type', 'tel');
  });

  it('applies size variants correctly', () => {
    const { rerender } = render(
      <Input name="email" label="Email" size="sm" />
    );
    let input = screen.getByLabelText('Email');
    expect(input).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<Input name="email" label="Email" size="md" />);
    input = screen.getByLabelText('Email');
    expect(input).toHaveClass('px-4', 'py-2', 'text-base');

    rerender(<Input name="email" label="Email" size="lg" />);
    input = screen.getByLabelText('Email');
    expect(input).toHaveClass('px-4', 'py-3', 'text-lg');
  });

  it('renders with icon', () => {
    const icon = <svg data-testid="icon" />;
    render(
      <Input 
        name="search" 
        label="Search" 
        icon={icon}
      />
    );
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('handles focus and blur events', async () => {
    const user = userEvent.setup();
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(
      <Input 
        name="email" 
        label="Email"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
    
    const input = screen.getByLabelText('Email');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('supports controlled component', () => {
    const { rerender } = render(
      <Input name="email" label="Email" value="initial@example.com" onChange={() => {}} />
    );
    
    let input = screen.getByLabelText('Email');
    expect(input).toHaveValue('initial@example.com');
    
    rerender(
      <Input name="email" label="Email" value="updated@example.com" onChange={() => {}} />
    );
    
    input = screen.getByLabelText('Email');
    expect(input).toHaveValue('updated@example.com');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Input 
        name="email" 
        label="Email" 
        className="custom-input-class"
        containerClassName="custom-container-class"
      />
    );
    
    const input = screen.getByLabelText('Email');
    expect(input).toHaveClass('custom-input-class');
    
    const container_ = container.firstChild;
    expect(container_).toHaveClass('custom-container-class');
  });

  it('handles autoComplete attribute', () => {
    render(<Input name="email" label="Email" autoComplete="email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('autoComplete', 'email');
  });

  it('handles maxLength attribute', () => {
    render(<Input name="username" label="Username" maxLength={20} />);
    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('maxLength', '20');
  });
});