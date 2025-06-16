import { validateSmartPrompt, smartPromptSchema } from '@/lib/utils/validation';

describe('Smart Prompt Validation', () => {
  describe('validateSmartPrompt', () => {
    it('validates with both title and prompt', () => {
      const data = {
        title: 'Fix user login',
        prompt: 'As a user, I want to login successfully',
      };
      
      const result = validateSmartPrompt(data);
      expect(result).toEqual({
        title: 'Fix user login',
        prompt: 'As a user, I want to login successfully',
      });
    });

    it('uses prompt as fallback title when title is empty', () => {
      const data = {
        title: '',
        prompt: 'As a user, I want to be able to export my data to CSV format so that I can analyze it in external tools',
      };
      
      const result = validateSmartPrompt(data);
      expect(result).toEqual({
        title: 'As a user, I want to be able to export my data to CSV format',
        prompt: 'As a user, I want to be able to export my data to CSV format so that I can analyze it in external tools',
      });
    });

    it('uses prompt as fallback title when title is undefined', () => {
      const data = {
        prompt: 'This is a test prompt that should be used as the title fallback',
      };
      
      const result = validateSmartPrompt(data);
      expect(result).toEqual({
        title: 'This is a test prompt that should be used as the title fallb',
        prompt: 'This is a test prompt that should be used as the title fallback',
      });
    });

    it('trims whitespace from title and prompt', () => {
      const data = {
        title: '  Fix login bug  ',
        prompt: '  As a user, I want to login  ',
      };
      
      const result = validateSmartPrompt(data);
      expect(result).toEqual({
        title: 'Fix login bug',
        prompt: 'As a user, I want to login',
      });
    });

    it('throws error for title that is too short', () => {
      const data = {
        title: 'Fix',
        prompt: 'Valid prompt content',
      };
      
      expect(() => validateSmartPrompt(data)).toThrow('Title must be between 5 and 70 characters');
    });

    it('throws error for title that is too long', () => {
      const data = {
        title: 'This is a very long title that exceeds the maximum allowed character limit of seventy characters',
        prompt: 'Valid prompt content',
      };
      
      expect(() => validateSmartPrompt(data)).toThrow('Title must be between 5 and 70 characters');
    });

    it('throws error for empty prompt', () => {
      const data = {
        title: 'Valid title',
        prompt: '',
      };
      
      expect(() => validateSmartPrompt(data)).toThrow('Prompt is required');
    });

    it('throws error for whitespace-only prompt', () => {
      const data = {
        title: 'Valid title',
        prompt: '   ',
      };
      
      expect(() => validateSmartPrompt(data)).toThrow('Prompt is required');
    });

    it('throws error when prompt is too short to generate title', () => {
      const data = {
        title: '',
        prompt: '',
      };
      
      expect(() => validateSmartPrompt(data)).toThrow('Title is required or prompt must be long enough to generate title');
    });

    it('accepts title at minimum length (5 characters)', () => {
      const data = {
        title: 'Login',
        prompt: 'Fix the login issue',
      };
      
      const result = validateSmartPrompt(data);
      expect(result.title).toBe('Login');
    });

    it('accepts title at maximum length (70 characters)', () => {
      const maxLengthTitle = 'A'.repeat(70);
      const data = {
        title: maxLengthTitle,
        prompt: 'Valid prompt content',
      };
      
      const result = validateSmartPrompt(data);
      expect(result.title).toBe(maxLengthTitle);
    });
  });

  describe('smartPromptSchema', () => {
    it('validates valid schema with both fields', () => {
      const data = {
        title: 'Fix login bug',
        prompt: 'As a user, I want to login',
      };
      
      const result = smartPromptSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('validates schema with only prompt', () => {
      const data = {
        prompt: 'As a user, I want to login',
      };
      
      const result = smartPromptSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('validates schema with empty title', () => {
      const data = {
        title: '',
        prompt: 'As a user, I want to login',
      };
      
      const result = smartPromptSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('rejects schema with missing prompt', () => {
      const data = {
        title: 'Fix login bug',
      };
      
      expect(() => smartPromptSchema.parse(data)).toThrow();
    });

    it('rejects schema with empty prompt', () => {
      const data = {
        title: 'Fix login bug',
        prompt: '',
      };
      
      expect(() => smartPromptSchema.parse(data)).toThrow();
    });

    it('rejects title longer than 70 characters', () => {
      const data = {
        title: 'A'.repeat(71),
        prompt: 'Valid prompt content',
      };
      
      expect(() => smartPromptSchema.parse(data)).toThrow();
    });
  });
});