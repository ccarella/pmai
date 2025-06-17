import '@testing-library/jest-dom';

// Mock crypto module
const crypto = require('crypto');
Object.defineProperty(global, 'crypto', {
  value: {
    ...crypto,
    randomBytes: jest.fn((size: number) => Buffer.from('test-iv-1234567890123456'.repeat(10).slice(0, size * 2), 'hex')),
  },
});

// Mock NextRequest and NextResponse globally
global.Request = class Request {
  constructor(url: string, init?: RequestInit) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body;
  }

  url: string;
  method: string;
  headers: Headers;
  body: any;

  async json() {
    return JSON.parse(this.body);
  }
} as any;

// Mock next-auth module
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));