import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineEdit } from '../InlineEdit';

describe('InlineEdit Component', () => {
  const defaultProps = {
    value: 'Initial Value',
    onSave: jest.fn(),
    className: 'test-class',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render value in view mode by default', () => {
    render(<InlineEdit {...defaultProps} />);
    
    expect(screen.getByText('Initial Value')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('should switch to edit mode on click', async () => {
    render(<InlineEdit {...defaultProps} />);
    
    const viewElement = screen.getByText('Initial Value');
    await userEvent.click(viewElement);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Initial Value');
  });

  it('should save on Enter key', async () => {
    render(<InlineEdit {...defaultProps} />);
    
    const viewElement = screen.getByText('Initial Value');
    await userEvent.click(viewElement);

    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Value{Enter}');

    expect(defaultProps.onSave).toHaveBeenCalledWith('New Value');
  });

  it('should save on blur', async () => {
    render(<InlineEdit {...defaultProps} />);
    
    const viewElement = screen.getByText('Initial Value');
    await userEvent.click(viewElement);

    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Value');
    
    fireEvent.blur(input);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith('New Value');
    });
  });

  it('should cancel on Escape key', async () => {
    render(<InlineEdit {...defaultProps} />);
    
    const viewElement = screen.getByText('Initial Value');
    await userEvent.click(viewElement);

    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'Changed Value{Escape}');

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Initial Value')).toBeInTheDocument();
  });

  it('should not save if value is unchanged', async () => {
    render(<InlineEdit {...defaultProps} />);
    
    const viewElement = screen.getByText('Initial Value');
    await userEvent.click(viewElement);

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('should trim whitespace before saving', async () => {
    render(<InlineEdit {...defaultProps} />);
    
    const viewElement = screen.getByText('Initial Value');
    await userEvent.click(viewElement);

    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, '  Trimmed Value  {Enter}');

    expect(defaultProps.onSave).toHaveBeenCalledWith('Trimmed Value');
  });

  it('should show loading state while saving', async () => {
    const slowSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<InlineEdit {...defaultProps} onSave={slowSave} />);
    
    const viewElement = screen.getByText('Initial Value');
    await userEvent.click(viewElement);

    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Value{Enter}');

    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
    });
  });

  it('should handle multiline text', () => {
    render(<InlineEdit {...defaultProps} multiline />);
    
    const viewElement = screen.getByText('Initial Value');
    fireEvent.click(viewElement);

    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('should apply custom className', () => {
    render(<InlineEdit {...defaultProps} />);
    
    const container = screen.getByText('Initial Value').parentElement;
    expect(container).toHaveClass('test-class');
  });

  it('should handle placeholder text', () => {
    render(<InlineEdit {...defaultProps} value="" placeholder="Enter text" />);
    
    expect(screen.getByText('Enter text')).toBeInTheDocument();
    expect(screen.getByText('Enter text')).toHaveClass('text-muted-foreground');
  });

  it('should show error state', async () => {
    const failingSave = jest.fn().mockRejectedValue(new Error('Save failed'));
    render(<InlineEdit {...defaultProps} onSave={failingSave} />);
    
    const viewElement = screen.getByText('Initial Value');
    await userEvent.click(viewElement);

    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Value{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should be accessible', () => {
    render(<InlineEdit {...defaultProps} ariaLabel="Edit title" />);
    
    const viewElement = screen.getByText('Initial Value');
    fireEvent.click(viewElement);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Edit title');
  });

  it('should support disabled state', () => {
    render(<InlineEdit {...defaultProps} disabled />);
    
    const viewElement = screen.getByText('Initial Value');
    fireEvent.click(viewElement);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});