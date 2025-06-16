import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartPromptForm } from '@/components/forms/SmartPromptForm';

// Mock fetch for integration testing
global.fetch = jest.fn();

describe('Title Generation Workflow Integration', () => {
  const mockOnSubmit = jest.fn();
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderForm = () => {
    return render(
      <SmartPromptForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );
  };

  describe('complete user workflow', () => {
    it('should complete full title generation and form submission workflow', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'Implement file upload feature',
          alternatives: ['Add file upload functionality', 'Create document upload system'],
          isGenerated: true
        })
      } as Response);

      renderForm();

      // 1. User types a message
      const messageInput = screen.getByLabelText(/message/i);
      await user.type(messageInput, 'As a user, I want to upload files to share documents with my team');

      // 2. Generate title button becomes enabled
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      expect(generateButton).not.toBeDisabled();

      // 3. User clicks generate title
      await user.click(generateButton);

      // 4. API is called with correct payload
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/generate-title', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt: 'As a user, I want to upload files to share documents with my team' 
          }),
        });
      });

      // 5. Title field is populated with AI-generated title
      const titleInput = screen.getByLabelText(/name/i);
      await waitFor(() => {
        expect(titleInput).toHaveValue('Implement file upload feature');
      });

      // 6. Alternative suggestions are shown
      await waitFor(() => {
        expect(screen.getByText(/alternative suggestions/i)).toBeInTheDocument();
        expect(screen.getByText('Add file upload functionality')).toBeInTheDocument();
        expect(screen.getByText('Create document upload system')).toBeInTheDocument();
      });

      // 7. User can select an alternative
      const altButton = screen.getByText('Add file upload functionality');
      await user.click(altButton);
      
      expect(titleInput).toHaveValue('Add file upload functionality');
      expect(screen.queryByText(/alternative suggestions/i)).not.toBeInTheDocument();

      // 8. User submits the form
      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);

      // 9. Form submission handler is called with final data
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Add file upload functionality',
        prompt: 'As a user, I want to upload files to share documents with my team'
      });
    });

    it('should handle API failure gracefully in complete workflow', async () => {
      const user = userEvent.setup();
      
      // Mock API failure
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response);

      renderForm();

      // 1. User types a message
      const messageInput = screen.getByLabelText(/message/i);
      await user.type(messageInput, 'Fix the critical bug in payment processing');

      // 2. User tries to generate title
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      await user.click(generateButton);

      // 3. Error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });

      // 4. Fallback title is still populated
      const titleInput = screen.getByLabelText(/name/i);
      expect(titleInput).toHaveValue('Fix the critical bug in payment processing');

      // 5. User can still submit the form
      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Fix the critical bug in payment processing',
        prompt: 'Fix the critical bug in payment processing'
      });
    });

    it('should work without AI when user skips title generation', async () => {
      const user = userEvent.setup();
      renderForm();

      // 1. User types message but skips title generation
      const messageInput = screen.getByLabelText(/message/i);
      await user.type(messageInput, 'Update the user interface to be more responsive');

      // 2. User submits directly without generating title
      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);

      // 3. Form uses fallback title (first 60 chars)
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Update the user interface to be more responsive',
        prompt: 'Update the user interface to be more responsive'
      });

      // 4. No API call should have been made
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle rate limiting in complete workflow', async () => {
      const user = userEvent.setup();
      
      // Mock rate limit response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ 
          error: 'Rate limit exceeded. Please try again later.',
          resetAt: new Date(Date.now() + 3600000).toISOString()
        })
      } as Response);

      renderForm();

      const messageInput = screen.getByLabelText(/message/i);
      await user.type(messageInput, 'Implement advanced search functionality');

      const generateButton = screen.getByRole('button', { name: /generate title/i });
      await user.click(generateButton);

      // Should show rate limit error
      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
      });

      // Should still populate fallback title
      const titleInput = screen.getByLabelText(/name/i);
      expect(titleInput).toHaveValue('Implement advanced search functionality');

      // User can still submit
      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Implement advanced search functionality',
        prompt: 'Implement advanced search functionality'
      });
    });

    it('should maintain form state during title generation', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response
      let resolvePromise: (value: any) => void;
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(slowPromise as any);

      renderForm();

      // 1. User fills in both fields
      const titleInput = screen.getByLabelText(/name/i);
      const messageInput = screen.getByLabelText(/message/i);
      
      await user.type(titleInput, 'Initial manual title');
      await user.type(messageInput, 'This is a detailed message for testing state management');

      // 2. User clicks generate title
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      await user.click(generateButton);

      // 3. Loading state is shown
      expect(screen.getByText(/generating\.\.\./i)).toBeInTheDocument();
      expect(generateButton).toBeDisabled();

      // 4. Message field should still have its content
      expect(messageInput).toHaveValue('This is a detailed message for testing state management');

      // 5. Resolve the API call
      resolvePromise!({
        ok: true,
        json: async () => ({
          title: 'Generated title from API',
          alternatives: [],
          isGenerated: true
        })
      });

      // 6. Title should be updated
      await waitFor(() => {
        expect(titleInput).toHaveValue('Generated title from API');
      });

      // 7. Message should be unchanged
      expect(messageInput).toHaveValue('This is a detailed message for testing state management');
    });
  });

  describe('error recovery workflows', () => {
    it('should recover from network errors', async () => {
      const user = userEvent.setup();
      
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            title: 'Successfully generated title',
            alternatives: [],
            isGenerated: true
          })
        } as Response);

      renderForm();

      const messageInput = screen.getByLabelText(/message/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'Test network error recovery');
      
      // First attempt fails
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to generate title/i)).toBeInTheDocument();
      });

      // User edits message (clears error)
      await user.type(messageInput, ' - edited');
      
      await waitFor(() => {
        expect(screen.queryByText(/failed to generate title/i)).not.toBeInTheDocument();
      });

      // Second attempt succeeds
      await user.click(generateButton);
      
      const titleInput = screen.getByLabelText(/name/i);
      await waitFor(() => {
        expect(titleInput).toHaveValue('Successfully generated title');
      });
    });

    it('should handle multiple rapid clicks gracefully', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            title: 'Generated after delay',
            alternatives: [],
            isGenerated: true
          })
        } as Response), 100))
      );

      renderForm();

      const messageInput = screen.getByLabelText(/message/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'Test rapid clicking behavior');
      
      // Rapid clicks
      await user.click(generateButton);
      await user.click(generateButton);
      await user.click(generateButton);

      // Should only make one API call
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const titleInput = screen.getByLabelText(/name/i);
      await waitFor(() => {
        expect(titleInput).toHaveValue('Generated after delay');
      });
    });
  });
});