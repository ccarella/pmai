import fs from 'fs';
import path from 'path';

describe('Offline Pages', () => {
  describe('offline.html', () => {
    let offlineHtml: string;

    beforeAll(() => {
      const offlinePath = path.join(process.cwd(), 'public', 'offline.html');
      offlineHtml = fs.readFileSync(offlinePath, 'utf8');
    });

    it('should be valid HTML', () => {
      expect(offlineHtml).toContain('<!DOCTYPE html>');
      expect(offlineHtml).toContain('<html lang="en">');
      expect(offlineHtml).toContain('</html>');
    });

    it('should have proper meta tags', () => {
      expect(offlineHtml).toContain('<meta charset="UTF-8">');
      expect(offlineHtml).toContain('<meta name="viewport"');
    });

    it('should have proper title', () => {
      expect(offlineHtml).toContain('<title>Offline - GitHub Issue Generator</title>');
    });

    it('should contain Dracula theme colors', () => {
      expect(offlineHtml).toContain('--dracula-background: #282a36');
      expect(offlineHtml).toContain('--dracula-foreground: #f8f8f2');
      expect(offlineHtml).toContain('--dracula-purple: #bd93f9');
    });

    it('should have offline messaging', () => {
      expect(offlineHtml).toContain('You\'re Offline');
      expect(offlineHtml).toContain('not connected to the internet');
    });

    it('should have retry functionality', () => {
      expect(offlineHtml).toContain('Try Again');
      expect(offlineHtml).toContain('window.location.reload()');
    });

    it('should have proper styling', () => {
      expect(offlineHtml).toContain('min-height: 100vh');
      expect(offlineHtml).toContain('display: flex');
      expect(offlineHtml).toContain('align-items: center');
      expect(offlineHtml).toContain('justify-content: center');
    });
  });

  describe('offline images', () => {
    it('should have offline image files', () => {
      const offlineImageSvg = path.join(process.cwd(), 'public', 'offline-image.svg');
      const offlineImagePng = path.join(process.cwd(), 'public', 'offline-image.png');
      
      expect(fs.existsSync(offlineImageSvg)).toBe(true);
      expect(fs.existsSync(offlineImagePng)).toBe(true);
    });

    it('should have valid SVG content', () => {
      const offlineImageSvg = path.join(process.cwd(), 'public', 'offline-image.svg');
      const svgContent = fs.readFileSync(offlineImageSvg, 'utf8');
      
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svgContent).toContain('Image offline');
    });
  });
});