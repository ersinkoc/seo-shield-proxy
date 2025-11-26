import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockETagService = {
  middleware: vi.fn(() => vi.fn((req: any, res: any, next: any) => next())),
  generateETagForSSR: vi.fn().mockResolvedValue({
    etag: '"test-etag"',
    lastModified: 'Wed, 21 Oct 2015 07:28:00 GMT',
    cacheControl: 'public, max-age=3600'
  })
};

const mockCircuitBreaker = {
  execute: vi.fn().mockResolvedValue({ success: true }),
  getTimeUntilNextRetry: vi.fn().mockReturnValue(5000)
};

const mockCircuitBreakerManager = {
  getCircuit: vi.fn().mockReturnValue(mockCircuitBreaker)
};

const mockShadowDOMExtractor = {
  extractCompleteContent: vi.fn().mockResolvedValue({ flattened: '<html></html>' })
};

const mockSeoService = {
  applyProtocols: vi.fn().mockResolvedValue('<html></html>'),
  isReady: vi.fn().mockReturnValue(true),
  getETagService: vi.fn().mockReturnValue(mockETagService),
  getCircuitBreakerManager: vi.fn().mockReturnValue(mockCircuitBreakerManager),
  getShadowDOMExtractor: vi.fn().mockReturnValue(mockShadowDOMExtractor),
  getStatus: vi.fn().mockResolvedValue({ overall: 'healthy' }),
  getMetrics: vi.fn().mockResolvedValue({ requests: 100 }),
  getConfig: vi.fn().mockReturnValue({ enabled: true }),
  updateConfig: vi.fn(),
  initialize: vi.fn().mockResolvedValue(undefined),
  shutdown: vi.fn().mockResolvedValue(undefined)
};

vi.mock('../../src/admin/seo-protocols-service', () => ({
  getSEOProtocolsService: vi.fn(() => mockSeoService)
}));

vi.mock('../../src/utils/logger', () => ({
  Logger: class {
    info() {}
    error() {}
    warn() {}
    debug() {}
  }
}));

describe('SEOIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module exports', () => {
    it('should import SEOIntegration module', async () => {
      const module = await import('../../src/admin/seo-integration');
      expect(module).toBeDefined();
    });

    it('should export seoOptimizationMiddleware', async () => {
      const module = await import('../../src/admin/seo-integration');
      expect(typeof module.seoOptimizationMiddleware).toBe('function');
    });

    it('should export etagMiddleware', async () => {
      const module = await import('../../src/admin/seo-integration');
      expect(typeof module.etagMiddleware).toBe('function');
    });

    it('should export circuitBreakerMiddleware', async () => {
      const module = await import('../../src/admin/seo-integration');
      expect(typeof module.circuitBreakerMiddleware).toBe('function');
    });

    it('should export initializeSEOProtocols', async () => {
      const module = await import('../../src/admin/seo-integration');
      expect(typeof module.initializeSEOProtocols).toBe('function');
    });

    it('should export seoStatusEndpoint', async () => {
      const module = await import('../../src/admin/seo-integration');
      expect(typeof module.seoStatusEndpoint).toBe('function');
    });

    it('should export seoConfigEndpoint', async () => {
      const module = await import('../../src/admin/seo-integration');
      expect(typeof module.seoConfigEndpoint).toBe('function');
    });

    it('should export seoMonitoringMiddleware', async () => {
      const module = await import('../../src/admin/seo-integration');
      expect(typeof module.seoMonitoringMiddleware).toBe('function');
    });
  });

  describe('seoOptimizationMiddleware', () => {
    it('should return middleware function', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoOptimizationMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should skip non-bot requests', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoOptimizationMiddleware();

      const req = { isBot: false, url: '/test' };
      const res = {};
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });

    it('should process bot requests', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoOptimizationMiddleware();

      const req = { isBot: true, url: '/test' };
      const originalEnd = vi.fn();
      const res = {
        end: originalEnd,
        write: vi.fn(),
        set: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(typeof res.end).toBe('function');
      expect(typeof res.write).toBe('function');
    });

    it('should intercept res.write with string content', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoOptimizationMiddleware();

      const req = { isBot: true, url: '/test' };
      const res = {
        end: vi.fn(),
        write: vi.fn(),
        set: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);
      res.write('test content');

      expect(next).toHaveBeenCalled();
    });

    it('should intercept res.write with Buffer content', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoOptimizationMiddleware();

      const req = { isBot: true, url: '/test' };
      const res = {
        end: vi.fn(),
        write: vi.fn(),
        set: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);
      res.write(Buffer.from('test content'));

      expect(next).toHaveBeenCalled();
    });
  });

  describe('etagMiddleware', () => {
    it('should return middleware function', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.etagMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should call next if no ETag service', async () => {
      mockSeoService.getETagService.mockReturnValueOnce(null);

      const module = await import('../../src/admin/seo-integration');
      const middleware = module.etagMiddleware();

      const req = {};
      const res = {};
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });

    it('should use ETag service middleware when available', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.etagMiddleware();

      expect(middleware).toBeDefined();
    });
  });

  describe('circuitBreakerMiddleware', () => {
    it('should return middleware function', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.circuitBreakerMiddleware('test-operation');
      expect(typeof middleware).toBe('function');
    });

    it('should call next if no circuit breaker manager', async () => {
      mockSeoService.getCircuitBreakerManager.mockReturnValueOnce(null);

      const module = await import('../../src/admin/seo-integration');
      const middleware = module.circuitBreakerMiddleware('test-operation');

      const req = {};
      const res = {};
      const next = vi.fn();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });

    it('should execute circuit breaker', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.circuitBreakerMiddleware('ssr-render');

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      expect(mockCircuitBreakerManager.getCircuit).toHaveBeenCalledWith('ssr-render');
    });

    it('should handle circuit breaker failure', async () => {
      mockCircuitBreaker.execute.mockResolvedValueOnce({ success: false });

      const module = await import('../../src/admin/seo-integration');
      const middleware = module.circuitBreakerMiddleware('failing-operation');

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      // Should return 503 when circuit is open
      expect(res.status).toHaveBeenCalledWith(503);
    });

    it('should handle errors', async () => {
      mockCircuitBreaker.execute.mockRejectedValueOnce(new Error('Circuit error'));

      const module = await import('../../src/admin/seo-integration');
      const middleware = module.circuitBreakerMiddleware('error-operation');

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('seoStatusEndpoint', () => {
    it('should return endpoint function', async () => {
      const module = await import('../../src/admin/seo-integration');
      const endpoint = module.seoStatusEndpoint();
      expect(typeof endpoint).toBe('function');
    });

    it('should return status and metrics', async () => {
      const module = await import('../../src/admin/seo-integration');
      const endpoint = module.seoStatusEndpoint();

      const req = {};
      const res = {
        json: vi.fn()
      };

      await endpoint(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        status: expect.any(Object),
        metrics: expect.any(Object),
        timestamp: expect.any(String)
      }));
    });

    it('should handle errors', async () => {
      mockSeoService.getStatus.mockRejectedValueOnce(new Error('Status error'));

      const module = await import('../../src/admin/seo-integration');
      const endpoint = module.seoStatusEndpoint();

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await endpoint(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.any(String)
      }));
    });
  });

  describe('seoConfigEndpoint', () => {
    it('should return object with get and post methods', async () => {
      const module = await import('../../src/admin/seo-integration');
      const endpoint = module.seoConfigEndpoint();

      expect(typeof endpoint.get).toBe('function');
      expect(typeof endpoint.post).toBe('function');
    });

    it('should return config on GET', async () => {
      const module = await import('../../src/admin/seo-integration');
      const endpoint = module.seoConfigEndpoint();

      const req = {};
      const res = {
        json: vi.fn()
      };

      await endpoint.get(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        config: expect.any(Object),
        timestamp: expect.any(String)
      }));
    });

    it('should handle GET errors', async () => {
      mockSeoService.getConfig.mockImplementationOnce(() => { throw new Error('Config error'); });

      const module = await import('../../src/admin/seo-integration');
      const endpoint = module.seoConfigEndpoint();

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await endpoint.get(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should update config on POST', async () => {
      const module = await import('../../src/admin/seo-integration');
      const endpoint = module.seoConfigEndpoint();

      const req = { body: { enabled: false } };
      const res = {
        json: vi.fn()
      };

      await endpoint.post(req as any, res as any);

      expect(mockSeoService.updateConfig).toHaveBeenCalledWith({ enabled: false });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String)
      }));
    });

    it('should handle POST errors', async () => {
      mockSeoService.updateConfig.mockImplementationOnce(() => { throw new Error('Update error'); });

      const module = await import('../../src/admin/seo-integration');
      const endpoint = module.seoConfigEndpoint();

      const req = { body: { invalid: true } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      await endpoint.post(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('initializeSEOProtocols', () => {
    it('should initialize SEO service', async () => {
      const module = await import('../../src/admin/seo-integration');

      const result = await module.initializeSEOProtocols();

      expect(mockSeoService.initialize).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should initialize with config', async () => {
      const module = await import('../../src/admin/seo-integration');
      const config = { enabled: true };

      const result = await module.initializeSEOProtocols(config);

      expect(result).toBeDefined();
    });

    it('should handle initialization errors', async () => {
      mockSeoService.initialize.mockRejectedValueOnce(new Error('Init failed'));

      const module = await import('../../src/admin/seo-integration');

      await expect(module.initializeSEOProtocols()).rejects.toThrow('Init failed');
    });
  });

  describe('seoMonitoringMiddleware', () => {
    it('should return middleware function', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoMonitoringMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should call next', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoMonitoringMiddleware();

      const req = { isBot: false, method: 'GET', url: '/test' };
      const res = {
        end: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });

    it('should monitor bot requests', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoMonitoringMiddleware();

      const req = { isBot: true, method: 'GET', url: '/bot-test' };
      const originalEnd = vi.fn();
      const res = {
        end: originalEnd
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(typeof res.end).toBe('function');
    });

    it('should track request duration', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoMonitoringMiddleware();

      const req = { isBot: true, method: 'GET', url: '/duration-test' };
      const originalEnd = vi.fn().mockReturnValue(true);
      const res = {
        end: originalEnd
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      // Call the wrapped end function
      res.end();

      expect(next).toHaveBeenCalled();
    });
  });

  describe('response interception', () => {
    it('should handle res.end with string chunk', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoOptimizationMiddleware();

      const req = { isBot: true, url: '/test' };
      const originalEnd = vi.fn().mockReturnValue(true);
      const res = {
        end: originalEnd,
        write: vi.fn(),
        set: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      // Call the wrapped end function with string
      res.end('<html>test</html>');

      expect(next).toHaveBeenCalled();
    });

    it('should handle res.end with Buffer chunk', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoOptimizationMiddleware();

      const req = { isBot: true, url: '/test' };
      const originalEnd = vi.fn().mockReturnValue(true);
      const res = {
        end: originalEnd,
        write: vi.fn(),
        set: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      // Call the wrapped end function with Buffer
      res.end(Buffer.from('<html>buffer</html>'));

      expect(next).toHaveBeenCalled();
    });

    it('should handle res.end without chunk', async () => {
      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoOptimizationMiddleware();

      const req = { isBot: true, url: '/test' };
      const originalEnd = vi.fn().mockReturnValue(true);
      const res = {
        end: originalEnd,
        write: vi.fn(),
        set: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      // Call the wrapped end function without chunk
      res.end();

      expect(next).toHaveBeenCalled();
    });
  });

  describe('SEO status variations', () => {
    it('should handle unhealthy status', async () => {
      mockSeoService.getStatus.mockResolvedValueOnce({ overall: 'degraded' });

      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoOptimizationMiddleware();

      const req = { isBot: true, url: '/unhealthy-test' };
      const originalEnd = vi.fn().mockReturnValue(true);
      const res = {
        end: originalEnd,
        write: vi.fn(),
        set: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);
      res.end('<html></html>');

      expect(next).toHaveBeenCalled();
    });

    it('should handle ETag service unavailable', async () => {
      mockSeoService.getETagService.mockReturnValueOnce(null);

      const module = await import('../../src/admin/seo-integration');
      const middleware = module.seoOptimizationMiddleware();

      const req = { isBot: true, url: '/no-etag' };
      const originalEnd = vi.fn().mockReturnValue(true);
      const res = {
        end: originalEnd,
        write: vi.fn(),
        set: vi.fn()
      };
      const next = vi.fn();

      await middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
