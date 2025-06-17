declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    sw?: string;
    publicExcludes?: string[];
    buildExcludes?: RegExp[];
    runtimeCaching?: Array<{
      urlPattern: RegExp | string;
      handler: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate' | 'NetworkOnly' | 'CacheOnly';
      method?: string;
      options?: {
        cacheName?: string;
        expiration?: {
          maxEntries?: number;
          maxAgeSeconds?: number;
        };
        networkTimeoutSeconds?: number;
      };
    }>;
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
  export default withPWA;
}