import { describe, it, expect, beforeEach, vi } from 'vitest';
import CacheRules from '../../src/cache-rules';

describe('CacheRules', () => {
  let cacheRules: CacheRules;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '',
        CACHE_PATTERNS: '',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      expect(cacheRules).toBeDefined();
    });

    it('should handle CACHE_BY_DEFAULT as string false', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: 'false',
        NO_CACHE_PATTERNS: '',
        CACHE_PATTERNS: '',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      const summary = cacheRules.getRulesSummary();
      expect(summary.cacheByDefault).toBe(false);
    });

    it('should parse NO_CACHE_PATTERNS', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '/api/*,/admin/*',
        CACHE_PATTERNS: '',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      const summary = cacheRules.getRulesSummary();
      expect(summary.noCachePatterns.length).toBe(2);
    });
  });

  describe('shouldCacheUrl', () => {
    it('should not cache URLs matching NO_CACHE_PATTERNS', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '/api/*',
        CACHE_PATTERNS: '',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      const decision = cacheRules.shouldCacheUrl('/api/users');
      expect(decision.shouldRender).toBe(false);
      expect(decision.shouldCache).toBe(false);
    });

    it('should cache URLs matching CACHE_PATTERNS', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: false,
        NO_CACHE_PATTERNS: '',
        CACHE_PATTERNS: '/products/*',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      const decision = cacheRules.shouldCacheUrl('/products/item-1');
      expect(decision.shouldRender).toBe(true);
      expect(decision.shouldCache).toBe(true);
    });

    it('should use default behavior when no patterns match', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '/api/*',
        CACHE_PATTERNS: '',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      const decision = cacheRules.shouldCacheUrl('/page/about');
      expect(decision.shouldRender).toBe(true);
      expect(decision.shouldCache).toBe(true);
    });
  });

  describe('shouldCacheHtml', () => {
    beforeEach(() => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '',
        CACHE_PATTERNS: '',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
    });

    it('should return true when meta tag says true', () => {
      const html = '<html><head><meta name="x-seo-shield-cache" content="true" /></head></html>';
      expect(cacheRules.shouldCacheHtml(html)).toBe(true);
    });

    it('should return false when meta tag says false', () => {
      const html = '<html><head><meta name="x-seo-shield-cache" content="false" /></head></html>';
      expect(cacheRules.shouldCacheHtml(html)).toBe(false);
    });

    it('should return true when no meta tag present', () => {
      const html = '<html><head><title>Test</title></head></html>';
      expect(cacheRules.shouldCacheHtml(html)).toBe(true);
    });
  });

  describe('getCacheDecision', () => {
    beforeEach(() => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '/api/*',
        CACHE_PATTERNS: '/products/*',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
    });

    it('should not render NO_CACHE URLs', () => {
      const decision = cacheRules.getCacheDecision('/api/users');
      expect(decision.shouldRender).toBe(false);
      expect(decision.shouldCache).toBe(false);
    });

    it('should respect meta tag override', () => {
      const html = '<meta name="x-seo-shield-cache" content="false" />';
      const decision = cacheRules.getCacheDecision('/page/about', html);
      expect(decision.shouldRender).toBe(true);
      expect(decision.shouldCache).toBe(false);
    });

    it('should work with null HTML parameter', () => {
      const decision = cacheRules.getCacheDecision('/products/item', null);
      expect(decision.shouldRender).toBe(true);
      expect(decision.shouldCache).toBe(true);
    });
  });

  describe('getRulesSummary', () => {
    it('should return complete rules summary', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '/api/*',
        CACHE_PATTERNS: '/products/*',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      const summary = cacheRules.getRulesSummary();
      expect(summary.noCachePatterns).toBeDefined();
      expect(summary.cachePatterns).toBeDefined();
      expect(summary.cacheByDefault).toBe(true);
      expect(summary.metaTagName).toBe('x-seo-shield-cache');
    });
  });

  describe('edge cases', () => {
    it('should handle invalid meta tag name and use default', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '',
        CACHE_PATTERNS: '',
        CACHE_META_TAG: 'invalid tag with spaces!'
      });
      const summary = cacheRules.getRulesSummary();
      expect(summary.metaTagName).toBe('x-seo-shield-cache');
    });

    it('should handle regex patterns with slash notation', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '/^api\\/v[0-9]+/',
        CACHE_PATTERNS: '',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      const summary = cacheRules.getRulesSummary();
      expect(summary.noCachePatterns.length).toBe(1);
    });

    it('should handle invalid regex patterns gracefully', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '/[invalid regex/',
        CACHE_PATTERNS: '',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      const summary = cacheRules.getRulesSummary();
      expect(summary.noCachePatterns.length).toBe(0);
    });

    it('should return no render for CACHE_PATTERNS with no match when cacheByDefault is false', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: false,
        NO_CACHE_PATTERNS: '',
        CACHE_PATTERNS: '/products/*',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      const decision = cacheRules.shouldCacheUrl('/page/about');
      expect(decision.shouldRender).toBe(true);
      expect(decision.shouldCache).toBe(false);
    });

    it('should handle empty patterns correctly', () => {
      cacheRules = new CacheRules({
        CACHE_BY_DEFAULT: true,
        NO_CACHE_PATTERNS: '   ,  ,   ',
        CACHE_PATTERNS: '',
        CACHE_META_TAG: 'x-seo-shield-cache'
      });
      const summary = cacheRules.getRulesSummary();
      expect(summary.noCachePatterns.length).toBe(0);
    });
  });
});
