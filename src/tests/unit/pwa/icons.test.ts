import fs from 'fs';
import path from 'path';

describe('PWA Icons', () => {
  const iconSizes = ['192x192', '512x512'];

  describe('required icon files', () => {
    it('should have all required icon sizes', () => {
      iconSizes.forEach(size => {
        const iconPath = path.join(process.cwd(), 'public', `icon-${size}.png`);
        expect(fs.existsSync(iconPath)).toBe(true);
      });
    });

    it('should have apple touch icon', () => {
      const appleTouchIconPath = path.join(process.cwd(), 'public', 'apple-touch-icon.png');
      expect(fs.existsSync(appleTouchIconPath)).toBe(true);
    });

    it('should have source SVG icon', () => {
      const iconSvgPath = path.join(process.cwd(), 'public', 'icon.svg');
      expect(fs.existsSync(iconSvgPath)).toBe(true);
    });

    it('should have valid SVG icon content', () => {
      const iconSvgPath = path.join(process.cwd(), 'public', 'icon.svg');
      const svgContent = fs.readFileSync(iconSvgPath, 'utf8');
      
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('width="512"');
      expect(svgContent).toContain('height="512"');
      expect(svgContent).toContain('#bd93f9'); // Dracula purple
      expect(svgContent).toContain('#f8f8f2'); // Dracula foreground
    });
  });

  describe('icon file sizes', () => {
    it('should have reasonable file sizes', () => {
      iconSizes.forEach(size => {
        const iconPath = path.join(process.cwd(), 'public', `icon-${size}.png`);
        const stats = fs.statSync(iconPath);
        
        // Icons should not be empty and should be reasonable size (not too large)
        expect(stats.size).toBeGreaterThan(0);
        expect(stats.size).toBeLessThan(50 * 1024); // Less than 50KB
      });
    });

    it('should have reasonable apple touch icon size', () => {
      const appleTouchIconPath = path.join(process.cwd(), 'public', 'apple-touch-icon.png');
      const stats = fs.statSync(appleTouchIconPath);
      
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.size).toBeLessThan(50 * 1024); // Less than 50KB
    });
  });

  describe('icon consistency', () => {
    it('should have consistent naming pattern', () => {
      iconSizes.forEach(size => {
        const iconPath = path.join(process.cwd(), 'public', `icon-${size}.png`);
        expect(fs.existsSync(iconPath)).toBe(true);
      });
    });

    it('should have proper file extensions', () => {
      const iconFiles = [
        'icon-192x192.png',
        'icon-512x512.png',
        'apple-touch-icon.png',
        'icon.svg'
      ];

      iconFiles.forEach(filename => {
        const iconPath = path.join(process.cwd(), 'public', filename);
        expect(fs.existsSync(iconPath)).toBe(true);
      });
    });
  });
});