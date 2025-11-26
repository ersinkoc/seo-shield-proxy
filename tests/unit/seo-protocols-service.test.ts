import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/logger', () => ({
  Logger: class {
    info() {}
    error() {}
    warn() {}
    debug() {}
  }
}));

vi.mock('../../src/admin/content-health-check', () => ({
  ContentHealthCheckManager: class {
    checkPageHealth = vi.fn().mockResolvedValue({ passed: true, score: 90, issues: [] });
  }
}));

vi.mock('../../src/admin/virtual-scroll-manager', () => ({
  VirtualScrollManager: class {
    triggerVirtualScroll = vi.fn().mockResolvedValue({ success: true, completionRate: 100 });
    static getDefaultConfig = () => ({ enabled: false });
  }
}));

vi.mock('../../src/admin/etag-manager', () => ({
  ETagManager: class {
    static getDefaultConfig = () => ({ enabled: false });
  }
}));

vi.mock('../../src/admin/etag-service', () => ({
  ETagService: class {
    getCacheStats = vi.fn().mockReturnValue({});
    cleanupCache = vi.fn();
    static create = vi.fn().mockReturnValue({
      getCacheStats: () => ({}),
      cleanupCache: () => {}
    });
  }
}));

vi.mock('../../src/admin/cluster-manager', () => ({
  ClusterManager: class {
    initialize = vi.fn().mockResolvedValue(undefined);
    shutdown = vi.fn().mockResolvedValue(undefined);
    getStats = vi.fn().mockResolvedValue({});
    static getDefaultConfig = () => ({ enabled: false });
  }
}));

vi.mock('../../src/admin/shadow-dom-extractor', () => ({
  ShadowDOMExtractor: class {
    extractCompleteContent = vi.fn().mockResolvedValue({
      flattened: '<html>extracted</html>',
      stats: { totalShadowRoots: 5 }
    });
    static getDefaultConfig = () => ({ enabled: false });
  }
}));

vi.mock('../../src/admin/circuit-breaker', () => ({
  CircuitBreakerManager: class {
    getOverallHealth = vi.fn().mockReturnValue({ status: 'healthy' });
    getAllStates = vi.fn().mockReturnValue({});
    static getDefaultConfig = () => ({ enabled: false });
  }
}));

describe('SEOProtocolsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import SEOProtocolsService', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      expect(module.SEOProtocolsService).toBeDefined();
    });

    it('should import getSEOProtocolsService function', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      expect(module.getSEOProtocolsService).toBeDefined();
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      expect(config).toBeDefined();
    });

    it('should have all protocol configs', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();

      expect(config.contentHealthCheck).toBeDefined();
      expect(config.virtualScroll).toBeDefined();
      expect(config.etagStrategy).toBeDefined();
      expect(config.clusterMode).toBeDefined();
      expect(config.shadowDom).toBeDefined();
      expect(config.circuitBreaker).toBeDefined();
    });
  });

  describe('constructor', () => {
    it('should create instance with config', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      const service = new module.SEOProtocolsService(config);
      expect(service).toBeDefined();
    });
  });

  describe('getConfig', () => {
    it('should return current config', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      const service = new module.SEOProtocolsService(config);

      const returnedConfig = service.getConfig();
      expect(returnedConfig).toBeDefined();
      expect(returnedConfig.contentHealthCheck).toBeDefined();
    });
  });

  describe('updateConfig', () => {
    it('should update config', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      const service = new module.SEOProtocolsService(config);

      service.updateConfig({ contentHealthCheck: { ...config.contentHealthCheck, enabled: false } });

      const updated = service.getConfig();
      expect(updated.contentHealthCheck.enabled).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize with all protocols disabled', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = {
        contentHealthCheck: { enabled: false } as any,
        virtualScroll: { enabled: false },
        etagStrategy: { enabled: false },
        clusterMode: { enabled: false },
        shadowDom: { enabled: false },
        circuitBreaker: { enabled: false }
      };
      const service = new module.SEOProtocolsService(config);

      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should initialize with contentHealthCheck enabled', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.contentHealthCheck.enabled = true;
      config.virtualScroll.enabled = false;
      config.etagStrategy.enabled = false;
      config.clusterMode.enabled = false;
      config.shadowDom.enabled = false;
      config.circuitBreaker.enabled = false;

      const service = new module.SEOProtocolsService(config);
      await service.initialize();

      expect(service.getContentHealthCheck()).toBeDefined();
    });

    it('should initialize with virtualScroll enabled', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.contentHealthCheck.enabled = false;
      config.virtualScroll.enabled = true;
      config.etagStrategy.enabled = false;
      config.clusterMode.enabled = false;
      config.shadowDom.enabled = false;
      config.circuitBreaker.enabled = false;

      const service = new module.SEOProtocolsService(config);
      await service.initialize();

      expect(service.getVirtualScrollManager()).toBeDefined();
    });

    it('should initialize with etagStrategy enabled', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.contentHealthCheck.enabled = false;
      config.virtualScroll.enabled = false;
      config.etagStrategy.enabled = true;
      config.clusterMode.enabled = false;
      config.shadowDom.enabled = false;
      config.circuitBreaker.enabled = false;

      const service = new module.SEOProtocolsService(config);
      await service.initialize();

      expect(service.getETagService()).toBeDefined();
    });

    it('should initialize with clusterMode enabled', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.contentHealthCheck.enabled = false;
      config.virtualScroll.enabled = false;
      config.etagStrategy.enabled = false;
      config.clusterMode.enabled = true;
      config.shadowDom.enabled = false;
      config.circuitBreaker.enabled = false;

      const service = new module.SEOProtocolsService(config);
      await service.initialize();

      expect(service.getClusterManager()).toBeDefined();
    });

    it('should initialize with shadowDom enabled', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.contentHealthCheck.enabled = false;
      config.virtualScroll.enabled = false;
      config.etagStrategy.enabled = false;
      config.clusterMode.enabled = false;
      config.shadowDom.enabled = true;
      config.circuitBreaker.enabled = false;

      const service = new module.SEOProtocolsService(config);
      await service.initialize();

      expect(service.getShadowDOMExtractor()).toBeDefined();
    });

    it('should initialize with circuitBreaker enabled', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.contentHealthCheck.enabled = false;
      config.virtualScroll.enabled = false;
      config.etagStrategy.enabled = false;
      config.clusterMode.enabled = false;
      config.shadowDom.enabled = false;
      config.circuitBreaker.enabled = true;

      const service = new module.SEOProtocolsService(config);
      await service.initialize();

      expect(service.getCircuitBreakerManager()).toBeDefined();
    });
  });

  describe('getters', () => {
    it('should return null for uninitialized content health check', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.contentHealthCheck.enabled = false;
      const service = new module.SEOProtocolsService(config);

      expect(service.getContentHealthCheck()).toBeNull();
    });

    it('should return null for uninitialized virtual scroll manager', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.virtualScroll.enabled = false;
      const service = new module.SEOProtocolsService(config);

      expect(service.getVirtualScrollManager()).toBeNull();
    });

    it('should return null for uninitialized etag service', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.etagStrategy.enabled = false;
      const service = new module.SEOProtocolsService(config);

      expect(service.getETagService()).toBeNull();
    });

    it('should return null for uninitialized cluster manager', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.clusterMode.enabled = false;
      const service = new module.SEOProtocolsService(config);

      expect(service.getClusterManager()).toBeNull();
    });

    it('should return null for uninitialized shadow dom extractor', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.shadowDom.enabled = false;
      const service = new module.SEOProtocolsService(config);

      expect(service.getShadowDOMExtractor()).toBeNull();
    });

    it('should return null for uninitialized circuit breaker manager', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.circuitBreaker.enabled = false;
      const service = new module.SEOProtocolsService(config);

      expect(service.getCircuitBreakerManager()).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('should return status when no protocols enabled', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = {
        contentHealthCheck: { enabled: false } as any,
        virtualScroll: { enabled: false },
        etagStrategy: { enabled: false },
        clusterMode: { enabled: false },
        shadowDom: { enabled: false },
        circuitBreaker: { enabled: false }
      };
      const service = new module.SEOProtocolsService(config);

      const status = await service.getStatus();

      expect(status.enabled).toBe(true);
      expect(status.overall).toBe('healthy');
      expect(status.protocols).toBeDefined();
    });

    it('should return degraded when circuit breaker is degraded', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.contentHealthCheck.enabled = false;
      config.virtualScroll.enabled = false;
      config.etagStrategy.enabled = false;
      config.clusterMode.enabled = false;
      config.shadowDom.enabled = false;
      config.circuitBreaker.enabled = true;

      const service = new module.SEOProtocolsService(config);
      await service.initialize();

      // Mock degraded health
      const manager = service.getCircuitBreakerManager();
      if (manager) {
        (manager.getOverallHealth as any).mockReturnValue({ status: 'degraded' });
      }

      const status = await service.getStatus();
      expect(status.overall).toBe('degraded');
    });

    it('should return unhealthy when circuit breaker is unhealthy', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = module.SEOProtocolsService.getDefaultConfig();
      config.contentHealthCheck.enabled = false;
      config.virtualScroll.enabled = false;
      config.etagStrategy.enabled = false;
      config.clusterMode.enabled = false;
      config.shadowDom.enabled = false;
      config.circuitBreaker.enabled = true;

      const service = new module.SEOProtocolsService(config);
      await service.initialize();

      // Mock unhealthy health
      const manager = service.getCircuitBreakerManager();
      if (manager) {
        (manager.getOverallHealth as any).mockReturnValue({ status: 'unhealthy' });
      }

      const status = await service.getStatus();
      expect(status.overall).toBe('unhealthy');
    });
  });

  describe('getMetrics', () => {
    it('should return empty metrics when no protocols enabled', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = {
        contentHealthCheck: { enabled: false } as any,
        virtualScroll: { enabled: false },
        etagStrategy: { enabled: false },
        clusterMode: { enabled: false },
        shadowDom: { enabled: false },
        circuitBreaker: { enabled: false }
      };
      const service = new module.SEOProtocolsService(config);

      const metrics = await service.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = {
        contentHealthCheck: { enabled: false } as any,
        virtualScroll: { enabled: false },
        etagStrategy: { enabled: false },
        clusterMode: { enabled: false },
        shadowDom: { enabled: false },
        circuitBreaker: { enabled: false }
      };
      const service = new module.SEOProtocolsService(config);

      await expect(service.shutdown()).resolves.not.toThrow();
    });
  });

  describe('applyOptimizations', () => {
    it('should return optimizations when no protocols enabled', async () => {
      const module = await import('../../src/admin/seo-protocols-service');
      const config = {
        contentHealthCheck: { enabled: false } as any,
        virtualScroll: { enabled: false },
        etagStrategy: { enabled: false },
        clusterMode: { enabled: false },
        shadowDom: { enabled: false },
        circuitBreaker: { enabled: false }
      };
      const service = new module.SEOProtocolsService(config);

      const result = await service.applyOptimizations({
        url: 'https://example.com',
        html: '<html><body>Test</body></html>',
        page: null
      });

      expect(result.html).toBe('<html><body>Test</body></html>');
      expect(result.optimizations).toEqual([]);
      expect(result.warnings).toEqual([]);
    });
  });

  describe('getSEOProtocolsService', () => {
    it('should return singleton instance', async () => {
      const module = await import('../../src/admin/seo-protocols-service');

      const instance1 = module.getSEOProtocolsService();
      const instance2 = module.getSEOProtocolsService();

      expect(instance1).toBe(instance2);
    });

    it('should create instance with default config if none provided', async () => {
      const module = await import('../../src/admin/seo-protocols-service');

      const instance = module.getSEOProtocolsService();
      expect(instance).toBeDefined();
    });
  });
});
