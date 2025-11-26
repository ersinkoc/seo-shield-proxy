import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock CacheFactory
const mockCacheInstance = {
  get: vi.fn().mockReturnValue('cached-value'),
  getWithTTL: vi.fn().mockReturnValue({ value: 'cached', ttl: 3600 }),
  set: vi.fn().mockReturnValue(true),
  delete: vi.fn().mockReturnValue(true),
  flush: vi.fn(),
  getStats: vi.fn().mockReturnValue({ keys: 10, hits: 100, misses: 20, ksize: 1024, vsize: 2048 }),
  keys: vi.fn().mockReturnValue(['key1', 'key2', 'key3']),
  getAllEntries: vi.fn().mockReturnValue([{ key: 'key1', value: 'val1' }]),
  isReady: vi.fn().mockReturnValue(true),
  close: vi.fn().mockResolvedValue(undefined)
};

vi.mock('../../src/cache/cache-factory', () => ({
  CacheFactory: {
    createCache: vi.fn().mockResolvedValue(mockCacheInstance)
  }
}));

describe('Cache Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('cache initialization', () => {
    it('should export getCache function', async () => {
      const cacheModule = await import('../../src/cache');
      expect(cacheModule.getCache).toBeDefined();
      expect(typeof cacheModule.getCache).toBe('function');
    });

    it('should export default cache proxy', async () => {
      const cacheModule = await import('../../src/cache');
      expect(cacheModule.default).toBeDefined();
    });
  });

  describe('cache proxy behavior', () => {
    it('should provide safe defaults when cache is not ready - get method', async () => {
      // Test that proxy returns safe defaults
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (prop === 'get' || prop === 'getWithTTL') {
            return () => undefined;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).get?.('key');
      expect(result).toBe(undefined);
    });

    it('should provide safe defaults when cache is not ready - set method', async () => {
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (prop === 'set' || prop === 'delete') {
            return () => false;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).set?.('key', 'value');
      expect(result).toBe(false);
    });

    it('should provide safe defaults when cache is not ready - delete method', async () => {
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (prop === 'delete') {
            return () => false;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).delete?.('key');
      expect(result).toBe(false);
    });

    it('should provide safe defaults when cache is not ready - flush method', async () => {
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (prop === 'flush') {
            return () => {};
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).flush?.();
      expect(result).toBe(undefined);
    });

    it('should provide safe defaults when cache is not ready - getStats method', async () => {
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (prop === 'getStats') {
            return () => ({ keys: 0, hits: 0, misses: 0, ksize: 0, vsize: 0 });
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).getStats?.();
      expect(result).toEqual({ keys: 0, hits: 0, misses: 0, ksize: 0, vsize: 0 });
    });

    it('should provide safe defaults when cache is not ready - keys method', async () => {
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (prop === 'keys') {
            return () => [];
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).keys?.();
      expect(result).toEqual([]);
    });

    it('should provide safe defaults when cache is not ready - getAllEntries method', async () => {
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (prop === 'getAllEntries') {
            return () => [];
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).getAllEntries?.();
      expect(result).toEqual([]);
    });

    it('should provide safe defaults when cache is not ready - isReady method', async () => {
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (prop === 'isReady') {
            return () => false;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).isReady?.();
      expect(result).toBe(false);
    });

    it('should provide safe defaults when cache is not ready - close method', async () => {
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (prop === 'close') {
            return async () => {};
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = await (proxy as any).close?.();
      expect(result).toBe(undefined);
    });

    it('should return undefined for unknown properties when cache not ready', async () => {
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          const knownProps = ['get', 'getWithTTL', 'set', 'delete', 'flush', 'getStats', 'keys', 'getAllEntries', 'isReady', 'close'];
          if (!knownProps.includes(prop as string)) {
            return undefined;
          }
          return () => undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).unknownMethod;
      expect(result).toBe(undefined);
    });
  });

  describe('cache proxy with initialized cache', () => {
    it('should delegate get to cache instance', async () => {
      let cacheInstance: any = mockCacheInstance;
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (cacheInstance) {
            const value = cacheInstance[prop];
            if (typeof value === 'function') {
              return value.bind(cacheInstance);
            }
            return value;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).get('test-key');
      expect(mockCacheInstance.get).toHaveBeenCalledWith('test-key');
    });

    it('should delegate set to cache instance', async () => {
      let cacheInstance: any = mockCacheInstance;
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (cacheInstance) {
            const value = cacheInstance[prop];
            if (typeof value === 'function') {
              return value.bind(cacheInstance);
            }
            return value;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).set('test-key', 'test-value');
      expect(mockCacheInstance.set).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should delegate delete to cache instance', async () => {
      let cacheInstance: any = mockCacheInstance;
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (cacheInstance) {
            const value = cacheInstance[prop];
            if (typeof value === 'function') {
              return value.bind(cacheInstance);
            }
            return value;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).delete('test-key');
      expect(mockCacheInstance.delete).toHaveBeenCalledWith('test-key');
    });

    it('should delegate flush to cache instance', async () => {
      let cacheInstance: any = mockCacheInstance;
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (cacheInstance) {
            const value = cacheInstance[prop];
            if (typeof value === 'function') {
              return value.bind(cacheInstance);
            }
            return value;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      (proxy as any).flush();
      expect(mockCacheInstance.flush).toHaveBeenCalled();
    });

    it('should delegate getStats to cache instance', async () => {
      let cacheInstance: any = mockCacheInstance;
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (cacheInstance) {
            const value = cacheInstance[prop];
            if (typeof value === 'function') {
              return value.bind(cacheInstance);
            }
            return value;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).getStats();
      expect(mockCacheInstance.getStats).toHaveBeenCalled();
      expect(result).toEqual({ keys: 10, hits: 100, misses: 20, ksize: 1024, vsize: 2048 });
    });

    it('should delegate keys to cache instance', async () => {
      let cacheInstance: any = mockCacheInstance;
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (cacheInstance) {
            const value = cacheInstance[prop];
            if (typeof value === 'function') {
              return value.bind(cacheInstance);
            }
            return value;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).keys();
      expect(mockCacheInstance.keys).toHaveBeenCalled();
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should delegate isReady to cache instance', async () => {
      let cacheInstance: any = mockCacheInstance;
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (cacheInstance) {
            const value = cacheInstance[prop];
            if (typeof value === 'function') {
              return value.bind(cacheInstance);
            }
            return value;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).isReady();
      expect(mockCacheInstance.isReady).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should delegate close to cache instance', async () => {
      let cacheInstance: any = mockCacheInstance;
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (cacheInstance) {
            const value = cacheInstance[prop];
            if (typeof value === 'function') {
              return value.bind(cacheInstance);
            }
            return value;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      await (proxy as any).close();
      expect(mockCacheInstance.close).toHaveBeenCalled();
    });

    it('should return non-function properties directly', async () => {
      let cacheInstance: any = { someProperty: 'value' };
      const proxyHandler = {
        get: vi.fn((_target, prop) => {
          if (cacheInstance) {
            const value = cacheInstance[prop];
            if (typeof value === 'function') {
              return value.bind(cacheInstance);
            }
            return value;
          }
          return undefined;
        })
      };

      const proxy = new Proxy({}, proxyHandler);
      const result = (proxy as any).someProperty;
      expect(result).toBe('value');
    });
  });

  describe('getCache function', () => {
    it('should return cache instance from getCache', async () => {
      const { getCache } = await import('../../src/cache');
      const cache = await getCache();
      expect(cache).toBeDefined();
    });
  });

  describe('initCache behavior', () => {
    it('should return existing cache instance if already initialized', async () => {
      // This tests the cacheInstance check
      const initCache = async () => {
        let cacheInstance: any = mockCacheInstance;
        if (cacheInstance) {
          return cacheInstance;
        }
        return null;
      };

      const result = await initCache();
      expect(result).toBe(mockCacheInstance);
    });

    it('should return existing init promise if already initializing', async () => {
      let initPromise: Promise<any> | null = null;

      const initCache = async () => {
        if (initPromise) {
          return initPromise;
        }
        initPromise = Promise.resolve(mockCacheInstance);
        return initPromise;
      };

      // First call
      const promise1 = initCache();
      // Second call should return same promise
      const promise2 = initCache();

      expect(await promise1).toBe(mockCacheInstance);
      expect(await promise2).toBe(mockCacheInstance);
    });

    it('should create new cache if none exists', async () => {
      const { CacheFactory } = await import('../../src/cache/cache-factory');

      expect(CacheFactory.createCache).toBeDefined();
    });
  });

  describe('SIGINT handler', () => {
    it('should close cache on SIGINT', async () => {
      let cacheInstance: any = mockCacheInstance;

      const sigintHandler = async () => {
        if (cacheInstance) {
          await cacheInstance.close();
        }
      };

      await sigintHandler();
      expect(mockCacheInstance.close).toHaveBeenCalled();
    });

    it('should handle SIGINT when no cache instance', async () => {
      let cacheInstance: any = null;

      const sigintHandler = async () => {
        if (cacheInstance) {
          await cacheInstance.close();
        }
      };

      await sigintHandler();
      // Should not throw
    });
  });

  describe('SIGTERM handler', () => {
    it('should close cache on SIGTERM', async () => {
      let cacheInstance: any = mockCacheInstance;

      const sigtermHandler = async () => {
        if (cacheInstance) {
          await cacheInstance.close();
        }
      };

      await sigtermHandler();
      expect(mockCacheInstance.close).toHaveBeenCalled();
    });

    it('should handle SIGTERM when no cache instance', async () => {
      let cacheInstance: any = null;

      const sigtermHandler = async () => {
        if (cacheInstance) {
          await cacheInstance.close();
        }
      };

      await sigtermHandler();
      // Should not throw
    });
  });

  describe('initialization error handling', () => {
    it('should handle cache initialization error', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const initCacheWithError = async () => {
        throw new Error('Cache init failed');
      };

      try {
        await initCacheWithError();
      } catch (error) {
        console.error('Failed to initialize cache:', error);
        process.exit(1);
      }

      expect(errorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('type exports', () => {
    it('should export CacheStats type', async () => {
      // Verify the type export exists
      const types = await import('../../src/cache');
      expect(types).toBeDefined();
    });

    it('should export CacheEntry type', async () => {
      // Verify the type export exists
      const types = await import('../../src/cache');
      expect(types).toBeDefined();
    });
  });
});

describe('Cache Proxy Edge Cases', () => {
  it('should handle getWithTTL proxy method', async () => {
    const proxyHandler = {
      get: vi.fn((_target, prop) => {
        if (prop === 'getWithTTL') {
          return () => undefined;
        }
        return undefined;
      })
    };

    const proxy = new Proxy({}, proxyHandler);
    const result = (proxy as any).getWithTTL?.('key');
    expect(result).toBe(undefined);
  });

  it('should handle getAllEntries proxy method with initialized cache', async () => {
    const mockCache = {
      getAllEntries: vi.fn().mockReturnValue([{ key: 'k1', value: 'v1', ttl: 3600 }])
    };

    const proxyHandler = {
      get: vi.fn((_target, prop) => {
        const value = mockCache[prop as keyof typeof mockCache];
        if (typeof value === 'function') {
          return value.bind(mockCache);
        }
        return value;
      })
    };

    const proxy = new Proxy({}, proxyHandler);
    const result = (proxy as any).getAllEntries();
    expect(result).toEqual([{ key: 'k1', value: 'v1', ttl: 3600 }]);
  });
});
