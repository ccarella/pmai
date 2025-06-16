import { NextRequest } from 'next/server';
import { checkRateLimit, getRateLimitHeaders, RateLimitResult } from '@/lib/utils/rate-limit';

// Mock NextRequest
function createMockRequest(headers: Record<string, string> = {}): NextRequest {
  return {
    headers: {
      get: (key: string) => headers[key] || null,
    },
  } as unknown as NextRequest;
}

describe('Rate Limiting', () => {
  // Store original setInterval
  const originalSetInterval = global.setInterval;
  
  beforeEach(() => {
    jest.useFakeTimers();
    // Clear the module cache to reset the store
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    global.setInterval = originalSetInterval;
  });

  describe('checkRateLimit', () => {
    it('allows requests within the rate limit', async () => {
      const { checkRateLimit } = await import('@/lib/utils/rate-limit');
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });
      
      const result = await checkRateLimit(request, 5, 60000);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('blocks requests exceeding the rate limit', async () => {
      const { checkRateLimit } = await import('@/lib/utils/rate-limit');
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });
      const limit = 3;
      
      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        const result = await checkRateLimit(request, limit, 60000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(limit - i - 1);
      }
      
      // Next request should be blocked
      const blockedResult = await checkRateLimit(request, limit, 60000);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });

    it('uses different limits for different IPs', async () => {
      const { checkRateLimit } = await import('@/lib/utils/rate-limit');
      const request1 = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });
      const request2 = createMockRequest({ 'x-forwarded-for': '192.168.1.2' });
      
      // Use up limit for first IP
      await checkRateLimit(request1, 1, 60000);
      await checkRateLimit(request1, 1, 60000);
      
      // Second IP should still be allowed
      const result = await checkRateLimit(request2, 1, 60000);
      expect(result.allowed).toBe(true);
    });

    it('handles requests without x-forwarded-for header', async () => {
      const { checkRateLimit } = await import('@/lib/utils/rate-limit');
      const request = createMockRequest({});
      
      const result = await checkRateLimit(request, 5, 60000);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('extracts first IP from x-forwarded-for with multiple IPs', async () => {
      const { checkRateLimit } = await import('@/lib/utils/rate-limit');
      const request = createMockRequest({ 
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1' 
      });
      
      const result = await checkRateLimit(request, 5, 60000);
      expect(result.allowed).toBe(true);
      
      // Make another request with same first IP but different chain
      const request2 = createMockRequest({ 
        'x-forwarded-for': '192.168.1.1, 10.0.0.2' 
      });
      const result2 = await checkRateLimit(request2, 5, 60000);
      expect(result2.remaining).toBe(3); // Same limit bucket
    });

    it('resets rate limit after window expires', async () => {
      const { checkRateLimit } = await import('@/lib/utils/rate-limit');
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });
      const windowMs = 60000; // 1 minute
      
      // Use up the limit
      await checkRateLimit(request, 1, windowMs);
      await checkRateLimit(request, 1, windowMs);
      
      // Should be blocked
      let result = await checkRateLimit(request, 1, windowMs);
      expect(result.allowed).toBe(false);
      
      // Fast forward past the window
      jest.advanceTimersByTime(windowMs + 1000);
      
      // Should be allowed again
      result = await checkRateLimit(request, 1, windowMs);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('uses default values when not provided', async () => {
      const { checkRateLimit } = await import('@/lib/utils/rate-limit');
      const request = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });
      
      const result = await checkRateLimit(request);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(19); // Default limit is 20
      expect(result.resetAt).toBeGreaterThan(Date.now() + 3500000); // Close to 1 hour
    });
  });

  describe('getRateLimitHeaders', () => {
    const mockResult: RateLimitResult = {
      allowed: true,
      remaining: 15,
      resetAt: new Date('2024-01-01T12:00:00Z').getTime(),
    };

    it('returns correct headers with default limit', () => {
      const headers = getRateLimitHeaders(mockResult);
      
      expect(headers).toEqual({
        'X-RateLimit-Limit': '20',
        'X-RateLimit-Remaining': '15',
        'X-RateLimit-Reset': '2024-01-01T12:00:00.000Z',
      });
    });

    it('uses environment variable for limit if set', () => {
      const originalEnv = process.env.RATE_LIMIT_REQUESTS_PER_HOUR;
      process.env.RATE_LIMIT_REQUESTS_PER_HOUR = '50';
      
      const headers = getRateLimitHeaders(mockResult);
      
      expect(headers['X-RateLimit-Limit']).toBe('50');
      
      // Restore original value
      if (originalEnv !== undefined) {
        process.env.RATE_LIMIT_REQUESTS_PER_HOUR = originalEnv;
      } else {
        delete process.env.RATE_LIMIT_REQUESTS_PER_HOUR;
      }
    });

    it('formats reset time as ISO string', () => {
      const headers = getRateLimitHeaders(mockResult);
      
      expect(headers['X-RateLimit-Reset']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Store cleanup', () => {
    it('cleans up expired entries periodically', async () => {
      // Re-import to get a fresh module with cleanup interval
      jest.isolateModules(async () => {
        const { checkRateLimit } = await import('@/lib/utils/rate-limit');
        const request1 = createMockRequest({ 'x-forwarded-for': '192.168.1.1' });
        const request2 = createMockRequest({ 'x-forwarded-for': '192.168.1.2' });
        
        // Create entries with short window
        await checkRateLimit(request1, 5, 1000); // 1 second window
        await checkRateLimit(request2, 5, 120000); // 2 minute window
        
        // Fast forward to trigger cleanup (cleanup runs every minute)
        jest.advanceTimersByTime(61000);
        
        // First entry should be cleaned up, second should remain
        const result1 = await checkRateLimit(request1, 5, 1000);
        const result2 = await checkRateLimit(request2, 5, 120000);
        
        expect(result1.remaining).toBe(4); // Fresh entry
        expect(result2.remaining).toBe(3); // Existing entry
      });
    });
  });
});