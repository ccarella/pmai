import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RepositoryProvider, useRepository } from '../RepositoryContext';

// Mock next modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('RepositoryContext', () => {
  const mockRouter = {
    refresh: jest.fn(),
  };

  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
    (global.fetch as jest.Mock).mockReset();
  });

  describe('useRepository hook', () => {
    it('should throw error when used outside RepositoryProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderHook(() => useRepository());
      }).toThrow('useRepository must be used within a RepositoryProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide repository context when used within provider', async () => {
      const mockSelectedRepo = 'owner/repo';
      const mockAddedRepos = [
        {
          id: 1,
          name: 'repo',
          full_name: 'owner/repo',
          private: false,
          owner: { login: 'owner' },
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ selectedRepo: mockSelectedRepo }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ repositories: mockAddedRepos }),
        });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedRepo).toBe(mockSelectedRepo);
      expect(result.current.addedRepos).toEqual(mockAddedRepos);
    });
  });

  describe('switchRepository', () => {
    it('should switch repository successfully', async () => {
      const mockSelectedRepo = 'owner/repo';
      const mockNewRepo = 'owner/new-repo';
      const mockAddedRepos = [
        {
          id: 1,
          name: 'repo',
          full_name: 'owner/repo',
          private: false,
          owner: { login: 'owner' },
        },
        {
          id: 2,
          name: 'new-repo',
          full_name: 'owner/new-repo',
          private: false,
          owner: { login: 'owner' },
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ selectedRepo: mockSelectedRepo }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ repositories: mockAddedRepos }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const eventListenerSpy = jest.spyOn(window, 'dispatchEvent');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.switchRepository(mockNewRepo);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/github/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedRepo: mockNewRepo }),
      });

      expect(result.current.selectedRepo).toBe(mockNewRepo);
      expect(mockRouter.refresh).toHaveBeenCalled();
      
      // Check that custom event was dispatched
      expect(eventListenerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'repository-switched',
          detail: { repository: mockNewRepo },
        })
      );

      eventListenerSpy.mockRestore();
    });

    it('should handle switch repository error', async () => {
      const mockSelectedRepo = 'owner/repo';
      const mockNewRepo = 'owner/new-repo';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ selectedRepo: mockSelectedRepo }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ repositories: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to switch' }),
        });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.switchRepository(mockNewRepo);
        })
      ).rejects.toThrow('Failed to switch repository');

      // Repository should not change on error
      expect(result.current.selectedRepo).toBe(mockSelectedRepo);
      expect(mockRouter.refresh).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('refreshRepositories', () => {
    it('should refresh repository data', async () => {
      const mockSelectedRepo = 'owner/repo';
      const mockAddedRepos = [
        {
          id: 1,
          name: 'repo',
          full_name: 'owner/repo',
          private: false,
          owner: { login: 'owner' },
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ selectedRepo: mockSelectedRepo }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ repositories: mockAddedRepos }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ selectedRepo: 'owner/updated-repo' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ repositories: [...mockAddedRepos, {
            id: 2,
            name: 'new-repo',
            full_name: 'owner/new-repo',
            private: true,
            owner: { login: 'owner' },
          }] }),
        });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.selectedRepo).toBe(mockSelectedRepo);
      expect(result.current.addedRepos).toHaveLength(1);

      await act(async () => {
        await result.current.refreshRepositories();
      });

      expect(result.current.selectedRepo).toBe('owner/updated-repo');
      expect(result.current.addedRepos).toHaveLength(2);
    });
  });

  describe('without session', () => {
    it('should not fetch data when no session', async () => {
      (useSession as jest.Mock).mockReturnValue({ data: null });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RepositoryProvider>{children}</RepositoryProvider>
      );

      const { result } = renderHook(() => useRepository(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.selectedRepo).toBeNull();
      expect(result.current.addedRepos).toEqual([]);
    });
  });
});