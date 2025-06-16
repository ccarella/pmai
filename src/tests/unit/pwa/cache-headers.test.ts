import { withCacheHeaders, CACHE_CONFIGS } from '@/lib/utils/cache-headers';

describe('Cache Headers Utility', () => {
  let mockResponse: { headers: Map<string, string> };

  beforeEach(() => {
    mockResponse = {
      headers: new Map(),
    };
  });

  describe('withCacheHeaders', () => {
    it('should set no-cache headers when noCache is true', () => {
      const result = withCacheHeaders(mockResponse, { noCache: true });
      
      expect(result.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(result.headers.get('Pragma')).toBe('no-cache');
      expect(result.headers.get('Expires')).toBe('0');
    });

    it('should set public cache headers by default', () => {
      const result = withCacheHeaders(mockResponse, { maxAge: 300 });
      
      expect(result.headers.get('Cache-Control')).toBe('public, max-age=300');
    });

    it('should set private cache headers when private is true', () => {
      const result = withCacheHeaders(mockResponse, { maxAge: 300, private: true });
      
      expect(result.headers.get('Cache-Control')).toBe('private, max-age=300');
    });

    it('should set stale-while-revalidate', () => {
      const result = withCacheHeaders(mockResponse, { 
        maxAge: 300, 
        staleWhileRevalidate: 600 
      });
      
      expect(result.headers.get('Cache-Control')).toBe('public, max-age=300, stale-while-revalidate=600');
    });

    it('should set must-revalidate when specified', () => {
      const result = withCacheHeaders(mockResponse, { 
        maxAge: 300, 
        mustRevalidate: true 
      });
      
      expect(result.headers.get('Cache-Control')).toBe('public, max-age=300, must-revalidate');
    });

    it('should handle multiple directives', () => {
      const result = withCacheHeaders(mockResponse, {
        maxAge: 3600,
        staleWhileRevalidate: 7200,
        mustRevalidate: true,
        private: true,
      });
      
      expect(result.headers.get('Cache-Control')).toBe('private, max-age=3600, stale-while-revalidate=7200, must-revalidate');
    });
  });

  describe('CACHE_CONFIGS', () => {
    it('should have DYNAMIC config', () => {
      expect(CACHE_CONFIGS.DYNAMIC).toEqual({
        maxAge: 60,
        staleWhileRevalidate: 300,
      });
    });

    it('should have STANDARD config', () => {
      expect(CACHE_CONFIGS.STANDARD).toEqual({
        maxAge: 300,
        staleWhileRevalidate: 600,
      });
    });

    it('should have STATIC config', () => {
      expect(CACHE_CONFIGS.STATIC).toEqual({
        maxAge: 3600,
        staleWhileRevalidate: 7200,
      });
    });

    it('should have PRIVATE config', () => {
      expect(CACHE_CONFIGS.PRIVATE).toEqual({
        maxAge: 300,
        staleWhileRevalidate: 600,
        private: true,
      });
    });

    it('should have NO_CACHE config', () => {
      expect(CACHE_CONFIGS.NO_CACHE).toEqual({
        noCache: true,
      });
    });
  });
});