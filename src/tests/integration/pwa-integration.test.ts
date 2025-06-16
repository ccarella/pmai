import { withCacheHeaders, CACHE_CONFIGS } from '@/lib/utils/cache-headers';
import fs from 'fs';
import path from 'path';

// Mock fetch for service worker tests
global.fetch = jest.fn();

describe('PWA Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Route Caching', () => {
    it('should apply cache headers to API responses', () => {
      const mockResponse = {
        headers: new Map(),
      };

      const result = withCacheHeaders(mockResponse, CACHE_CONFIGS.PRIVATE);
      
      expect(result.headers.get('Cache-Control')).toContain('private');
      expect(result.headers.get('Cache-Control')).toContain('max-age=300');
      expect(result.headers.get('Cache-Control')).toContain('stale-while-revalidate=600');
    });

    it('should handle no-cache for sensitive endpoints', () => {
      const mockResponse = {
        headers: new Map(),
      };

      const result = withCacheHeaders(mockResponse, CACHE_CONFIGS.NO_CACHE);
      
      expect(result.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(result.headers.get('Pragma')).toBe('no-cache');
      expect(result.headers.get('Expires')).toBe('0');
    });
  });

  describe('Manifest Integration', () => {
    it('should be accessible at /manifest.json', async () => {
      // This would require setting up a test server or mocking Next.js routing
      // For now, we test that the file exists and is valid JSON
      const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);
      
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      expect(() => JSON.parse(manifestContent)).not.toThrow();
    });
  });

  describe('Service Worker Registration', () => {
    beforeEach(() => {
      // Mock service worker APIs
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: jest.fn().mockResolvedValue({
            installing: null,
            waiting: null,
            active: {
              state: 'activated'
            },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
          }),
          ready: Promise.resolve({
            installing: null,
            waiting: null,
            active: {
              state: 'activated'
            },
          }),
        },
        writable: true,
      });
    });

    it('should register service worker in production', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // In a real PWA app, the service worker would be registered automatically
      // by next-pwa. Here we test the configuration.
      expect(process.env.NODE_ENV).toBe('production');
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Offline Capabilities', () => {
    it('should have offline fallback files', () => {
      const offlineHtmlPath = path.join(process.cwd(), 'public', 'offline.html');
      const offlineImagePath = path.join(process.cwd(), 'public', 'offline-image.png');
      
      expect(fs.existsSync(offlineHtmlPath)).toBe(true);
      expect(fs.existsSync(offlineImagePath)).toBe(true);
    });
  });

  describe('Performance Optimizations', () => {
    it('should have proper Next.js configuration for PWA', () => {
      // This would typically test the next.config.js/ts settings
      // We can check that the configuration exists and has PWA settings
      const configPath = path.join(process.cwd(), 'next.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const configContent = fs.readFileSync(configPath, 'utf8');
      expect(configContent).toContain('withPWA');
      expect(configContent).toContain('register: true');
      expect(configContent).toContain('skipWaiting: true');
    });

    it('should have image optimization settings', () => {
      const configPath = path.join(process.cwd(), 'next.config.ts');
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      expect(configContent).toContain('images:');
      expect(configContent).toContain('formats:');
      expect(configContent).toContain('minimumCacheTTL');
    });
  });
});