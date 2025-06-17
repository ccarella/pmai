import { authOptions } from '../auth';
import { githubConnections } from '../redis';
import { userProfiles } from '../services/user-storage';

jest.mock('next-auth/providers/github');
jest.mock('../redis');
jest.mock('../services/user-storage');

// Silence console.log in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});
afterAll(() => {
  console.log = originalConsoleLog;
});

describe('authOptions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('providers', () => {
    it('should have GitHub provider configured', () => {
      expect(authOptions.providers).toBeDefined();
      expect(Array.isArray(authOptions.providers)).toBe(true);
      expect(authOptions.providers.length).toBeGreaterThan(0);
    });
  });

  describe('callbacks', () => {
    describe('signIn', () => {
      const mockSet = jest.fn();
      const mockCreateOrUpdate = jest.fn();

      beforeEach(() => {
        (githubConnections.set as jest.Mock) = mockSet;
        (userProfiles.createOrUpdate as jest.Mock) = mockCreateOrUpdate;
      });

      it('should store GitHub connection and user profile on successful sign in', async () => {
        const user = {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
        };

        const account = {
          provider: 'github',
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          scope: 'read:user user:email repo',
        };

        const profile = {
          name: 'GitHub User',
          avatar_url: 'https://github.com/avatar.jpg',
        };

        const result = await authOptions.callbacks!.signIn!({ user, account, profile });

        expect(result).toBe(true);
        expect(mockSet).toHaveBeenCalledWith('user123', expect.objectContaining({
          id: 'user123',
          userId: 'user123',
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }));
        expect(mockCreateOrUpdate).toHaveBeenCalledWith('user123', {
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
        });
      });

      it('should handle users without refresh token', async () => {
        const user = {
          id: 'user123',
          email: 'test@example.com',
        };

        const account = {
          provider: 'github',
          access_token: 'test-access-token',
          // No refresh_token
        };

        const result = await authOptions.callbacks!.signIn!({ user, account, profile: {} });

        expect(result).toBe(true);
        expect(mockSet).toHaveBeenCalledWith('user123', expect.objectContaining({
          refreshToken: undefined,
        }));
      });

      it('should use profile data as fallback for user info', async () => {
        const user = {
          id: 'user123',
          // No email, name, or image
        };

        const account = {
          provider: 'github',
          access_token: 'test-access-token',
        };

        const profile = {
          name: 'Profile Name',
          avatar_url: 'https://profile.com/avatar.jpg',
        };

        await authOptions.callbacks!.signIn!({ user, account, profile });

        expect(mockCreateOrUpdate).toHaveBeenCalledWith('user123', {
          email: '',
          name: 'Profile Name',
          image: 'https://profile.com/avatar.jpg',
        });
      });

      it('should return true for non-GitHub providers', async () => {
        const user = { id: 'user123' };
        const account = {
          provider: 'google',
          access_token: 'test-access-token',
        };

        const result = await authOptions.callbacks!.signIn!({ user, account, profile: {} });

        expect(result).toBe(true);
        expect(mockSet).not.toHaveBeenCalled();
        expect(mockCreateOrUpdate).not.toHaveBeenCalled();
      });

      it('should return true when no access token is provided', async () => {
        const user = { id: 'user123' };
        const account = {
          provider: 'github',
          // No access_token
        };

        const result = await authOptions.callbacks!.signIn!({ user, account, profile: {} });

        expect(result).toBe(true);
        expect(mockSet).not.toHaveBeenCalled();
        expect(mockCreateOrUpdate).not.toHaveBeenCalled();
      });
    });

    describe('session', () => {
      it('should add user ID to session', async () => {
        const session = {
          user: {
            email: 'test@example.com',
            name: 'Test User',
          },
          expires: '2024-12-31',
        };

        const token = {
          sub: 'user123',
          email: 'test@example.com',
        };

        const result = await authOptions.callbacks!.session!({ session, token });

        expect(result).toEqual({
          user: {
            email: 'test@example.com',
            name: 'Test User',
            id: 'user123',
          },
          expires: '2024-12-31',
        });
      });

      it('should handle session without user', async () => {
        const session = {
          expires: '2024-12-31',
        };

        const token = {
          sub: 'user123',
        };

        const result = await authOptions.callbacks!.session!({ session, token });

        expect(result).toEqual({
          expires: '2024-12-31',
        });
      });
    });

    describe('jwt', () => {
      it('should add user ID to token on initial sign in', async () => {
        const token = {
          email: 'test@example.com',
        };

        const user = {
          id: 'user123',
          email: 'test@example.com',
        };

        const result = await authOptions.callbacks!.jwt!({ token, user });

        expect(result).toEqual({
          email: 'test@example.com',
          id: 'user123',
        });
      });

      it('should add access token to JWT token', async () => {
        const token = {
          id: 'user123',
        };

        const account = {
          access_token: 'test-access-token',
        };

        const result = await authOptions.callbacks!.jwt!({ token, account });

        expect(result).toEqual({
          id: 'user123',
          accessToken: 'test-access-token',
        });
      });

      it('should return token unchanged when no user or account', async () => {
        const token = {
          id: 'user123',
          email: 'test@example.com',
        };

        const result = await authOptions.callbacks!.jwt!({ token });

        expect(result).toEqual(token);
      });
    });
  });

  describe('pages', () => {
    it('should configure custom sign in and error pages', () => {
      expect(authOptions.pages).toEqual({
        signIn: '/settings',
        error: '/settings',
      });
    });
  });

  describe('secret', () => {
    it('should have a secret configured', () => {
      expect(authOptions.secret).toBeDefined();
      expect(typeof authOptions.secret).toBe('string');
      expect(authOptions.secret.length).toBeGreaterThan(0);
    });
  });
});