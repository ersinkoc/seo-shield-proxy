import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock client with event emitter behavior
const eventHandlers: Record<string, Function[]> = {};

const mockRedisClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  quit: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  setEx: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  ttl: vi.fn(),
  flushDb: vi.fn(),
  dbSize: vi.fn(),
  info: vi.fn(),
  on: vi.fn((event: string, handler: Function) => {
    if (!eventHandlers[event]) {
      eventHandlers[event] = [];
    }
    eventHandlers[event].push(handler);
    // Automatically trigger 'ready' event for new instances
    if (event === 'ready') {
      setTimeout(() => handler(), 0);
    }
    return mockRedisClient;
  }),
  isOpen: true
};

vi.mock('redis', () => ({
  createClient: vi.fn().mockReturnValue(mockRedisClient)
}));

describe('RedisCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset event handlers
    Object.keys(eventHandlers).forEach(key => delete eventHandlers[key]);
    // Reset mock implementations
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.setEx.mockResolvedValue('OK');
    mockRedisClient.del.mockResolvedValue(1);
    mockRedisClient.keys.mockResolvedValue([]);
    mockRedisClient.ttl.mockResolvedValue(3600);
    mockRedisClient.flushDb.mockResolvedValue('OK');
    mockRedisClient.dbSize.mockResolvedValue(0);
    mockRedisClient.info.mockResolvedValue('keyspace_hits:100\nkeyspace_misses:50');
    mockRedisClient.connect.mockResolvedValue(undefined);
    mockRedisClient.quit.mockResolvedValue(undefined);
  });

  describe('module import', () => {
    it('should import RedisCache', async () => {
      const module = await import('../../src/cache/redis-cache');
      expect(module.RedisCache).toBeDefined();
    });
  });

  describe('constructor', () => {
    it('should create instance with redis URL', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      expect(cache).toBeDefined();
    });

    it('should setup event handlers', async () => {
      const module = await import('../../src/cache/redis-cache');
      new module.RedisCache('redis://localhost:6379');

      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
    });

    it('should call connect', async () => {
      const module = await import('../../src/cache/redis-cache');
      new module.RedisCache('redis://localhost:6379');

      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle connect error', async () => {
      mockRedisClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const module = await import('../../src/cache/redis-cache');
      // Should not throw
      expect(() => new module.RedisCache('redis://localhost:6379')).not.toThrow();
    });
  });

  describe('isReady', () => {
    it('should return ready status', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      // Wait for ready event
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(typeof cache.isReady()).toBe('boolean');
    });
  });

  describe('get (sync)', () => {
    it('should return undefined and warn when called synchronously', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = cache.get('test-key');

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return undefined when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      // Don't wait for ready

      const result = cache.get('test-key');
      expect(result).toBeUndefined();
    });
  });

  describe('getWithTTL (sync)', () => {
    it('should return undefined and warn when called synchronously', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = cache.getWithTTL('test-key');

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return undefined when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const result = cache.getWithTTL('test-key');
      expect(result).toBeUndefined();
    });
  });

  describe('getAsync', () => {
    it('should return undefined when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      // Don't wait for ready

      const result = await cache.getAsync('test-key');
      expect(result).toBeUndefined();
    });

    it('should return value on cache hit', async () => {
      mockRedisClient.get.mockResolvedValue('cached-value');

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.getAsync('test-key');

      expect(result).toBe('cached-value');
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return undefined on cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.getAsync('test-key');

      expect(result).toBeUndefined();
    });

    it('should handle get errors', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Get failed'));

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.getAsync('test-key');

      expect(result).toBeUndefined();
    });
  });

  describe('getWithTTLAsync', () => {
    it('should return undefined when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const result = await cache.getWithTTLAsync('test-key');
      expect(result).toBeUndefined();
    });

    it('should return entry with TTL on cache hit', async () => {
      mockRedisClient.get.mockResolvedValue('cached-value');
      mockRedisClient.ttl.mockResolvedValue(1800);

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.getWithTTLAsync('test-key');

      expect(result).toBeDefined();
      expect(result?.value).toBe('cached-value');
      expect(result?.ttl).toBe(1800000); // ms
      expect(result?.isStale).toBe(false);
    });

    it('should mark as stale when TTL is 0 or negative', async () => {
      mockRedisClient.get.mockResolvedValue('cached-value');
      mockRedisClient.ttl.mockResolvedValue(-1);

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.getWithTTLAsync('test-key');

      expect(result?.isStale).toBe(true);
    });

    it('should return undefined on cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.getWithTTLAsync('test-key');

      expect(result).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.getWithTTLAsync('test-key');

      expect(result).toBeUndefined();
    });
  });

  describe('set (sync)', () => {
    it('should return false when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const result = cache.set('test-key', 'test-value');
      expect(result).toBe(false);
    });

    it('should return false for invalid key', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = cache.set('', 'test-value');
      expect(result).toBe(false);
    });

    it('should return false for invalid value type', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = cache.set('test-key', 123 as any);
      expect(result).toBe(false);
    });

    it('should return false for empty value', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = cache.set('test-key', '');
      expect(result).toBe(false);
    });

    it('should return false for value too large', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const largeValue = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const result = cache.set('test-key', largeValue);
      expect(result).toBe(false);
    });

    it('should return true and call setAsync for valid input', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = cache.set('test-key', 'test-value');
      expect(result).toBe(true);
    });
  });

  describe('setAsync', () => {
    it('should return false when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const result = await cache.setAsync('test-key', 'test-value');
      expect(result).toBe(false);
    });

    it('should set value with default TTL', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.setAsync('test-key', 'test-value');

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith('test-key', 3600, 'test-value');
    });

    it('should set value with custom TTL', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.setAsync('test-key', 'test-value', 7200);

      expect(result).toBe(true);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith('test-key', 7200, 'test-value');
    });

    it('should handle set errors', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('Set failed'));

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.setAsync('test-key', 'test-value');

      expect(result).toBe(false);
    });
  });

  describe('delete (sync)', () => {
    it('should return 0 when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const result = cache.delete('test-key');
      expect(result).toBe(0);
    });

    it('should return 1 and call deleteAsync', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = cache.delete('test-key');
      expect(result).toBe(1);
    });
  });

  describe('deleteAsync', () => {
    it('should return 0 when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const result = await cache.deleteAsync('test-key');
      expect(result).toBe(0);
    });

    it('should delete key and return result', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.deleteAsync('test-key');

      expect(result).toBe(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle delete errors', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Delete failed'));

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.deleteAsync('test-key');

      expect(result).toBe(0);
    });
  });

  describe('flush (sync)', () => {
    it('should not throw when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      expect(() => cache.flush()).not.toThrow();
    });

    it('should call flushAsync', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      cache.flush();

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });
  });

  describe('flushAsync', () => {
    it('should not throw when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      await expect(cache.flushAsync()).resolves.not.toThrow();
    });

    it('should flush the database', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      await cache.flushAsync();

      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });

    it('should handle flush errors', async () => {
      mockRedisClient.flushDb.mockRejectedValue(new Error('Flush failed'));

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      await expect(cache.flushAsync()).resolves.not.toThrow();
    });
  });

  describe('getStats (sync)', () => {
    it('should return basic stats', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const stats = cache.getStats();

      expect(stats).toBeDefined();
      expect(stats.keys).toBe(0);
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
    });
  });

  describe('getStatsAsync', () => {
    it('should return basic stats when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const stats = await cache.getStatsAsync();

      expect(stats.keys).toBe(0);
    });

    it('should parse redis INFO output', async () => {
      mockRedisClient.dbSize.mockResolvedValue(100);
      mockRedisClient.info.mockResolvedValue('keyspace_hits:500\nkeyspace_misses:200');

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const stats = await cache.getStatsAsync();

      expect(stats.keys).toBe(100);
      expect(stats.hits).toBe(500);
      expect(stats.misses).toBe(200);
    });

    it('should handle stats errors', async () => {
      mockRedisClient.dbSize.mockRejectedValue(new Error('Stats failed'));

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const stats = await cache.getStatsAsync();

      expect(stats.keys).toBe(0);
    });
  });

  describe('keys (sync)', () => {
    it('should return empty array and warn', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const result = cache.keys();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('keysAsync', () => {
    it('should return empty array when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const result = await cache.keysAsync();
      expect(result).toEqual([]);
    });

    it('should return all keys', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3']);

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.keysAsync();

      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should handle errors', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Keys failed'));

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.keysAsync();

      expect(result).toEqual([]);
    });
  });

  describe('getAllEntries (sync)', () => {
    it('should return empty array and warn', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const result = cache.getAllEntries();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getAllEntriesAsync', () => {
    it('should return empty array when not ready', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');

      const result = await cache.getAllEntriesAsync();
      expect(result).toEqual([]);
    });

    it('should return all entries with size and TTL', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2']);
      mockRedisClient.get.mockImplementation((key: string) => {
        if (key === 'key1') return Promise.resolve('value1');
        if (key === 'key2') return Promise.resolve('longer-value2');
        return Promise.resolve(null);
      });
      mockRedisClient.ttl.mockResolvedValue(3600);

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.getAllEntriesAsync();

      expect(result.length).toBe(2);
      expect(result[0].url).toBe('key1');
      expect(result[0].size).toBe(6); // 'value1'.length
      expect(result[0].ttl).toBe(3600);
    });

    it('should handle entries with null values', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1']);
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.ttl.mockResolvedValue(-2);

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.getAllEntriesAsync();

      expect(result[0].size).toBe(0);
      expect(result[0].ttl).toBe(0);
    });

    it('should handle errors', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Get entries failed'));

      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await cache.getAllEntriesAsync();

      expect(result).toEqual([]);
    });
  });

  describe('close', () => {
    it('should quit client', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      await cache.close();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it('should set ready to false', async () => {
      const module = await import('../../src/cache/redis-cache');
      const cache = new module.RedisCache('redis://localhost:6379');
      await new Promise(resolve => setTimeout(resolve, 10));

      await cache.close();

      expect(cache.isReady()).toBe(false);
    });
  });
});
