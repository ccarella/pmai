import fs from 'fs';
import path from 'path';

describe('Service Worker', () => {
  let serviceWorkerContent: string;

  beforeAll(() => {
    const swPath = path.join(process.cwd(), 'public', 'sw.js');
    serviceWorkerContent = fs.readFileSync(swPath, 'utf8');
  });

  it('should import Workbox modules', () => {
    expect(serviceWorkerContent).toContain('importScripts');
    expect(serviceWorkerContent).toContain('workbox');
  });

  it('should have proper cache strategies', () => {
    // Check for different caching strategies
    expect(serviceWorkerContent).toContain('NetworkFirst');
    expect(serviceWorkerContent).toContain('StaleWhileRevalidate');
    expect(serviceWorkerContent).toContain('CacheFirst');
  });

  it('should cache static resources', () => {
    expect(serviceWorkerContent).toContain('static');
    expect(serviceWorkerContent).toContain('precacheAndRoute');
  });

  it('should cache images', () => {
    expect(serviceWorkerContent).toContain('static-image-assets');
    expect(serviceWorkerContent).toContain('jpg|jpeg|gif|png|svg|ico|webp');
  });

  it('should cache API routes', () => {
    expect(serviceWorkerContent).toContain('apis');
    expect(serviceWorkerContent).toContain('/api/');
  });

  it('should cache Google Fonts', () => {
    expect(serviceWorkerContent).toContain('google-fonts-stylesheets');
    expect(serviceWorkerContent).toContain('google-fonts-webfonts');
    // Check for font file extensions which indicate font caching
    expect(serviceWorkerContent).toContain('eot|otf|ttc|ttf|woff|woff2');
  });

  it('should have offline assets precached', () => {
    expect(serviceWorkerContent).toContain('/offline.html');
    expect(serviceWorkerContent).toContain('/offline-image.png');
  });

  it('should skip waiting and claim clients', () => {
    expect(serviceWorkerContent).toContain('skipWaiting');
    expect(serviceWorkerContent).toContain('clientsClaim');
  });

  it('should have proper expiration settings', () => {
    expect(serviceWorkerContent).toContain('ExpirationPlugin');
    expect(serviceWorkerContent).toContain('maxEntries');
    expect(serviceWorkerContent).toContain('maxAgeSeconds');
  });
});