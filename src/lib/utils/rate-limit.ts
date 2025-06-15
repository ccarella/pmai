import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory store for rate limiting (in production, use Redis or similar)
const store: RateLimitStore = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}, 60000); // Clean up every minute

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  request: NextRequest,
  limit: number = 20,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): Promise<RateLimitResult> {
  // Get client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  const key = `rate-limit:${ip}`;
  const now = Date.now();
  const resetAt = now + windowMs;

  // Get or create rate limit entry
  if (!store[key] || store[key].resetAt < now) {
    store[key] = {
      count: 0,
      resetAt,
    };
  }

  const entry = store[key];
  entry.count++;

  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '20',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };
}