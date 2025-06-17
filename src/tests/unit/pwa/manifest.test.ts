import fs from 'fs';
import path from 'path';

interface ManifestIcon {
  sizes: string;
  src: string;
  type: string;
  purpose?: string;
}

interface ManifestShortcut {
  name: string;
  url: string;
  description?: string;
}

interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
  shortcuts: ManifestShortcut[];
  categories: string[];
}

describe('PWA Manifest', () => {
  let manifest: PWAManifest;

  beforeAll(() => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(manifestContent);
  });

  it('should have required fields', () => {
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.description).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.background_color).toBeDefined();
    expect(manifest.theme_color).toBeDefined();
  });

  it('should have proper display mode', () => {
    expect(manifest.display).toBe('standalone');
  });

  it('should have valid colors', () => {
    expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('should have icons array with required sizes', () => {
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
    
    const iconSizes = manifest.icons.map((icon) => icon.sizes);
    expect(iconSizes).toContain('192x192');
    expect(iconSizes).toContain('512x512');
  });

  it('should have valid start URL', () => {
    expect(manifest.start_url).toBe('/');
  });

  it('should have shortcuts defined', () => {
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect(manifest.shortcuts.length).toBeGreaterThan(0);
    
    const shortcut = manifest.shortcuts[0];
    expect(shortcut.name).toBeDefined();
    expect(shortcut.url).toBeDefined();
  });

  it('should have proper categories', () => {
    expect(Array.isArray(manifest.categories)).toBe(true);
    expect(manifest.categories).toContain('productivity');
    expect(manifest.categories).toContain('developer');
  });
});