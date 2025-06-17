import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartPromptForm } from '@/components/forms/SmartPromptForm';

// Mock framer-motion to avoid test complexity
jest.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatePresence: ({ children }: any) => children,
}));

// Mock UI components to avoid complex dependencies
jest.mock('@/components/ui/Input', () => ({
  // eslint-disable-next-line react/display-name, @typescript-eslint/no-explicit-any
  Input: React.forwardRef(({ label, ...props }: any, ref: any) => (
    <div>
      {label && <label htmlFor={props.id}>{label}</label>}
      <input ref={ref} {...props} />
    </div>
  )),
}));

jest.mock('@/components/ui/Textarea', () => ({
  // eslint-disable-next-line react/display-name, @typescript-eslint/no-explicit-any
  Textarea: React.forwardRef(({ label, ...props }: any, ref: any) => (
    <div>
      {label && <label htmlFor={props.id}>{label}</label>}
      <textarea ref={ref} {...props} />
    </div>
  )),
}));

jest.mock('@/components/ui/Button', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Button: ({ children, loading, ...props }: any) => (
    <button {...props}>
      {loading && <span data-testid="spinner" />}
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/Card', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('SmartPromptForm', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders form fields correctly', () => {
    render(<SmartPromptForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create issue/i })).toBeInTheDocument();
  });

  it('shows correct placeholders', () => {
    render(<SmartPromptForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByPlaceholderText(/short verb phrase/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/as a <type of user>/i)).toBeInTheDocument();
  });

  it('submits form with title and prompt', async () => {
    const user = userEvent.setup();
    render(<SmartPromptForm onSubmit={mockOnSubmit} />);
    
    const titleInput = screen.getByLabelText(/name/i);
    const promptInput = screen.getByLabelText(/message/i);
    const submitButton = screen.getByRole('button', { name: /create issue/i });
    
    await user.type(titleInput, 'Fix login bug');
    await user.type(promptInput, 'As a user, I want to be able to login so that I can access my account');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Fix login bug',
        prompt: 'As a user, I want to be able to login so that I can access my account',
      });
    });
  });

  it('submits form with prompt only (using fallback title)', async () => {
    const user = userEvent.setup();
    render(<SmartPromptForm onSubmit={mockOnSubmit} />);
    
    const promptInput = screen.getByLabelText(/message/i);
    const submitButton = screen.getByRole('button', { name: /create issue/i });
    
    const longPrompt = 'As a premium user, I want to be able to export my data to CSV format so that I can analyze it in external tools';
    await user.type(promptInput, longPrompt);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'As a premium user, I want to be able to export my data to CS',
        prompt: longPrompt,
      });
    });
  });

  it('validates title length (too short)', async () => {
    const user = userEvent.setup();
    render(<SmartPromptForm onSubmit={mockOnSubmit} />);
    
    const titleInput = screen.getByLabelText(/name/i);
    const promptInput = screen.getByLabelText(/message/i);
    const submitButton = screen.getByRole('button', { name: /create issue/i });
    
    await user.type(titleInput, 'Fix'); // Too short (< 5 chars)
    await user.type(promptInput, 'Valid prompt content');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/title must be between 5 and 70 characters/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('validates title length (too long)', async () => {
    const user = userEvent.setup();
    render(<SmartPromptForm onSubmit={mockOnSubmit} />);
    
    const titleInput = screen.getByLabelText(/name/i);
    const promptInput = screen.getByLabelText(/message/i);
    const submitButton = screen.getByRole('button', { name: /create issue/i });
    
    const longTitle = 'This is a very long title that exceeds the maximum allowed character limit';
    await user.type(titleInput, longTitle); // Too long (> 70 chars)
    await user.type(promptInput, 'Valid prompt content');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/title must be between 5 and 70 characters/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('validates empty prompt', async () => {
    const user = userEvent.setup();
    render(<SmartPromptForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /create issue/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/message is required/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<SmartPromptForm onSubmit={mockOnSubmit} />);
    
    const titleInput = screen.getByLabelText(/name/i);
    const submitButton = screen.getByRole('button', { name: /create issue/i });
    
    // Trigger validation error
    await user.type(titleInput, 'Fix'); // Too short
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/title must be between 5 and 70 characters/i)).toBeInTheDocument();
    });
    
    // Start typing to clear error
    await user.type(titleInput, ' login bug');
    
    await waitFor(() => {
      expect(screen.queryByText(/title must be between 5 and 70 characters/i)).not.toBeInTheDocument();
    });
  });

  it('disables form when submitting', () => {
    render(<SmartPromptForm onSubmit={mockOnSubmit} isSubmitting={true} />);
    
    const titleInput = screen.getByLabelText(/name/i);
    const promptInput = screen.getByLabelText(/message/i);
    const submitButton = screen.getByRole('button', { name: /creating issue/i });
    
    expect(titleInput).toBeDisabled();
    expect(promptInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows correct button text and spinner when submitting', () => {
    render(<SmartPromptForm onSubmit={mockOnSubmit} isSubmitting={true} />);
    
    expect(screen.getByRole('button', { name: /creating issue/i })).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows helper text for title field', () => {
    render(<SmartPromptForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText(/leave empty to auto-generate a title/i)).toBeInTheDocument();
  });

  it('shows helper text for prompt field', () => {
    render(<SmartPromptForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText(/describe your issue, feature request/i)).toBeInTheDocument();
  });
});