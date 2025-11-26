import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimpleCache } from '../../src/cache/simple-cache';

describe('SimpleCache', () => {
  let cache: SimpleCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new SimpleCache(1000); // 1 second TTL
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create cache with default TTL', () => {
      const defaultCache = new SimpleCache();
      expect(defaultCache).toBeDefined();
    });

    it('should create cache with custom TTL', () => {
      const customCache = new SimpleCache(5000);
      expect(customCache).toBeDefined();
    });
  });

  describe('set', () => {
    it('should set a value in cache', () => {
      const result = cache.set('key1', 'value1');
      expect(result).toBe(true);
    });

    it('should reject invalid key (null)', () => {
      const result = cache.set(null as any, 'value');
      expect(result).toBe(false);
    });

    it('should reject invalid key (empty string)', () => {
      const result = cache.set('', 'value');
      expect(result).toBe(false);
    });

    it('should reject invalid key (non-string)', () => {
      const result = cache.set(123 as any, 'value');
      expect(result).toBe(false);
    });

    it('should reject invalid value (non-string)', () => {
      const result = cache.set('key', 123 as any);
      expect(result).toBe(false);
    });

    it('should reject empty value', () => {
      const result = cache.set('key', '');
      expect(result).toBe(false);
    });

    it('should reject value exceeding max size (10MB)', () => {
      const largeValue = 'x'.repeat(11 * 1024 * 1024);
      const result = cache.set('key', largeValue);
      expect(result).toBe(false);
    });

    it('should accept value at max size limit', () => {
      const maxValue = 'x'.repeat(10 * 1024 * 1024);
      const result = cache.set('key', maxValue);
      expect(result).toBe(true);
    });

    it('should set value with custom TTL', () => {
      const result = cache.set('key', 'value', 5000);
      expect(result).toBe(true);
    });

    it('should enforce max keys limit (1000)', () => {
      for (let i = 0; i < 1005; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      // After adding 1005 keys, should have max 1000
      const stats = cache.getStats();
      expect(stats.keys).toBeLessThanOrEqual(1000);
    });
  });

  describe('get', () => {
    it('should get existing value', () => {
      cache.set('key1', 'value1');
      const result = cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should return undefined for non-existent key', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return undefined for expired entry', () => {
      cache.set('key1', 'value1');
      vi.advanceTimersByTime(1500); // Advance past TTL
      const result = cache.get('key1');
      expect(result).toBeUndefined();
    });

    it('should return value before expiration', () => {
      cache.set('key1', 'value1');
      vi.advanceTimersByTime(500); // Within TTL
      const result = cache.get('key1');
      expect(result).toBe('value1');
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('key1', 'value1');
      const result = cache.delete('key1');
      expect(result).toBe(1);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return 0 for non-existent key', () => {
      const result = cache.delete('nonexistent');
      expect(result).toBe(0);
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', () => {
      cache.set('key1', 'value1');
      vi.advanceTimersByTime(1500);
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('flush', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.flush();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all non-expired entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      const all = cache.getAll();
      expect(all).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should exclude expired entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2', 500);
      vi.advanceTimersByTime(600);
      const all = cache.getAll();
      expect(all).toEqual({ key1: 'value1' });
    });
  });

  describe('getKeysByPattern', () => {
    it('should return keys matching pattern', () => {
      cache.set('user:1', 'value1');
      cache.set('user:2', 'value2');
      cache.set('post:1', 'value3');
      const keys = cache.getKeysByPattern('^user:');
      expect(keys).toContain('user:1');
      expect(keys).toContain('user:2');
      expect(keys).not.toContain('post:1');
    });

    it('should exclude expired keys', () => {
      cache.set('key1', 'value1', 500);
      cache.set('key2', 'value2');
      vi.advanceTimersByTime(600);
      const keys = cache.getKeysByPattern('.*');
      expect(keys).not.toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('deleteByPattern', () => {
    it('should delete keys matching pattern', () => {
      cache.set('user:1', 'value1');
      cache.set('user:2', 'value2');
      cache.set('post:1', 'value3');
      const deleted = cache.deleteByPattern('^user:');
      expect(deleted).toBe(2);
      expect(cache.get('user:1')).toBeUndefined();
      expect(cache.get('user:2')).toBeUndefined();
      expect(cache.get('post:1')).toBe('value3');
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      const stats = cache.getStats();
      expect(stats.keys).toBe(2);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.ksize).toBeGreaterThan(0);
      expect(stats.vsize).toBeGreaterThan(0);
    });

    it('should exclude expired entries from count', () => {
      cache.set('key1', 'value1', 500);
      cache.set('key2', 'value2');
      vi.advanceTimersByTime(600);
      const stats = cache.getStats();
      expect(stats.keys).toBe(1);
    });
  });
});
