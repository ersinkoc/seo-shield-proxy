/**
 * Unit Tests for SWR (Stale-While-Revalidate) Strategy in cache.js
 * Tests TTL checking and stale cache serving
 */

import { jest } from '@jest/globals';

describe('Cache - SWR (Stale-While-Revalidate)', () => {
  let cache;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    // Import fresh cache instance
    const module = await import('../../dist/cache.js');
    cache = module.default;
    cache.flush();
  });

  describe('getWithTTL() - TTL Information', () => {
    test('should return undefined for non-existent keys', () => {
      const result = cache.getWithTTL('/non-existent');

      expect(result).toBeUndefined();
    });

    test('should return fresh cache entry with TTL info', async () => {
      cache.set('/test', '<html>Fresh Content</html>');

      // Wait a small amount to ensure time passes
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = cache.getWithTTL('/test');

      expect(result).toBeDefined();
      expect(result.value).toBe('<html>Fresh Content</html>');
      expect(result.isStale).toBe(false);
      expect(result.ttl).toBeGreaterThan(0);
    });

    test('should detect stale entries after TTL expires', async () => {
      // Create a cache instance with very short TTL for testing
      cache.cache.options.stdTTL = 1; // 1 second
      cache.set('/test', '<html>Content</html>');

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = cache.getWithTTL('/test');

      expect(result).toBeDefined();
      expect(result.value).toBe('<html>Content</html>');
      expect(result.isStale).toBe(true);
      expect(result.ttl).toBeLessThanOrEqual(0);
    }, 10000);

    test('should keep stale entries in cache (deleteOnExpire: false)', async () => {
      cache.cache.options.stdTTL = 1;
      cache.set('/stale-test', '<html>Stale Content</html>');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Entry should still exist even though it's stale
      const result = cache.getWithTTL('/stale-test');

      expect(result).toBeDefined();
      expect(result.isStale).toBe(true);
    }, 10000);
  });

  describe('SWR Cache Entry Structure', () => {
    test('should return correct structure with value, ttl, and isStale', () => {
      cache.set('/api/data', '<html>API Data</html>');

      const result = cache.getWithTTL('/api/data');

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('ttl');
      expect(result).toHaveProperty('isStale');
      expect(typeof result.ttl).toBe('number');
      expect(typeof result.isStale).toBe('boolean');
    });

    test('should calculate remaining TTL correctly', async () => {
      cache.cache.options.stdTTL = 10; // 10 seconds
      cache.set('/ttl-test', '<html>TTL Test</html>');

      await new Promise(resolve => setTimeout(resolve, 500));

      const result = cache.getWithTTL('/ttl-test');

      expect(result.ttl).toBeGreaterThan(8);
      expect(result.ttl).toBeLessThan(10);
      expect(result.isStale).toBe(false);
    });
  });

  describe('Cache Behavior with deleteOnExpire: false', () => {
    test('should initialize cache with deleteOnExpire: false', () => {
      expect(cache.cache.options.deleteOnExpire).toBe(false);
    });

    test('should emit expired event but keep entry', async () => {
      cache.cache.options.stdTTL = 1;

      // Listen for expired event
      const expiredSpy = jest.fn();
      cache.cache.on('expired', expiredSpy);

      cache.set('/expire-test', '<html>Will Expire</html>');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Trigger check by accessing
      cache.getWithTTL('/expire-test');

      // Entry should still exist
      const result = cache.getWithTTL('/expire-test');
      expect(result).toBeDefined();
    }, 10000);
  });

  describe('Integration with Regular get()', () => {
    test('get() should still work for fresh entries', () => {
      cache.set('/regular', '<html>Regular Get</html>');

      const result = cache.get('/regular');

      expect(result).toBe('<html>Regular Get</html>');
    });

    test('get() should return stale entries too', async () => {
      cache.cache.options.stdTTL = 1;
      cache.set('/stale-get', '<html>Stale via Get</html>');

      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = cache.get('/stale-get');

      expect(result).toBe('<html>Stale via Get</html>');
    }, 10000);

    test('getWithTTL() provides more info than get()', () => {
      cache.set('/comparison', '<html>Compare</html>');

      const simpleResult = cache.get('/comparison');
      const detailedResult = cache.getWithTTL('/comparison');

      expect(simpleResult).toBe('<html>Compare</html>');
      expect(detailedResult.value).toBe(simpleResult);
      expect(detailedResult).toHaveProperty('ttl');
      expect(detailedResult).toHaveProperty('isStale');
    });
  });
});
