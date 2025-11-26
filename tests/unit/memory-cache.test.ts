import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryCache } from '../../src/cache/memory-cache';

// Mock config
vi.mock('../../src/config', () => ({
  default: {
    CACHE_TTL: 60,
    PORT: 8080,
    TARGET_URL: 'http://localhost:3000'
  }
}));

// Mock SimpleCache using a class
vi.mock('../../src/cache/simple-cache', () => {
  return {
    SimpleCache: class MockSimpleCache {
      get(key) { return key === 'existing' ? 'value' : undefined; }
      set() { return true; }
      delete() { return 1; }
      flush() {}
      getStats() { return { keys: 5, hits: 10, misses: 2, size: 100, ksize: 50, vsize: 100 }; }
      getKeysByPattern() { return ['key1', 'key2']; }
      getAll() { return { key1: 'value1', key2: 'value2' }; }
    }
  };
});

describe('MemoryCache', () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  describe('constructor', () => {
    it('should create cache instance', () => {
      expect(cache).toBeDefined();
    });

    it('should be ready after construction', () => {
      expect(cache.isReady()).toBe(true);
    });
  });

  describe('get', () => {
    it('should return value for existing key', () => {
      const result = cache.get('existing');
      expect(result).toBe('value');
    });

    it('should return undefined for non-existing key', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getWithTTL', () => {
    it('should return entry with TTL for existing key', () => {
      const result = cache.getWithTTL('existing');
      expect(result).toBeDefined();
      expect(result.value).toBe('value');
      expect(result.ttl).toBe(60);
      expect(result.isStale).toBe(false);
    });

    it('should return undefined for non-existing key', () => {
      const result = cache.getWithTTL('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value in cache', () => {
      const result = cache.set('key', 'value');
      expect(result).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete key from cache', () => {
      const result = cache.delete('key');
      expect(result).toBe(1);
    });
  });

  describe('flush', () => {
    it('should flush all entries', () => {
      expect(() => cache.flush()).not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      const stats = cache.getStats();
      expect(stats).toBeDefined();
      expect(stats.keys).toBe(5);
      expect(stats.hits).toBe(10);
      expect(stats.misses).toBe(2);
    });
  });

  describe('keys', () => {
    it('should return all keys', () => {
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('getAllEntries', () => {
    it('should return all entries with metadata', () => {
      const entries = cache.getAllEntries();
      expect(entries).toBeDefined();
      expect(entries.length).toBe(2);
      expect(entries[0].url).toBe('key1');
      expect(entries[0].size).toBe(6);
    });
  });

  describe('isReady', () => {
    it('should return true when ready', () => {
      expect(cache.isReady()).toBe(true);
    });
  });

  describe('close', () => {
    it('should close cache and set ready to false', async () => {
      await cache.close();
      expect(cache.isReady()).toBe(false);
    });
  });

  describe('async methods', () => {
    it('getAsync should return value', async () => {
      const result = await cache.getAsync('existing');
      expect(result).toBe('value');
    });

    it('setAsync should set value', async () => {
      const result = await cache.setAsync('key', 'value');
      expect(result).toBe(true);
    });

    it('deleteAsync should delete key', async () => {
      const result = await cache.deleteAsync('key');
      expect(result).toBe(1);
    });

    it('flushAsync should flush cache', async () => {
      await expect(cache.flushAsync()).resolves.not.toThrow();
    });

    it('getWithTTLAsync should return entry', async () => {
      const result = await cache.getWithTTLAsync('existing');
      expect(result.value).toBe('value');
    });

    it('getStatsAsync should return stats', async () => {
      const stats = await cache.getStatsAsync();
      expect(stats.keys).toBe(5);
    });

    it('keysAsync should return keys', async () => {
      const keys = await cache.keysAsync();
      expect(keys).toContain('key1');
    });

    it('getAllEntriesAsync should return entries', async () => {
      const entries = await cache.getAllEntriesAsync();
      expect(entries.length).toBe(2);
    });
  });
});
