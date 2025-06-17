import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartPromptForm } from '@/components/forms/SmartPromptForm';

// Mock fetch globally
global.fetch = jest.fn();

describe('SmartPromptForm', () => {
  const mockOnSubmit = jest.fn();
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderForm = (props = {}) => {
    return render(
      <SmartPromptForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        {...props}
      />
    );
  };

  describe('basic rendering', () => {
    it('should render form elements correctly', () => {
      renderForm();
      
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create issue/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate title/i })).toBeInTheDocument();
    });

    it('should show helpful placeholder text', () => {
      renderForm();
      
      expect(screen.getByPlaceholderText(/short verb phrase/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/as a.*type of user/i)).toBeInTheDocument();
    });

    it('should show guidance text', () => {
      renderForm();
      
      expect(screen.getByText(/enter a detailed message above to enable ai title generation/i)).toBeInTheDocument();
      expect(screen.getByText(/describe your issue, feature request/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should require message field', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/message is required/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate title length when provided', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const titleInput = screen.getByLabelText(/name/i);
      const messageInput = screen.getByLabelText(/message/i);
      const submitButton = screen.getByRole('button', { name: /create issue/i });
      
      await user.type(titleInput, 'x'); // Too short
      await user.type(messageInput, 'Valid message content');
      await user.click(submitButton);
      
      expect(screen.getByText(/title must be between 5 and 70 characters/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should allow submission with valid data', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const titleInput = screen.getByLabelText(/name/i);
      const messageInput = screen.getByLabelText(/message/i);
      const submitButton = screen.getByRole('button', { name: /create issue/i });
      
      await user.type(titleInput, 'Valid Title');
      await user.type(messageInput, 'Valid message content for testing');
      await user.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Valid Title',
        prompt: 'Valid message content for testing'
      });
    });

    it('should use first 60 characters of message as title fallback', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const submitButton = screen.getByRole('button', { name: /create issue/i });
      
      const longMessage = 'This is a very long message that will be used as the title fallback when no title is provided by the user';
      await user.type(messageInput, longMessage);
      await user.click(submitButton);
      
      const expectedTitle = longMessage.slice(0, 60).trim();
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: expectedTitle,
        prompt: longMessage
      });
    });
  });

  describe('AI title generation', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'AI Generated Title',
          alternatives: ['Alternative 1', 'Alternative 2'],
          isGenerated: true
        })
      } as Response);
    });

    it('should disable generate button when message is too short', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'short');
      
      expect(generateButton).toBeDisabled();
    });

    it('should enable generate button when message is long enough', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'This is a sufficiently long message for title generation');
      
      expect(generateButton).not.toBeDisabled();
    });

    it('should show error when trying to generate title with short message', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'short');
      
      // Force click even though disabled
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a more detailed message to generate a title/i)).toBeInTheDocument();
      });
    });

    it('should generate title successfully', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const titleInput = screen.getByLabelText(/name/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'As a user, I want to upload files so that I can share documents');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/generate-title', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt: 'As a user, I want to upload files so that I can share documents' 
          }),
        });
      });
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('AI Generated Title');
      });
    });

    it('should show loading state during title generation', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ title: 'Generated Title', isGenerated: true })
        } as Response), 100))
      );
      
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'Long enough message for title generation');
      await user.click(generateButton);
      
      expect(screen.getByText(/generating\.\.\./i)).toBeInTheDocument();
      expect(generateButton).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.queryByText(/generating\.\.\./i)).not.toBeInTheDocument();
      });
    });

    it('should show alternative title suggestions', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'Message for testing alternatives');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/alternative suggestions/i)).toBeInTheDocument();
        expect(screen.getByText('Alternative 1')).toBeInTheDocument();
        expect(screen.getByText('Alternative 2')).toBeInTheDocument();
      });
    });

    it('should allow selecting alternative titles', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const titleInput = screen.getByLabelText(/name/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'Message for testing alternatives');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Alternative 1')).toBeInTheDocument();
      });
      
      const alternativeButton = screen.getByText('Alternative 1');
      await user.click(alternativeButton);
      
      expect(titleInput).toHaveValue('Alternative 1');
      expect(screen.queryByText(/alternative suggestions/i)).not.toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response);
      
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const titleInput = screen.getByLabelText(/name/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'Message that will cause API error');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
      
      // Should still populate fallback title
      expect(titleInput).toHaveValue('Message that will cause API error');
    });

    it('should handle rate limit errors', async () => {
      const user = userEvent.setup();
      
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
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'Message that will hit rate limit');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const titleInput = screen.getByLabelText(/name/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'Message that will cause network error');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
      
      // Should populate fallback title
      expect(titleInput).toHaveValue('Message that will cause network error');
    });

    it('should clear error when user edits message', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockRejectedValue(new Error('API Error'));
      
      renderForm();
      
      const messageInput = screen.getByLabelText(/message/i);
      const generateButton = screen.getByRole('button', { name: /generate title/i });
      
      await user.type(messageInput, 'Initial message');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/api error/i)).toBeInTheDocument();
      });
      
      // Edit the message
      await user.type(messageInput, ' - edited');
      
      await waitFor(() => {
        expect(screen.queryByText(/api error/i)).not.toBeInTheDocument();
      });
    });

    it('should allow manual title editing', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const titleInput = screen.getByLabelText(/name/i);
      
      // Manually edit the title
      await user.clear(titleInput);
      await user.type(titleInput, 'Manual Title');
      
      expect(titleInput).toHaveValue('Manual Title');
    });
  });

  describe('disabled states', () => {
    it('should disable all inputs when submitting', () => {
      renderForm({ isSubmitting: true });
      
      expect(screen.getByLabelText(/name/i)).toBeDisabled();
      expect(screen.getByLabelText(/message/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /creating issue/i })).toBeDisabled();
    });

    it('should show creating state in submit button', () => {
      renderForm({ isSubmitting: true });
      
      expect(screen.getByRole('button', { name: /creating issue/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /create issue/i })).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper labels and descriptions', () => {
      renderForm();
      
      const titleInput = screen.getByLabelText(/name/i);
      const messageInput = screen.getByLabelText(/message/i);
      
      expect(titleInput).toHaveAttribute('id', 'title');
      expect(messageInput).toHaveAttribute('id', 'prompt');
      
      // Check for required field indicators
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      renderForm();
      
      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);
      
      const errorMessage = screen.getByText(/message is required/i);
      expect(errorMessage).toHaveClass('text-red-500');
    });
  });
});