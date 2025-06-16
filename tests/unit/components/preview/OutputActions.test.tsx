import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OutputActions } from '@/components/preview/OutputActions';

describe('OutputActions', () => {
  const mockOnEdit = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnCopy = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all action buttons with default labels', () => {
    render(
      <OutputActions
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
        onCopy={mockOnCopy}
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Create Issue')).toBeInTheDocument();
  });

  it('renders with custom labels', () => {
    render(
      <OutputActions
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
        onCopy={mockOnCopy}
        editLabel="Modify"
        copyLabel="Duplicate"
        submitLabel="Generate"
      />
    );

    expect(screen.getByText('Modify')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <OutputActions
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
        onCopy={mockOnCopy}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit when submit button is clicked', () => {
    render(
      <OutputActions
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
        onCopy={mockOnCopy}
      />
    );

    fireEvent.click(screen.getByText('Create Issue'));
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onCopy and shows copied state', async () => {
    render(
      <OutputActions
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
        onCopy={mockOnCopy}
      />
    );

    const copyButton = screen.getByText('Copy to Clipboard');
    fireEvent.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalledTimes(1);
    
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('applies correct button variants', () => {
    render(
      <OutputActions
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
        onCopy={mockOnCopy}
      />
    );

    const editButton = screen.getByText('Edit');
    const copyButton = screen.getByText('Copy to Clipboard');
    const submitButton = screen.getByText('Create Issue');

    expect(editButton.closest('button')).toHaveClass('bg-secondary');
    expect(copyButton.closest('button')).toHaveClass('bg-secondary');
    expect(submitButton.closest('button')).toHaveClass('bg-accent');
  });
});