import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IssuePreview } from '@/components/preview/IssuePreview';
import { IssueFormData } from '@/lib/types/issue';
import { useAIEnhancement } from '@/lib/hooks/useAIEnhancement';

// Mock dependencies
jest.mock('@/lib/hooks/useAIEnhancement');
jest.mock('@/lib/templates/markdown', () => ({
  generateMarkdown: jest.fn((data: IssueFormData) => `Markdown for ${data.title}`),
}));
jest.mock('@/lib/templates/claude-prompt', () => ({
  generateClaudePrompt: jest.fn((data: IssueFormData) => `Claude prompt for ${data.title}`),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

describe('IssuePreview', () => {
  const mockEnhance = jest.fn();
  const mockFormData: Partial<IssueFormData> = {
    type: 'feature',
    title: 'Test Feature',
    description: 'Test description',
    priority: 'high',
  };
  const mockOnEdit = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAIEnhancement as jest.Mock).mockReturnValue({
      enhance: mockEnhance,
      enhancements: null,
      isLoading: false,
      error: null,
    });
  });

  it('renders preview with markdown by default', () => {
    render(
      <IssuePreview
        formData={mockFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Preview Your Issue')).toBeInTheDocument();
    expect(screen.getByText('GitHub Issue')).toHaveClass('bg-accent');
    expect(screen.getByText('Markdown for Test Feature')).toBeInTheDocument();
  });

  it('switches between markdown and claude prompt tabs', () => {
    render(
      <IssuePreview
        formData={mockFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    // Click Claude Prompt tab
    fireEvent.click(screen.getByText('Claude Prompt'));
    expect(screen.getByText('Claude Prompt')).toHaveClass('bg-accent');
    expect(screen.getByText('Claude prompt for Test Feature')).toBeInTheDocument();

    // Click back to GitHub Issue tab
    fireEvent.click(screen.getByText('GitHub Issue'));
    expect(screen.getByText('GitHub Issue')).toHaveClass('bg-accent');
    expect(screen.getByText('Markdown for Test Feature')).toBeInTheDocument();
  });

  it('calls enhance when form data is complete', () => {
    render(
      <IssuePreview
        formData={mockFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    expect(mockEnhance).toHaveBeenCalledWith(mockFormData);
  });

  it('does not call enhance when form data is incomplete', () => {
    const incompleteData = { type: 'feature', title: 'Test' };
    render(
      <IssuePreview
        formData={incompleteData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    expect(mockEnhance).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    (useAIEnhancement as jest.Mock).mockReturnValue({
      enhance: mockEnhance,
      enhancements: null,
      isLoading: true,
      error: null,
    });

    render(
      <IssuePreview
        formData={mockFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Enhancing your issue with AI...')).toBeInTheDocument();
    expect(screen.queryByText('Create Issue')).not.toBeInTheDocument();
  });

  it('shows error state', () => {
    (useAIEnhancement as jest.Mock).mockReturnValue({
      enhance: mockEnhance,
      enhancements: null,
      isLoading: false,
      error: 'API rate limit exceeded',
    });

    render(
      <IssuePreview
        formData={mockFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Failed to enhance issue: API rate limit exceeded')).toBeInTheDocument();
    expect(screen.getByText('Using default template instead.')).toBeInTheDocument();
  });

  it('displays AI enhancements when available', () => {
    const mockEnhancements = {
      acceptanceCriteria: ['AC 1', 'AC 2'],
      edgeCases: ['Edge case 1', 'Edge case 2'],
      technicalConsiderations: ['Tech consideration 1'],
    };

    (useAIEnhancement as jest.Mock).mockReturnValue({
      enhance: mockEnhance,
      enhancements: mockEnhancements,
      isLoading: false,
      error: null,
    });

    render(
      <IssuePreview
        formData={mockFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('AI Enhancements')).toBeInTheDocument();
    expect(screen.getByText('AC 1')).toBeInTheDocument();
    expect(screen.getByText('AC 2')).toBeInTheDocument();
    expect(screen.getByText('Edge case 1')).toBeInTheDocument();
    expect(screen.getByText('Edge case 2')).toBeInTheDocument();
    expect(screen.getByText('Tech consideration 1')).toBeInTheDocument();
  });

  it('handles copy to clipboard for markdown', async () => {
    render(
      <IssuePreview
        formData={mockFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Copy to Clipboard'));
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Markdown for Test Feature');
    
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles copy to clipboard for claude prompt', async () => {
    render(
      <IssuePreview
        formData={mockFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    // Switch to Claude prompt tab
    fireEvent.click(screen.getByText('Claude Prompt'));
    
    fireEvent.click(screen.getByText('Copy to Clipboard'));
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Claude prompt for Test Feature');
  });

  it('calls onEdit when Edit button is clicked', () => {
    render(
      <IssuePreview
        formData={mockFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('renders Publish to GitHub button', () => {
    render(
      <IssuePreview
        formData={mockFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Publish to GitHub')).toBeInTheDocument();
  });

  it('renders with custom form data correctly', () => {
    const customFormData: Partial<IssueFormData> = {
      type: 'bug',
      title: 'Critical Bug',
      description: 'Something is broken',
      priority: 'critical',
      assignee: 'john.doe',
    };

    render(
      <IssuePreview
        formData={customFormData}
        onEdit={mockOnEdit}
        onSubmit={mockOnSubmit}
      />
    );

    expect(mockEnhance).toHaveBeenCalledWith(customFormData);
  });
});