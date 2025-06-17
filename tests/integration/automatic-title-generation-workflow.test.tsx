import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartPromptForm } from '@/components/forms/SmartPromptForm';

describe('Automatic Title Generation Workflow Integration', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderForm = () => {
    return render(
      <SmartPromptForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
      />
    );
  };

  describe('form behavior without manual title generation', () => {
    it('should submit with optional title when provided', async () => {
      const user = userEvent.setup();
      renderForm();

      // User provides both title and message
      const titleInput = screen.getByLabelText(/name/i);
      const messageInput = screen.getByLabelText(/message/i);

      await user.type(titleInput, 'Fix authentication bug');
      await user.type(messageInput, 'Users cannot log in with special characters in passwords');

      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Fix authentication bug',
        prompt: 'Users cannot log in with special characters in passwords'
      });
    });

    it('should submit with empty title when not provided', async () => {
      const user = userEvent.setup();
      renderForm();

      // User provides only message
      const messageInput = screen.getByLabelText(/message/i);
      await user.type(messageInput, 'Implement file upload functionality for document sharing');

      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Implement file upload functionality for document sharing',
        prompt: 'Implement file upload functionality for document sharing'
      });
    });

    it('should show helpful hint about automatic title generation', () => {
      renderForm();

      expect(screen.getByText(/leave empty to auto-generate a title from your message when publishing to github/i))
        .toBeInTheDocument();
    });

    it('should not show generate title button', () => {
      renderForm();

      expect(screen.queryByRole('button', { name: /generate title/i }))
        .not.toBeInTheDocument();
    });

    it('should not show title suggestions or alternatives', () => {
      renderForm();

      expect(screen.queryByText(/alternative suggestions/i))
        .not.toBeInTheDocument();
    });

    it('should handle form validation correctly', async () => {
      const user = userEvent.setup();
      renderForm();

      // Try to submit without message
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

      // Provide a title that's too short
      await user.type(titleInput, 'Fix'); // Only 3 characters
      await user.type(messageInput, 'This is a valid message for testing');

      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);

      expect(screen.getByText(/title must be between 5 and 70 characters/i))
        .toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate title is not too long', async () => {
      const user = userEvent.setup();
      renderForm();

      const titleInput = screen.getByLabelText(/name/i);
      const messageInput = screen.getByLabelText(/message/i);

      // Provide a title that's too long
      const longTitle = 'This is an extremely long title that exceeds the seventy character limit for validation';
      await user.type(titleInput, longTitle);
      await user.type(messageInput, 'This is a valid message for testing');

      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);

      expect(screen.getByText(/title must be between 5 and 70 characters/i))
        .toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear validation errors when user types', async () => {
      const user = userEvent.setup();
      renderForm();

      const titleInput = screen.getByLabelText(/name/i);
      const messageInput = screen.getByLabelText(/message/i);

      // Trigger validation error
      await user.type(titleInput, 'Fix');
      await user.type(messageInput, 'Valid message');
      
      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);

      expect(screen.getByText(/title must be between 5 and 70 characters/i))
        .toBeInTheDocument();

      // Fix the title
      await user.clear(titleInput);
      await user.type(titleInput, 'Fix authentication bug');

      // Error should be cleared
      expect(screen.queryByText(/title must be between 5 and 70 characters/i))
        .not.toBeInTheDocument();
    });

    it('should allow submission with trimmed empty title', async () => {
      const user = userEvent.setup();
      renderForm();

      const titleInput = screen.getByLabelText(/name/i);
      const messageInput = screen.getByLabelText(/message/i);

      // Provide only whitespace in title
      await user.type(titleInput, '   ');
      await user.type(messageInput, 'Implement new search functionality');

      const submitButton = screen.getByRole('button', { name: /create issue/i });
      await user.click(submitButton);

      // Should use message as fallback title
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'Implement new search functionality',
        prompt: 'Implement new search functionality'
      });
    });

    it('should handle concurrent form submissions', async () => {
      const user = userEvent.setup();
      renderForm();

      const messageInput = screen.getByLabelText(/message/i);
      await user.type(messageInput, 'Test concurrent submission handling');

      const submitButton = screen.getByRole('button', { name: /create issue/i });
      
      // Multiple rapid clicks - but form doesn't prevent them since we removed that logic
      await user.click(submitButton);
      
      // Give a moment for first submission to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await user.click(submitButton);
      await user.click(submitButton);

      // Each click should result in a separate submit call
      expect(mockOnSubmit).toHaveBeenCalledTimes(3);
    });
  });

  describe('accessibility and user experience', () => {
    it('should have proper form labels and structure', () => {
      renderForm();

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create issue/i })).toBeInTheDocument();
    });

    it('should show loading state during submission', async () => {
      render(
        <SmartPromptForm
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /creating issue/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable inputs during submission', () => {
      render(
        <SmartPromptForm
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      const titleInput = screen.getByLabelText(/name/i);
      const messageInput = screen.getByLabelText(/message/i);

      expect(titleInput).toBeDisabled();
      expect(messageInput).toBeDisabled();
    });

    it('should have proper placeholder text', () => {
      renderForm();

      const titleInput = screen.getByLabelText(/name/i);
      const messageInput = screen.getByLabelText(/message/i);

      expect(titleInput).toHaveProperty('placeholder', 'Short verb phrase, e.g. Fix image upload >5 MB');
      expect(messageInput).toHaveProperty('placeholder', 'As a <type of user>, I want <capability> so that <business value>.');
    });
  });
});