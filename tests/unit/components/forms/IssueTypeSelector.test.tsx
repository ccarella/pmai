import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueTypeSelector } from '@/components/forms/IssueTypeSelector';
import { IssueType } from '@/lib/types/issue';

describe('IssueTypeSelector', () => {
  const mockOnSelect = jest.fn();
  const issueTypes: IssueType[] = ['feature', 'bug', 'epic', 'technical-debt'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all issue type options', () => {
    render(<IssueTypeSelector onSelect={mockOnSelect} />);
    
    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Bug Report')).toBeInTheDocument();
    expect(screen.getByText('Epic')).toBeInTheDocument();
    expect(screen.getByText('Technical Debt')).toBeInTheDocument();
  });

  it('renders with appropriate icons for each type', () => {
    render(<IssueTypeSelector onSelect={mockOnSelect} />);
    
    expect(screen.getByTestId('feature-icon')).toBeInTheDocument();
    expect(screen.getByTestId('bug-icon')).toBeInTheDocument();
    expect(screen.getByTestId('epic-icon')).toBeInTheDocument();
    expect(screen.getByTestId('technical-debt-icon')).toBeInTheDocument();
  });

  it('renders descriptions for each issue type', () => {
    render(<IssueTypeSelector onSelect={mockOnSelect} />);
    
    expect(screen.getByText(/New functionality or enhancement/i)).toBeInTheDocument();
    expect(screen.getByText(/Something isn't working correctly/i)).toBeInTheDocument();
    expect(screen.getByText(/Large feature that spans multiple issues/i)).toBeInTheDocument();
    expect(screen.getByText(/Code improvements and refactoring/i)).toBeInTheDocument();
  });

  it('calls onSelect with correct issue type when clicked', async () => {
    const user = userEvent.setup();
    render(<IssueTypeSelector onSelect={mockOnSelect} />);
    
    await user.click(screen.getByText('Feature'));
    expect(mockOnSelect).toHaveBeenCalledWith('feature');
    
    await user.click(screen.getByText('Bug Report'));
    expect(mockOnSelect).toHaveBeenCalledWith('bug');
    
    await user.click(screen.getByText('Epic'));
    expect(mockOnSelect).toHaveBeenCalledWith('epic');
    
    await user.click(screen.getByText('Technical Debt'));
    expect(mockOnSelect).toHaveBeenCalledWith('technical-debt');
  });

  it('shows visual feedback on hover', async () => {
    const user = userEvent.setup();
    render(<IssueTypeSelector onSelect={mockOnSelect} />);
    
    const featureButton = screen.getByTestId('issue-type-feature');
    const featureCard = featureButton.querySelector('.cursor-pointer');
    
    expect(featureCard).toBeTruthy();
    expect(featureCard).toHaveClass('hover:border-blue-500');
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<IssueTypeSelector onSelect={mockOnSelect} />);
    
    const featureButton = screen.getByRole('button', { name: /Feature/i });
    const bugButton = screen.getByRole('button', { name: /Bug Report/i });
    
    // Tab navigation
    await user.tab();
    expect(featureButton).toHaveFocus();
    
    await user.tab();
    expect(bugButton).toHaveFocus();
    
    // Enter key selection
    await user.keyboard('{Enter}');
    expect(mockOnSelect).toHaveBeenCalledWith('bug');
  });

  it('supports keyboard selection with Space key', async () => {
    const user = userEvent.setup();
    render(<IssueTypeSelector onSelect={mockOnSelect} />);
    
    const featureButton = screen.getByRole('button', { name: /Feature/i });
    
    await user.tab();
    expect(featureButton).toHaveFocus();
    
    await user.keyboard(' ');
    expect(mockOnSelect).toHaveBeenCalledWith('feature');
  });

  it('renders with proper ARIA labels', () => {
    render(<IssueTypeSelector onSelect={mockOnSelect} />);
    
    expect(screen.getByRole('group', { name: /Select issue type/i })).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /Feature/i })).toHaveAttribute('aria-describedby');
    expect(screen.getByRole('button', { name: /Bug Report/i })).toHaveAttribute('aria-describedby');
  });

  it('can receive custom className', () => {
    const { container } = render(
      <IssueTypeSelector onSelect={mockOnSelect} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows selected state when value prop is provided', () => {
    render(<IssueTypeSelector onSelect={mockOnSelect} value="feature" />);
    
    const featureCard = screen.getByTestId('issue-type-feature');
    expect(featureCard).toHaveClass('ring-2', 'ring-blue-500');
    
    const bugCard = screen.getByTestId('issue-type-bug');
    expect(bugCard).not.toHaveClass('ring-2');
  });

  it('updates selected state when value prop changes', () => {
    const { rerender } = render(
      <IssueTypeSelector onSelect={mockOnSelect} value="feature" />
    );
    
    expect(screen.getByTestId('issue-type-feature')).toHaveClass('ring-2');
    
    rerender(<IssueTypeSelector onSelect={mockOnSelect} value="bug" />);
    
    expect(screen.getByTestId('issue-type-feature')).not.toHaveClass('ring-2');
    expect(screen.getByTestId('issue-type-bug')).toHaveClass('ring-2');
  });
});