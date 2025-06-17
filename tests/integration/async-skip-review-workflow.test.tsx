import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CreateIssuePage from '@/app/create/page';
import ProcessingPage from '@/app/create/processing/page';
import { showToast } from '@/components/ui/Toast';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('next-auth/react');
jest.mock('@/components/ui/Toast');
jest.mock('@/lib/hooks/useOnboardingGuard', () => ({
  useOnboardingGuard: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Async Skip Review Workflow', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };
  const mockShowToast = showToast as jest.MockedFunction<typeof showToast>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorage.clear();

    // Setup fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Create Issue Page with Async Skip Review', () => {
    it('should create async job when skip review is enabled', async () => {
      // Mock authenticated user with skip review enabled
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' }
        }
      });

      // Mock API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ skipReview: true }),
        }) // Skip review setting
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ selectedRepo: 'owner/repo' }),
        }) // Selected repo
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            markdown: '# Test Issue',
            summary: { type: 'feature' },
            generatedTitle: 'Generated Title',
          }),
        }) // Create issue response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            jobId: 'job-123',
            status: 'pending',
          }),
        }); // Create job response

      render(<CreateIssuePage />);

      // Wait for skip review setting to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/skip-review');
      });

      // Find and fill the form
      const promptInput = screen.getByLabelText(/describe your issue/i);
      const submitButton = screen.getByRole('button', { name: /generate issue/i });

      fireEvent.change(promptInput, {
        target: { value: 'Create a test feature' },
      });

      fireEvent.click(submitButton);

      // Wait for job creation
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/jobs/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '',
            prompt: 'Create a test feature',
            repository: 'owner/repo',
          }),
        });
      });

      // Verify success toast
      expect(mockShowToast).toHaveBeenCalledWith(
        'Issue creation started! You can close this page.',
        'success'
      );

      // Verify job info stored in localStorage
      const jobData = JSON.parse(localStorage.getItem('async-job') || '{}');
      expect(jobData).toMatchObject({
        jobId: 'job-123',
        repository: 'owner/repo',
      });

      // Verify navigation to processing page
      expect(mockPush).toHaveBeenCalledWith('/create/processing');
    });

    it('should fall back to sync flow if job creation fails', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' }
        }
      });

      // Mock API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ skipReview: true }),
        }) // Skip review setting
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ selectedRepo: 'owner/repo' }),
        }) // Selected repo
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            markdown: '# Test Issue',
            summary: { type: 'feature' },
            generatedTitle: 'Generated Title',
          }),
        }) // Create issue response
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Job queue unavailable' }),
        }); // Failed job creation

      render(<CreateIssuePage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/skip-review');
      });

      const promptInput = screen.getByLabelText(/describe your issue/i);
      const submitButton = screen.getByRole('button', { name: /generate issue/i });

      fireEvent.change(promptInput, {
        target: { value: 'Create a test feature' },
      });

      fireEvent.click(submitButton);

      // Wait for fallback to preview
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/preview');
      });

      // Verify issue data stored for preview
      const issueData = JSON.parse(localStorage.getItem('created-issue') || '{}');
      expect(issueData).toMatchObject({
        markdown: '# Test Issue',
        summary: { type: 'feature' },
      });
    });
  });

  describe('Processing Page', () => {
    it('should poll job status and redirect on completion', async () => {
      // Setup job data in localStorage
      localStorage.setItem('async-job', JSON.stringify({
        jobId: 'job-123',
        repository: 'owner/repo',
        createdAt: new Date().toISOString(),
      }));

      // Mock API responses for polling
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'job-123',
            status: 'pending',
            createdAt: new Date().toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'job-123',
            status: 'processing',
            createdAt: new Date().toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'job-123',
            status: 'completed',
            result: {
              issueUrl: 'https://github.com/owner/repo/issues/123',
              issueNumber: 123,
              repository: 'owner/repo',
              title: 'Test Issue',
            },
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }),
        });

      render(<ProcessingPage />);

      // Verify initial state
      expect(screen.getByText(/creating your issue/i)).toBeInTheDocument();

      // Wait for polling to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/jobs/job-123');
      }, { timeout: 6000 });

      // Verify success toast
      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Issue published successfully!',
          'success'
        );
      });

      // Verify published issue data stored
      const publishedData = JSON.parse(localStorage.getItem('published-issue') || '{}');
      expect(publishedData).toMatchObject({
        issueUrl: 'https://github.com/owner/repo/issues/123',
        repository: 'owner/repo',
        title: 'Test Issue',
      });

      // Verify navigation to success page
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/create/success');
      }, { timeout: 3000 });
    });

    it('should handle job failure', async () => {
      localStorage.setItem('async-job', JSON.stringify({
        jobId: 'job-123',
        repository: 'owner/repo',
        createdAt: new Date().toISOString(),
      }));

      // Mock failed job response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'job-123',
          status: 'failed',
          error: 'GitHub API rate limit exceeded',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }),
      });

      render(<ProcessingPage />);

      await waitFor(() => {
        expect(screen.getByText(/issue creation failed/i)).toBeInTheDocument();
      });

      // Verify error message displayed
      expect(screen.getByText(/GitHub API rate limit exceeded/i)).toBeInTheDocument();

      // Verify error toast
      expect(mockShowToast).toHaveBeenCalledWith(
        'GitHub API rate limit exceeded',
        'error'
      );
    });

    it('should redirect to create page if no job data', () => {
      render(<ProcessingPage />);

      expect(mockPush).toHaveBeenCalledWith('/create');
    });

    it('should stop polling after timeout', async () => {
      localStorage.setItem('async-job', JSON.stringify({
        jobId: 'job-123',
        repository: 'owner/repo',
        createdAt: new Date().toISOString(),
      }));

      // Mock always pending response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'job-123',
          status: 'pending',
          createdAt: new Date().toISOString(),
        }),
      });

      // Mock timers
      jest.useFakeTimers();

      render(<ProcessingPage />);

      // Fast-forward through many polling intervals
      for (let i = 0; i < 65; i++) {
        jest.advanceTimersByTime(5000);
        await Promise.resolve();
      }

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Job status check timed out',
          'error'
        );
      });

      jest.useRealTimers();
    });
  });

  describe('End-to-End Async Flow', () => {
    it('should complete full async workflow from form submission to success', async () => {
      // Test the complete flow from issue creation to completion
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' }
        }
      });

      // Step 1: Create issue with skip review
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ skipReview: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ selectedRepo: 'owner/repo' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            markdown: '# Test Issue',
            summary: { type: 'feature' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            jobId: 'job-123',
            status: 'pending',
          }),
        });

      const { unmount } = render(<CreateIssuePage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/skip-review');
      });

      const promptInput = screen.getByLabelText(/describe your issue/i);
      const submitButton = screen.getByRole('button', { name: /generate issue/i });

      fireEvent.change(promptInput, {
        target: { value: 'Create async test feature' },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/create/processing');
      });

      unmount();

      // Step 2: Processing page polls for completion
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'job-123',
            status: 'processing',
            createdAt: new Date().toISOString(),
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'job-123',
            status: 'completed',
            result: {
              issueUrl: 'https://github.com/owner/repo/issues/123',
              issueNumber: 123,
              repository: 'owner/repo',
              title: 'Async Test Feature',
            },
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }),
        });

      render(<ProcessingPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/create/success');
      }, { timeout: 10000 });

      // Verify the complete flow worked
      expect(mockShowToast).toHaveBeenCalledWith(
        'Issue creation started! You can close this page.',
        'success'
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        'Issue published successfully!',
        'success'
      );
    });
  });
});