import { GET, POST } from '../route';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

jest.mock('next-auth');
jest.mock('@/lib/auth', () => ({
  authOptions: {
    providers: [],
    callbacks: {},
    pages: {},
    secret: 'test-secret',
  }
}));

describe('/api/auth/[...nextauth] route', () => {
  let mockHandler: jest.Mock;

  beforeEach(() => {
    mockHandler = jest.fn();
    (NextAuth as jest.Mock).mockReturnValue(mockHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create NextAuth handler with authOptions', () => {
    // Import triggers the NextAuth call
    expect(NextAuth).toHaveBeenCalledWith(authOptions);
  });

  it('should export GET handler', () => {
    expect(GET).toBe(mockHandler);
  });

  it('should export POST handler', () => {
    expect(POST).toBe(mockHandler);
  });

  it('should use the same handler for both GET and POST', () => {
    expect(GET).toBe(POST);
  });
});