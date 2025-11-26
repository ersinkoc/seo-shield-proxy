import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/logger', () => ({
  Logger: class {
    info() {}
    error() {}
    warn() {}
    debug() {}
  }
}));

describe('ETagManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import ETagManager', async () => {
      const module = await import('../../src/admin/etag-manager');
      expect(module.ETagManager).toBeDefined();
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
    });

    it('should have hashAlgorithm as sha256', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      expect(config.hashAlgorithm).toBe('sha256');
    });

    it('should enable 304 responses', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      expect(config.enable304Responses).toBe(true);
    });

    it('should check content changes', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      expect(config.checkContentChanges).toBe(true);
    });

    it('should have ignored elements', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      expect(Array.isArray(config.ignoredElements)).toBe(true);
      expect(config.ignoredElements).toContain('script');
      expect(config.ignoredElements).toContain('style');
    });

    it('should have significant changes config', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      expect(config.significantChanges).toBeDefined();
      expect(config.significantChanges.minWordChange).toBe(50);
      expect(config.significantChanges.minStructureChange).toBe(10);
      expect(config.significantChanges.contentWeightThreshold).toBe(25);
    });
  });

  describe('constructor', () => {
    it('should create instance with config', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);
      expect(manager).toBeDefined();
    });

    it('should create instance with disabled config', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      config.enabled = false;
      const manager = new module.ETagManager(config);
      expect(manager).toBeDefined();
    });
  });

  describe('generateETag', () => {
    it('should generate ETag for HTML content', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const result = await manager.generateETag('<html><body>Test</body></html>', 'https://example.com');

      expect(result).toBeDefined();
      expect(result.etag).toBeDefined();
      expect(result.etag).toMatch(/^"[a-f0-9]+-[a-f0-9]+"/);
    });

    it('should return lastModified date', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const result = await manager.generateETag('<html><body>Test</body></html>', 'https://example.com');

      expect(result.lastModified).toBeDefined();
      expect(typeof result.lastModified).toBe('string');
    });

    it('should return content length', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const html = '<html><body>Test</body></html>';
      const result = await manager.generateETag(html, 'https://example.com');

      expect(result.contentLength).toBe(html.length);
    });

    it('should return hash values', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const result = await manager.generateETag('<html><body>Test</body></html>', 'https://example.com');

      expect(result.significantHash).toBeDefined();
      expect(result.structureHash).toBeDefined();
      expect(result.fullHash).toBeDefined();
    });

    it('should return empty etag when disabled', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      config.enabled = false;
      const manager = new module.ETagManager(config);

      const result = await manager.generateETag('<html><body>Test</body></html>', 'https://example.com');

      expect(result.etag).toBe('');
      expect(result.significantHash).toBe('');
      expect(result.structureHash).toBe('');
      expect(result.fullHash).toBe('');
    });

    it('should include timestamp', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const beforeTime = Date.now();
      const result = await manager.generateETag('<html><body>Test</body></html>', 'https://example.com');
      const afterTime = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(result.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should use md5 when configured', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      config.hashAlgorithm = 'md5';
      const manager = new module.ETagManager(config);

      const result = await manager.generateETag('<html><body>Test</body></html>', 'https://example.com');

      expect(result.etag).toBeDefined();
      expect(result.fullHash.length).toBe(32); // MD5 produces 32 hex characters
    });

    it('should generate different etags for different content', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const result1 = await manager.generateETag('<html><body>Content 1</body></html>', 'https://example.com/1');
      const result2 = await manager.generateETag('<html><body>Content 2</body></html>', 'https://example.com/2');

      expect(result1.fullHash).not.toBe(result2.fullHash);
    });

    it('should handle content with ignored elements', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const htmlWithScript = '<html><body>Test<script>console.log("test")</script></body></html>';
      const result = await manager.generateETag(htmlWithScript, 'https://example.com');

      expect(result.etag).toBeDefined();
      expect(result.significantHash).toBeDefined();
    });

    it('should normalize timestamps in content', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const html = '<html><body>Time: 2024-01-15T10:30:00Z</body></html>';
      const result = await manager.generateETag(html, 'https://example.com');

      expect(result.etag).toBeDefined();
    });
  });

  describe('compareETag', () => {
    it('should return not modified false when disabled', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      config.enabled = false;
      const manager = new module.ETagManager(config);

      const result = await manager.compareETag('https://example.com', '<html></html>');

      expect(result.notModified).toBe(false);
      expect(result.cacheable).toBe(true);
    });

    it('should return change type for new content', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const result = await manager.compareETag('https://example.com/new', '<html>New content</html>');

      expect(result.notModified).toBe(false);
      // After first compareETag, it caches the result, so subsequent comparisons will detect changes
      expect(['minor', 'significant', 'major']).toContain(result.changeType);
    });

    it('should return notModified true when If-None-Match matches', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      // First generate etag
      const html = '<html><body>Test content</body></html>';
      const firstResult = await manager.generateETag(html, 'https://example.com/match');

      // Then compare with same etag
      const result = await manager.compareETag(
        'https://example.com/match',
        html,
        firstResult.etag
      );

      expect(result.notModified).toBe(true);
      expect(result.changeType).toBe('none');
    });

    it('should return notModified true when If-Modified-Since is newer', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const html = '<html><body>Test content</body></html>';
      await manager.generateETag(html, 'https://example.com/modified');

      // Use a future date for If-Modified-Since
      const futureDate = new Date(Date.now() + 100000).toUTCString();

      const result = await manager.compareETag(
        'https://example.com/modified',
        html,
        undefined,
        futureDate
      );

      expect(result.notModified).toBe(true);
    });

    it('should return etag and lastModified in comparison', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const result = await manager.compareETag('https://example.com', '<html></html>');

      expect(result.etag).toBeDefined();
      expect(result.lastModified).toBeDefined();
    });

    it('should detect minor changes', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      // First content
      const html1 = '<html><body><p>Original content here</p></body></html>';
      await manager.generateETag(html1, 'https://example.com/minor');

      // Slightly different content
      const html2 = '<html><body><p>Original content changed</p></body></html>';
      const result = await manager.compareETag('https://example.com/minor', html2);

      expect(result.notModified).toBe(false);
      expect(['minor', 'significant', 'major']).toContain(result.changeType);
    });
  });

  describe('getCacheControlHeaders', () => {
    it('should return cache control headers', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const headers = manager.getCacheControlHeaders();

      expect(headers['Cache-Control']).toBeDefined();
      expect(headers['Last-Modified']).toBeDefined();
    });

    it('should return 24 hour cache for no changes', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const headers = manager.getCacheControlHeaders('none');

      expect(headers['Cache-Control']).toBe('public, max-age=86400');
    });

    it('should return 2 hour cache for minor changes', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const headers = manager.getCacheControlHeaders('minor');

      expect(headers['Cache-Control']).toBe('public, max-age=7200');
    });

    it('should return 30 minute cache for significant changes', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const headers = manager.getCacheControlHeaders('significant');

      expect(headers['Cache-Control']).toBe('public, max-age=1800');
    });

    it('should return 10 minute cache for major changes', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const headers = manager.getCacheControlHeaders('major');

      expect(headers['Cache-Control']).toBe('public, max-age=600');
    });

    it('should return default 1 hour cache for undefined changes', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const headers = manager.getCacheControlHeaders(undefined);

      expect(headers['Cache-Control']).toBe('public, max-age=3600');
    });
  });

  describe('cleanupCache', () => {
    it('should clean up old cache entries', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      // Add some entries
      await manager.generateETag('<html>1</html>', 'https://example.com/1');
      await manager.generateETag('<html>2</html>', 'https://example.com/2');

      const beforeStats = manager.getCacheStats();
      expect(beforeStats.totalEntries).toBe(2);

      // Wait a tiny bit and cleanup with 1ms maxAge
      await new Promise(resolve => setTimeout(resolve, 10));
      manager.cleanupCache(1);

      const stats = manager.getCacheStats();
      // Entries older than 1ms should be cleaned up
      expect(stats.totalEntries).toBe(0);
    });

    it('should keep recent entries', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      // Add entries
      await manager.generateETag('<html>Test</html>', 'https://example.com/recent');

      // Cleanup with long maxAge
      manager.cleanupCache(7 * 24 * 60 * 60 * 1000);

      const stats = manager.getCacheStats();
      expect(stats.totalEntries).toBe(1);
    });

    it('should use default maxAge when not provided', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      await manager.generateETag('<html>Test</html>', 'https://example.com');

      // Should not throw
      expect(() => manager.cleanupCache()).not.toThrow();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const stats = manager.getCacheStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalEntries).toBe('number');
    });

    it('should return zero for empty cache', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const stats = manager.getCacheStats();

      expect(stats.totalEntries).toBe(0);
    });

    it('should count cache entries', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      await manager.generateETag('<html>1</html>', 'https://example.com/1');
      await manager.generateETag('<html>2</html>', 'https://example.com/2');
      await manager.generateETag('<html>3</html>', 'https://example.com/3');

      const stats = manager.getCacheStats();

      expect(stats.totalEntries).toBe(3);
    });
  });

  describe('shouldCacheUrl', () => {
    it('should cache regular HTML pages', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      expect(manager.shouldCacheUrl('https://example.com/page')).toBe(true);
      expect(manager.shouldCacheUrl('https://example.com/products/item')).toBe(true);
    });

    it('should not cache API endpoints', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      expect(manager.shouldCacheUrl('https://example.com/api/data')).toBe(false);
      expect(manager.shouldCacheUrl('https://example.com/api/users/1')).toBe(false);
    });

    it('should not cache admin pages', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      expect(manager.shouldCacheUrl('https://example.com/admin/dashboard')).toBe(false);
      expect(manager.shouldCacheUrl('https://example.com/admin/settings')).toBe(false);
    });

    it('should not cache static assets', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      expect(manager.shouldCacheUrl('https://example.com/style.css')).toBe(false);
      expect(manager.shouldCacheUrl('https://example.com/script.js')).toBe(false);
      expect(manager.shouldCacheUrl('https://example.com/image.png')).toBe(false);
      expect(manager.shouldCacheUrl('https://example.com/image.jpg')).toBe(false);
      expect(manager.shouldCacheUrl('https://example.com/icon.svg')).toBe(false);
    });

    it('should not cache URLs with dynamic query parameters', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      expect(manager.shouldCacheUrl('https://example.com/page?random=123')).toBe(false);
      expect(manager.shouldCacheUrl('https://example.com/page?timestamp=123')).toBe(false);
      expect(manager.shouldCacheUrl('https://example.com/page?csrf=token')).toBe(false);
      expect(manager.shouldCacheUrl('https://example.com/page?session=abc')).toBe(false);
    });

    it('should not cache JSON files', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      expect(manager.shouldCacheUrl('https://example.com/data.json')).toBe(false);
      expect(manager.shouldCacheUrl('https://example.com/config.xml')).toBe(false);
    });
  });

  describe('hash algorithms', () => {
    it('should produce consistent hashes for same content', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const html = '<html><body>Consistent content</body></html>';
      const result1 = await manager.generateETag(html, 'https://example.com/a');
      const result2 = await manager.generateETag(html, 'https://example.com/b');

      expect(result1.fullHash).toBe(result2.fullHash);
    });

    it('should produce different structure hashes for different structures', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const html1 = '<html><body><div>Content</div></body></html>';
      const html2 = '<html><body><p>Content</p></body></html>';

      const result1 = await manager.generateETag(html1, 'https://example.com/1');
      const result2 = await manager.generateETag(html2, 'https://example.com/2');

      expect(result1.structureHash).not.toBe(result2.structureHash);
    });
  });

  describe('content change detection', () => {
    it('should handle content with data attributes', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const html = '<html><body><div data-id="123" data-value="456">Content</div></body></html>';
      const result = await manager.generateETag(html, 'https://example.com');

      expect(result.significantHash).toBeDefined();
    });

    it('should handle content with nonce values', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      const html = '<html><body><script nonce="abc123">console.log("test")</script></body></html>';
      const result = await manager.generateETag(html, 'https://example.com');

      expect(result.significantHash).toBeDefined();
    });

    it('should detect image changes', async () => {
      const module = await import('../../src/admin/etag-manager');
      const config = module.ETagManager.getDefaultConfig();
      const manager = new module.ETagManager(config);

      // First version
      await manager.generateETag('<html><body><img src="1.jpg"></body></html>', 'https://example.com/img');

      // Version with more images
      const result = await manager.compareETag(
        'https://example.com/img',
        '<html><body><img src="1.jpg"><img src="2.jpg"></body></html>'
      );

      expect(result.changeDetails?.newImages).toBeDefined();
    });
  });
});
