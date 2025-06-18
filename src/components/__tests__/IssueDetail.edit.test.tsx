import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueDetail } from '../IssueDetail';
import { GitHubIssue } from '@/lib/types/github';

// Mock dependencies
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock('../ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock('../ui/Button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('../ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div>Loading...</div>,
}));

jest.mock('../ui/GitHubMarkdown', () => ({
  GitHubMarkdown: ({ content }: { content: string }) => <div>{content}</div>,
}));

jest.mock('../MergePRButton', () => ({
  MergePRButton: () => <div>Merge PR Button</div>,
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 hours',
}));

// Mock fetch
global.fetch = jest.fn();

describe('IssueDetail Edit Functionality', () => {
  const mockIssue: GitHubIssue = {
    id: 1,
    number: 123,
    title: 'Test Issue Title',
    state: 'open',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    closed_at: null,
    body: 'Test issue body content',
    user: {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    labels: [
      { id: 1, name: 'bug', color: 'ff0000' },
      { id: 2, name: 'enhancement', color: '00ff00' },
    ],
    comments: 2,
    html_url: 'https://github.com/owner/repo/issues/123',
  };

  const mockRepository = {
    owner: 'owner',
    name: 'repo',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ comments: [] }),
    });
  });

  it('should render edit button when in editable mode', () => {
    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable />);
    
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('should enter edit mode when edit button is clicked', async () => {
    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    // Should show input fields
    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should prefill edit fields with current values', async () => {
    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const titleInput = screen.getByRole('textbox', { name: /title/i }) as HTMLInputElement;
    const descriptionInput = screen.getByRole('textbox', { name: /description/i }) as HTMLTextAreaElement;

    expect(titleInput.value).toBe('Test Issue Title');
    expect(descriptionInput.value).toBe('Test issue body content');
  });

  it('should update title on save', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const onUpdate = jest.fn();
    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable onUpdate={onUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Title');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/issues', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueNumber: 123,
          title: 'Updated Title',
        }),
      });
    });

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should update description on save', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const onUpdate = jest.fn();
    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable onUpdate={onUpdate} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const descriptionInput = screen.getByRole('textbox', { name: /description/i });
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, 'Updated description content');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/issues', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueNumber: 123,
          body: 'Updated description content',
        }),
      });
    });

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should handle label editing', async () => {
    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    // Labels should be shown with remove buttons
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('enhancement')).toBeInTheDocument();
    
    // Should show add label button
    expect(screen.getByRole('button', { name: /add label/i })).toBeInTheDocument();
  });

  it('should cancel editing without saving', async () => {
    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Changed but not saved');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // Should exit edit mode and show original content
    expect(screen.queryByRole('textbox', { name: /title/i })).not.toBeInTheDocument();
    expect(screen.getByText('Test Issue Title')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('should show error message on save failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to update issue' }),
    });

    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Title');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update issue/i)).toBeInTheDocument();
    });
  });

  it('should handle auto-save on blur', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable autoSave />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Auto-saved Title');

    // Blur the input to trigger auto-save
    fireEvent.blur(titleInput);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/issues', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueNumber: 123,
          title: 'Auto-saved Title',
        }),
      });
    }, { timeout: 1500 }); // Account for debounce delay
  });

  it('should handle Enter key to save', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Enter to save{Enter}');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/issues', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueNumber: 123,
          title: 'Enter to save',
        }),
      });
    });
  });

  it('should maintain accessibility during edit mode', async () => {
    render(<IssueDetail issue={mockIssue} repository={mockRepository} editable />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    // Check ARIA labels and roles
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const descriptionInput = screen.getByRole('textbox', { name: /description/i });

    expect(titleInput).toHaveAttribute('aria-label');
    expect(descriptionInput).toHaveAttribute('aria-label');
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});