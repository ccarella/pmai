import { NextResponse } from 'next/server';

export interface CacheConfig {
  maxAge?: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
  noCache?: boolean;
  private?: boolean;
}

export function withCacheHeaders(
  response: NextResponse,
  config: CacheConfig = {}
): NextResponse {
  const {
    maxAge = 0,
    staleWhileRevalidate = 0,
    mustRevalidate = false,
    noCache = false,
    private: isPrivate = false,
  } = config;

  if (noCache) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  const cacheDirectives: string[] = [];

  if (isPrivate) {
    cacheDirectives.push('private');
  } else {
    cacheDirectives.push('public');
  }

  if (maxAge > 0) {
    cacheDirectives.push(`max-age=${maxAge}`);
  }

  if (staleWhileRevalidate > 0) {
    cacheDirectives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  if (mustRevalidate) {
    cacheDirectives.push('must-revalidate');
  }

  response.headers.set('Cache-Control', cacheDirectives.join(', '));
  
  return response;
}

export const CACHE_CONFIGS = {
  // Short-lived, frequently changing data
  DYNAMIC: { maxAge: 60, staleWhileRevalidate: 300 }, // 1min cache, 5min stale
  
  // Medium-lived data
  STANDARD: { maxAge: 300, staleWhileRevalidate: 600 }, // 5min cache, 10min stale
  
  // Long-lived, infrequently changing data
  STATIC: { maxAge: 3600, staleWhileRevalidate: 7200 }, // 1hr cache, 2hr stale
  
  // Private user data
  PRIVATE: { maxAge: 300, staleWhileRevalidate: 600, private: true },
  
  // No cache for sensitive operations
  NO_CACHE: { noCache: true },
} as const;