import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect } from '@/components/ui/MultiSelect';

describe('MultiSelect', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with placeholder', () => {
    render(
      <MultiSelect
        name="test"
        value={[]}
        onChange={mockOnChange}
        placeholder="Add items..."
      />
    );

    expect(screen.getByPlaceholderText('Add items...')).toBeInTheDocument();
  });

  it('adds item on Enter key', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        name="test"
        value={[]}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'New Item');
    await user.keyboard('{Enter}');

    expect(mockOnChange).toHaveBeenCalledWith(['New Item']);
  });

  it('displays existing values', () => {
    render(
      <MultiSelect
        name="test"
        value={['Item 1', 'Item 2']}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('removes item when clicking remove button', () => {
    render(
      <MultiSelect
        name="test"
        value={['Item 1', 'Item 2']}
        onChange={mockOnChange}
      />
    );

    const removeButtons = screen.getAllByLabelText(/Remove/);
    fireEvent.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith(['Item 2']);
  });

  it('removes last item on Backspace when input is empty', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        name="test"
        value={['Item 1', 'Item 2']}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('{Backspace}');

    expect(mockOnChange).toHaveBeenCalledWith(['Item 1']);
  });

  it('prevents duplicate items', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        name="test"
        value={['Existing Item']}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'Existing Item');
    await user.keyboard('{Enter}');

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('shows error message when provided', () => {
    render(
      <MultiSelect
        name="test"
        value={[]}
        onChange={mockOnChange}
        error="This field is required"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('shows help text for empty list', () => {
    render(
      <MultiSelect
        name="test"
        value={[]}
        onChange={mockOnChange}
        placeholder="Add tags"
      />
    );

    expect(screen.getByText('Press Enter to add items')).toBeInTheDocument();
  });

  it('trims whitespace from new items', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        name="test"
        value={[]}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '  Trimmed Item  ');
    await user.keyboard('{Enter}');

    expect(mockOnChange).toHaveBeenCalledWith(['Trimmed Item']);
  });

  it('does not add empty items', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        name="test"
        value={[]}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '   ');
    await user.keyboard('{Enter}');

    expect(mockOnChange).not.toHaveBeenCalled();
  });
});