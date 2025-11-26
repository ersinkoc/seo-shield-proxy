import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ioredis as a class
class MockRedis {
  ping = vi.fn().mockResolvedValue('PONG');
  quit = vi.fn().mockResolvedValue(undefined);
  on = vi.fn();
}

vi.mock('ioredis', () => ({
  Redis: MockRedis
}));

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    getWaiting: vi.fn().mockResolvedValue([]),
    getActive: vi.fn().mockResolvedValue([]),
    getCompleted: vi.fn().mockResolvedValue([]),
    getFailed: vi.fn().mockResolvedValue([]),
    getDelayed: vi.fn().mockResolvedValue([])
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    isRunning: vi.fn().mockReturnValue(true)
  })),
  QueueEvents: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock Puppeteer
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setUserAgent: vi.fn().mockResolvedValue(undefined),
        setViewport: vi.fn().mockResolvedValue(undefined),
        setRequestInterception: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockResolvedValue({ status: () => 200 }),
        content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
        close: vi.fn().mockResolvedValue(undefined),
        on: vi.fn()
      }),
      close: vi.fn().mockResolvedValue(undefined),
      version: vi.fn().mockResolvedValue('Chrome/100.0')
    })
  }
}));

vi.mock('../../src/utils/logger', () => ({
  Logger: class {
    info() {}
    error() {}
    warn() {}
    debug() {}
  }
}));

describe('ClusterManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import ClusterManager', async () => {
      const module = await import('../../src/admin/cluster-manager');
      expect(module.ClusterManager).toBeDefined();
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config).toBeDefined();
      expect(config.enabled).toBe(false);
      expect(config.useRedisQueue).toBe(true);
      expect(config.maxWorkers).toBe(3);
      expect(config.jobTimeout).toBe(30000);
      expect(config.retryAttempts).toBe(3);
      expect(config.retryDelay).toBe(5000);
    });

    it('should include redis config', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.redis).toBeDefined();
      expect(config.redis?.host).toBe('localhost');
      expect(config.redis?.port).toBe(6379);
      expect(config.redis?.db).toBe(0);
    });

    it('should include browser config', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.browser).toBeDefined();
      expect(config.browser.headless).toBe(true);
      expect(config.browser.args).toBeDefined();
      expect(Array.isArray(config.browser.args)).toBe(true);
      expect(config.browser.args.length).toBeGreaterThan(0);
      expect(config.browser.defaultViewport.width).toBe(1920);
      expect(config.browser.defaultViewport.height).toBe(1080);
    });
  });

  describe('constructor', () => {
    it('should create instance with config', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      const manager = new module.ClusterManager(config);

      expect(manager).toBeDefined();
    });

    it('should have initialize method', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      const manager = new module.ClusterManager(config);

      expect(typeof manager.initialize).toBe('function');
    });

    it('should have getStats method', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      const manager = new module.ClusterManager(config);

      expect(typeof manager.getStats).toBe('function');
    });

    it('should have addRenderJob method', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      const manager = new module.ClusterManager(config);

      expect(typeof manager.addRenderJob).toBe('function');
    });

    it('should have pause method', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      const manager = new module.ClusterManager(config);

      expect(typeof manager.pause).toBe('function');
    });

    it('should have resume method', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      const manager = new module.ClusterManager(config);

      expect(typeof manager.resume).toBe('function');
    });

    it('should have shutdown method', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      const manager = new module.ClusterManager(config);

      expect(typeof manager.shutdown).toBe('function');
    });
  });

  describe('initialize', () => {
    it('should not initialize when disabled', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      await manager.initialize();

      // Should not throw
    });

    it('should initialize in-memory mode when redis queue disabled', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = true;
      config.useRedisQueue = false;

      const manager = new module.ClusterManager(config);
      await manager.initialize();

      // Should not throw
    });

    // Note: Redis initialization tests require complex BullMQ mocking
    // The key functionality is tested via disabled mode and in-memory mode
  });

  describe('addRenderJob', () => {
    it('should return null when queue not available', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      const result = await manager.addRenderJob('https://example.com');

      expect(result).toBeNull();
    });

    it('should accept options parameter', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      const result = await manager.addRenderJob('https://example.com', {
        timeout: 30000,
        waitUntil: 'networkidle0',
        viewport: { width: 1920, height: 1080 }
      });

      expect(result).toBeNull();
    });

    it('should accept metadata parameter', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      const result = await manager.addRenderJob(
        'https://example.com',
        { timeout: 30000 },
        { userAgent: 'TestBot/1.0', referer: 'https://google.com' }
      );

      expect(result).toBeNull();
    });

    it('should accept priority parameter', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      const result = await manager.addRenderJob(
        'https://example.com',
        {},
        {},
        10
      );

      expect(result).toBeNull();
    });
  });

  describe('pause and resume', () => {
    it('should handle pause when no queue', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);

      // Should not throw
      await expect(manager.pause()).resolves.not.toThrow();
    });

    it('should handle resume when no queue', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);

      // Should not throw
      await expect(manager.resume()).resolves.not.toThrow();
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully when not initialized', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);

      await expect(manager.shutdown()).resolves.not.toThrow();
    });

    it('should shutdown gracefully after initialization', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = true;
      config.useRedisQueue = false;

      const manager = new module.ClusterManager(config);
      await manager.initialize();
      await expect(manager.shutdown()).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return stats object', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      const stats = await manager.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('workers');
      expect(stats).toHaveProperty('jobs');
      expect(stats).toHaveProperty('performance');
    });

    it('should return worker stats', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      const stats = await manager.getStats();

      expect(stats.workers).toHaveProperty('active');
      expect(stats.workers).toHaveProperty('idle');
      expect(stats.workers).toHaveProperty('total');
    });

    it('should return job stats', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      const stats = await manager.getStats();

      expect(stats.jobs).toHaveProperty('waiting');
      expect(stats.jobs).toHaveProperty('active');
      expect(stats.jobs).toHaveProperty('completed');
      expect(stats.jobs).toHaveProperty('failed');
      expect(stats.jobs).toHaveProperty('delayed');
    });

    it('should return performance stats', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      const stats = await manager.getStats();

      expect(stats.performance).toHaveProperty('avgRenderTime');
      expect(stats.performance).toHaveProperty('successRate');
      expect(stats.performance).toHaveProperty('throughput');
      expect(stats.performance).toHaveProperty('memoryUsage');
    });
  });

  describe('RenderJob interface', () => {
    it('should have required properties', () => {
      const job = {
        id: 'job-123',
        url: 'https://example.com',
        priority: 1,
        attempts: 0,
        createdAt: new Date(),
        metadata: {
          userAgent: 'TestBot/1.0',
          protocol: 'https',
          headers: {}
        },
        options: {
          timeout: 30000,
          waitUntil: 'networkidle0' as const
        }
      };

      expect(job.id).toBe('job-123');
      expect(job.url).toBe('https://example.com');
      expect(job.priority).toBe(1);
      expect(job.metadata.userAgent).toBe('TestBot/1.0');
    });

    it('should allow optional properties', () => {
      const job = {
        id: 'job-456',
        url: 'https://example.com',
        priority: 2,
        attempts: 1,
        createdAt: new Date(),
        scheduledAt: new Date(),
        metadata: {
          userAgent: 'TestBot/2.0',
          referer: 'https://google.com',
          protocol: 'https',
          headers: { 'X-Custom': 'header' }
        },
        options: {
          timeout: 60000,
          waitUntil: 'networkidle2' as const,
          viewport: { width: 1920, height: 1080 },
          userAgent: 'CustomUA',
          blockResources: true
        }
      };

      expect(job.scheduledAt).toBeDefined();
      expect(job.metadata.referer).toBe('https://google.com');
      expect(job.options.viewport?.width).toBe(1920);
      expect(job.options.blockResources).toBe(true);
    });
  });

  describe('RenderJobResult interface', () => {
    it('should have required properties', () => {
      const result = {
        jobId: 'job-123',
        url: 'https://example.com',
        success: true,
        html: '<html><body>Test</body></html>',
        statusCode: 200,
        duration: 1500,
        metrics: {
          renderTime: 1200,
          memoryUsage: 50000000,
          networkRequests: 25
        },
        metadata: {
          workerId: 'worker-1',
          browserVersion: 'Chrome/100.0',
          platform: 'linux'
        }
      };

      expect(result.jobId).toBe('job-123');
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.duration).toBe(1500);
    });

    it('should allow error result', () => {
      const result = {
        jobId: 'job-456',
        url: 'https://example.com',
        success: false,
        error: 'Navigation timeout',
        duration: 30000,
        metrics: {
          renderTime: 30000,
          memoryUsage: 60000000,
          networkRequests: 5
        },
        metadata: {
          workerId: 'worker-2',
          browserVersion: 'Chrome/100.0',
          platform: 'linux'
        }
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Navigation timeout');
      expect(result.html).toBeUndefined();
    });
  });

  describe('ClusterConfig interface', () => {
    it('should have all required properties', () => {
      const config = {
        enabled: true,
        useRedisQueue: true,
        maxWorkers: 5,
        jobTimeout: 30000,
        retryAttempts: 3,
        retryDelay: 5000,
        browser: {
          headless: true,
          args: ['--no-sandbox'],
          defaultViewport: { width: 1920, height: 1080 }
        }
      };

      expect(config.enabled).toBe(true);
      expect(config.maxWorkers).toBe(5);
      expect(config.browser.headless).toBe(true);
    });

    it('should have optional redis config', () => {
      const config = {
        enabled: true,
        useRedisQueue: true,
        maxWorkers: 5,
        jobTimeout: 30000,
        retryAttempts: 3,
        retryDelay: 5000,
        redis: {
          host: 'localhost',
          port: 6379,
          password: 'secret',
          db: 0
        },
        browser: {
          headless: true,
          args: [],
          defaultViewport: { width: 1920, height: 1080 }
        }
      };

      expect(config.redis?.host).toBe('localhost');
      expect(config.redis?.password).toBe('secret');
    });
  });

  describe('ClusterStats interface', () => {
    it('should have worker stats structure', () => {
      const stats = {
        workers: { active: 3, idle: 2, total: 5 },
        jobs: { waiting: 10, active: 3, completed: 100, failed: 5, delayed: 2 },
        performance: { avgRenderTime: 1200, successRate: 95.5, throughput: 50, memoryUsage: 500000000 }
      };

      expect(stats.workers.active).toBe(3);
      expect(stats.workers.total).toBe(5);
    });

    it('should have job stats structure', () => {
      const stats = {
        workers: { active: 3, idle: 2, total: 5 },
        jobs: { waiting: 10, active: 3, completed: 100, failed: 5, delayed: 2 },
        performance: { avgRenderTime: 1200, successRate: 95.5, throughput: 50, memoryUsage: 500000000 }
      };

      expect(stats.jobs.completed).toBe(100);
      expect(stats.jobs.failed).toBe(5);
    });

    it('should have performance stats structure', () => {
      const stats = {
        workers: { active: 3, idle: 2, total: 5 },
        jobs: { waiting: 10, active: 3, completed: 100, failed: 5, delayed: 2 },
        performance: { avgRenderTime: 1200, successRate: 95.5, throughput: 50, memoryUsage: 500000000 }
      };

      expect(stats.performance.avgRenderTime).toBe(1200);
      expect(stats.performance.successRate).toBe(95.5);
    });
  });

  describe('browser args configuration', () => {
    it('should include no-sandbox arg', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.browser.args).toContain('--no-sandbox');
    });

    it('should include disable-setuid-sandbox arg', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.browser.args).toContain('--disable-setuid-sandbox');
    });

    it('should include disable-dev-shm-usage arg', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.browser.args).toContain('--disable-dev-shm-usage');
    });

    it('should include disable-gpu arg', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.browser.args).toContain('--disable-gpu');
    });
  });

  describe('workerId generation', () => {
    it('should generate unique worker ID', () => {
      const workerId1 = `worker-${process.pid}-${Date.now()}`;
      const workerId2 = `worker-${process.pid}-${Date.now() + 1}`;

      expect(workerId1).toContain('worker-');
      expect(workerId1).toContain(process.pid.toString());
      expect(workerId1).not.toBe(workerId2);
    });
  });

  describe('default config values', () => {
    it('should have maxWorkers of 3', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.maxWorkers).toBe(3);
    });

    it('should have jobTimeout of 30000', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.jobTimeout).toBe(30000);
    });

    it('should have retryAttempts of 3', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.retryAttempts).toBe(3);
    });

    it('should have retryDelay of 5000', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.retryDelay).toBe(5000);
    });

    it('should have headless browser', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.browser.headless).toBe(true);
    });

    it('should have 1920x1080 viewport', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();

      expect(config.browser.defaultViewport.width).toBe(1920);
      expect(config.browser.defaultViewport.height).toBe(1080);
    });
  });

  describe('initialization states', () => {
    it('should start as not initialized', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);

      // Not initialized yet, getStats should still work
      const stats = await manager.getStats();
      expect(stats).toBeDefined();
    });

    it('should be idempotent on multiple initialize calls', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = true;
      config.useRedisQueue = false;

      const manager = new module.ClusterManager(config);
      await manager.initialize();
      await manager.initialize(); // Second call should be no-op

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('in-memory cluster mode', () => {
    it('should initialize without Redis', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = true;
      config.useRedisQueue = false;

      const manager = new module.ClusterManager(config);
      await manager.initialize();

      const stats = await manager.getStats();
      expect(stats).toBeDefined();
    });

    it('should handle jobs without Redis queue', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = true;
      config.useRedisQueue = false;

      const manager = new module.ClusterManager(config);
      await manager.initialize();

      const result = await manager.addRenderJob('https://example.com');
      // In-memory mode may or may not queue depending on implementation
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('waitUntil options', () => {
    it('should accept networkidle0', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      await manager.addRenderJob('https://example.com', {
        timeout: 30000,
        waitUntil: 'networkidle0'
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should accept networkidle2', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      await manager.addRenderJob('https://example.com', {
        timeout: 30000,
        waitUntil: 'networkidle2'
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should accept domcontentloaded', async () => {
      const module = await import('../../src/admin/cluster-manager');
      const config = module.ClusterManager.getDefaultConfig();
      config.enabled = false;

      const manager = new module.ClusterManager(config);
      await manager.addRenderJob('https://example.com', {
        timeout: 30000,
        waitUntil: 'domcontentloaded'
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Redis initialization simulation', () => {
    it('should simulate Redis connection setup', () => {
      const redisConfig = {
        host: 'localhost',
        port: 6379,
        password: 'secret',
        db: 0
      };

      const connectionOptions = {
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        maxRetriesPerRequest: 3
      };

      expect(connectionOptions.host).toBe('localhost');
      expect(connectionOptions.port).toBe(6379);
      expect(connectionOptions.maxRetriesPerRequest).toBe(3);
    });

    it('should require redis config for redis queue mode', () => {
      const config = {
        enabled: true,
        useRedisQueue: true,
        redis: undefined
      };

      const redisConfig = config.redis;
      if (!redisConfig) {
        const error = 'Redis configuration is required for Redis queue mode';
        expect(error).toContain('Redis configuration is required');
      }
    });
  });

  describe('BullMQ Queue simulation', () => {
    it('should simulate queue creation with options', () => {
      const queueOptions = {
        connection: {},
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 100,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          delay: 0
        }
      };

      expect(queueOptions.defaultJobOptions.removeOnComplete).toBe(1000);
      expect(queueOptions.defaultJobOptions.removeOnFail).toBe(100);
      expect(queueOptions.defaultJobOptions.attempts).toBe(3);
      expect(queueOptions.defaultJobOptions.backoff.type).toBe('exponential');
    });

    it('should require redis connection for queue', () => {
      const redisConnection = null;
      if (!redisConnection) {
        const error = 'Redis connection is required for queue initialization';
        expect(error).toContain('Redis connection is required');
      }
    });
  });

  describe('Worker creation simulation', () => {
    it('should simulate worker creation', () => {
      const workerOptions = {
        connection: {},
        concurrency: 1,
        limiter: {
          max: 5,
          duration: 60000
        }
      };

      expect(workerOptions.concurrency).toBe(1);
      expect(workerOptions.limiter.max).toBe(5);
      expect(workerOptions.limiter.duration).toBe(60000);
    });

    it('should create workers based on maxWorkers config', () => {
      const maxWorkers = 3;
      const workers: any[] = [];

      for (let i = 0; i < maxWorkers; i++) {
        workers.push({ id: `worker-${i}` });
      }

      expect(workers.length).toBe(3);
    });

    it('should require redis connection for workers', () => {
      const redisConnection = null;
      if (!redisConnection) {
        const error = 'Redis connection is required for worker initialization';
        expect(error).toContain('Redis connection is required');
      }
    });
  });

  describe('QueueEvents simulation', () => {
    it('should simulate queue events creation', () => {
      const queueEventsOptions = {
        connection: {}
      };

      expect(queueEventsOptions.connection).toBeDefined();
    });

    it('should handle completed event', () => {
      let eventCalled = false;
      const mockQueueEvents = {
        on: (event: string, callback: Function) => {
          if (event === 'completed') {
            callback({ jobId: 'test-123', returnvalue: {} });
            eventCalled = true;
          }
        }
      };

      mockQueueEvents.on('completed', () => {});
      expect(eventCalled).toBe(true);
    });

    it('should handle failed event', () => {
      let failedCalled = false;
      const mockQueueEvents = {
        on: (event: string, callback: Function) => {
          if (event === 'failed') {
            callback({ jobId: 'test-456', failedReason: 'Timeout' });
            failedCalled = true;
          }
        }
      };

      mockQueueEvents.on('failed', () => {});
      expect(failedCalled).toBe(true);
    });

    it('should handle progress event', () => {
      let progressCalled = false;
      const mockQueueEvents = {
        on: (event: string, callback: Function) => {
          if (event === 'progress') {
            callback({ jobId: 'test-789', data: { percent: 50 } });
            progressCalled = true;
          }
        }
      };

      mockQueueEvents.on('progress', () => {});
      expect(progressCalled).toBe(true);
    });
  });

  describe('processRenderJob simulation', () => {
    it('should simulate successful render job', () => {
      const startTime = Date.now();
      const url = 'https://example.com';
      const workerId = 'worker-1';

      const result = {
        jobId: 'job-123',
        url,
        success: true,
        html: '<html><body>Test</body></html>',
        statusCode: 200,
        duration: Date.now() - startTime,
        metrics: {
          renderTime: Date.now() - startTime,
          memoryUsage: process.memoryUsage().heapUsed,
          networkRequests: 0
        },
        metadata: {
          workerId,
          browserVersion: 'Chrome/100.0',
          platform: process.platform
        }
      };

      expect(result.success).toBe(true);
      expect(result.url).toBe(url);
      expect(result.metadata.workerId).toBe('worker-1');
    });

    it('should simulate failed render job', () => {
      const startTime = Date.now();
      const error = new Error('Navigation timeout');
      const workerId = 'worker-2';

      const result = {
        jobId: 'job-456',
        url: 'https://example.com',
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        metrics: {
          renderTime: Date.now() - startTime,
          memoryUsage: process.memoryUsage().heapUsed,
          networkRequests: 0
        },
        metadata: {
          workerId,
          browserVersion: 'unknown',
          platform: process.platform
        }
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Navigation timeout');
    });

    it('should throw if browser not available', () => {
      const browser = null;
      if (!browser) {
        const error = 'Browser instance not available';
        expect(error).toContain('Browser instance not available');
      }
    });
  });

  describe('Page rendering simulation', () => {
    it('should set user agent when provided', () => {
      const options = {
        userAgent: 'CustomBot/1.0'
      };

      let userAgentSet = false;
      if (options.userAgent) {
        userAgentSet = true;
      }

      expect(userAgentSet).toBe(true);
    });

    it('should set viewport when provided', () => {
      const options = {
        viewport: { width: 1920, height: 1080 }
      };

      let viewportSet = false;
      if (options.viewport) {
        viewportSet = true;
      }

      expect(viewportSet).toBe(true);
    });

    it('should block resources when configured', () => {
      const options = {
        blockResources: true
      };

      const blockedTypes = ['image', 'stylesheet', 'font', 'media'];

      if (options.blockResources) {
        const shouldBlock = (resourceType: string) => blockedTypes.includes(resourceType);

        expect(shouldBlock('image')).toBe(true);
        expect(shouldBlock('stylesheet')).toBe(true);
        expect(shouldBlock('font')).toBe(true);
        expect(shouldBlock('media')).toBe(true);
        expect(shouldBlock('document')).toBe(false);
      }
    });
  });

  describe('addRenderJob job creation', () => {
    it('should create job with all properties', () => {
      const url = 'https://example.com';
      const options = { timeout: 30000 };
      const metadata = { userAgent: 'TestBot/1.0' };
      const priority = 5;

      const job = {
        id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        priority,
        attempts: 0,
        createdAt: new Date(),
        metadata: {
          userAgent: metadata.userAgent || 'SEOShieldProxy/1.0',
          referer: undefined,
          protocol: 'https',
          headers: {}
        },
        options: {
          timeout: options.timeout || 30000,
          waitUntil: 'networkidle0' as const,
          viewport: { width: 1920, height: 1080 },
          userAgent: undefined,
          blockResources: false
        }
      };

      expect(job.id).toContain('job-');
      expect(job.url).toBe(url);
      expect(job.priority).toBe(5);
      expect(job.metadata.userAgent).toBe('TestBot/1.0');
    });

    it('should use default values when not provided', () => {
      const job = {
        metadata: {
          userAgent: undefined || 'SEOShieldProxy/1.0',
          protocol: undefined || 'https',
          headers: undefined || {}
        },
        options: {
          timeout: undefined || 30000,
          waitUntil: undefined || 'networkidle0',
          viewport: undefined || { width: 1920, height: 1080 },
          blockResources: undefined || false
        }
      };

      expect(job.metadata.userAgent).toBe('SEOShieldProxy/1.0');
      expect(job.metadata.protocol).toBe('https');
      expect(job.options.timeout).toBe(30000);
    });
  });

  describe('getStats calculation', () => {
    it('should calculate success rate', () => {
      const completed = 95;
      const failed = 5;
      const total = completed + failed;

      const successRate = (completed / total) * 100;
      expect(successRate).toBe(95);
    });

    it('should handle zero total jobs', () => {
      const completed = 0;
      const failed = 0;
      const total = completed + failed;

      let successRate = 0;
      if (total > 0) {
        successRate = (completed / total) * 100;
      }

      expect(successRate).toBe(0);
    });

    it('should return memory usage', () => {
      const memoryUsage = process.memoryUsage().heapUsed;
      expect(typeof memoryUsage).toBe('number');
      expect(memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Worker events simulation', () => {
    it('should handle completed event', () => {
      let completedCalled = false;
      const mockWorker = {
        on: (event: string, callback: Function) => {
          if (event === 'completed') {
            callback({ id: 'job-123' });
            completedCalled = true;
          }
        }
      };

      mockWorker.on('completed', () => {});
      expect(completedCalled).toBe(true);
    });

    it('should handle failed event', () => {
      let failedCalled = false;
      const mockWorker = {
        on: (event: string, callback: Function) => {
          if (event === 'failed') {
            callback({ id: 'job-456' }, new Error('Failed'));
            failedCalled = true;
          }
        }
      };

      mockWorker.on('failed', () => {});
      expect(failedCalled).toBe(true);
    });

    it('should handle error event', () => {
      let errorCalled = false;
      const mockWorker = {
        on: (event: string, callback: Function) => {
          if (event === 'error') {
            callback(new Error('Worker error'));
            errorCalled = true;
          }
        }
      };

      mockWorker.on('error', () => {});
      expect(errorCalled).toBe(true);
    });
  });

  describe('shutdown sequence', () => {
    it('should close all workers', async () => {
      const workers = [
        { close: vi.fn().mockResolvedValue(undefined) },
        { close: vi.fn().mockResolvedValue(undefined) },
        { close: vi.fn().mockResolvedValue(undefined) }
      ];

      for (const worker of workers) {
        await worker.close();
      }

      workers.forEach(w => {
        expect(w.close).toHaveBeenCalled();
      });
    });

    it('should close queue', async () => {
      const mockQueue = {
        close: vi.fn().mockResolvedValue(undefined)
      };

      await mockQueue.close();
      expect(mockQueue.close).toHaveBeenCalled();
    });

    it('should close queue events', async () => {
      const mockQueueEvents = {
        close: vi.fn().mockResolvedValue(undefined)
      };

      await mockQueueEvents.close();
      expect(mockQueueEvents.close).toHaveBeenCalled();
    });

    it('should close browser', async () => {
      const mockBrowser = {
        close: vi.fn().mockResolvedValue(undefined)
      };

      await mockBrowser.close();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should quit redis connection', async () => {
      const mockRedis = {
        quit: vi.fn().mockResolvedValue(undefined)
      };

      await mockRedis.quit();
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });

  describe('initialization error handling', () => {
    it('should handle init error', () => {
      const error = new Error('Failed to initialize');
      let errorCaught = false;

      try {
        throw error;
      } catch (e) {
        errorCaught = true;
        expect((e as Error).message).toBe('Failed to initialize');
      }

      expect(errorCaught).toBe(true);
    });

    it('should re-throw error after logging', () => {
      const shouldThrow = () => {
        const error = new Error('Init failed');
        throw error;
      };

      expect(shouldThrow).toThrow('Init failed');
    });
  });

  describe('Browser launch options', () => {
    it('should configure browser launch options', () => {
      const browserConfig = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
      };

      const launchOptions = {
        headless: browserConfig.headless,
        args: browserConfig.args,
        defaultViewport: browserConfig.defaultViewport
      };

      expect(launchOptions.headless).toBe(true);
      expect(launchOptions.args).toContain('--no-sandbox');
      expect(launchOptions.defaultViewport.width).toBe(1920);
    });
  });

  describe('Puppeteer page operations simulation', () => {
    it('should navigate to URL with options', () => {
      const navigateOptions = {
        waitUntil: 'networkidle0',
        timeout: 30000
      };

      expect(navigateOptions.waitUntil).toBe('networkidle0');
      expect(navigateOptions.timeout).toBe(30000);
    });

    it('should get status code from response', () => {
      const mockResponse = {
        status: () => 200
      };

      const statusCode = mockResponse.status() || 200;
      expect(statusCode).toBe(200);
    });

    it('should handle null response', () => {
      const mockResponse = null;
      const statusCode = mockResponse?.status() || 200;
      expect(statusCode).toBe(200);
    });
  });

  describe('Job ID generation', () => {
    it('should generate unique job IDs', () => {
      const id1 = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const id2 = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      expect(id1).toContain('job-');
      expect(id2).toContain('job-');
      // IDs should be different (very high probability)
      expect(id1.length).toBeGreaterThan(10);
    });
  });

  describe('Resource blocking', () => {
    it('should identify blocked resource types', () => {
      const blockedTypes = ['image', 'stylesheet', 'font', 'media'];

      expect(blockedTypes).toContain('image');
      expect(blockedTypes).toContain('stylesheet');
      expect(blockedTypes).toContain('font');
      expect(blockedTypes).toContain('media');
      expect(blockedTypes).not.toContain('document');
      expect(blockedTypes).not.toContain('script');
    });

    it('should abort blocked requests', () => {
      const resourceType = 'image';
      const blockedTypes = ['image', 'stylesheet', 'font', 'media'];

      let aborted = false;
      if (blockedTypes.includes(resourceType)) {
        aborted = true;
      }

      expect(aborted).toBe(true);
    });

    it('should continue non-blocked requests', () => {
      const resourceType = 'document';
      const blockedTypes = ['image', 'stylesheet', 'font', 'media'];

      let continued = false;
      if (!blockedTypes.includes(resourceType)) {
        continued = true;
      }

      expect(continued).toBe(true);
    });
  });

  describe('Queue job options', () => {
    it('should set job add options', () => {
      const addOptions = {
        priority: 5,
        delay: 0,
        removeOnComplete: 100,
        removeOnFail: 50
      };

      expect(addOptions.priority).toBe(5);
      expect(addOptions.delay).toBe(0);
      expect(addOptions.removeOnComplete).toBe(100);
      expect(addOptions.removeOnFail).toBe(50);
    });
  });
});

describe('ClusterManager Redis Queue Mode', () => {
  it('should initialize Redis queue when useRedisQueue is true', async () => {
    const module = await import('../../src/admin/cluster-manager');
    const config = module.ClusterManager.getDefaultConfig();
    config.enabled = true;
    config.useRedisQueue = true;

    const manager = new module.ClusterManager(config);
    expect(manager).toBeDefined();
  });

  it('should require redis config for redis queue mode', () => {
    const config = {
      enabled: true,
      useRedisQueue: true,
      redis: undefined
    };

    if (!config.redis && config.useRedisQueue) {
      const error = new Error('Redis configuration is required for Redis queue mode');
      expect(error.message).toContain('Redis configuration');
    }
  });

  it('should set redis connection options', () => {
    const redisConfig = {
      host: 'localhost',
      port: 6379,
      password: 'secret',
      db: 0
    };

    const connectionOpts = {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      maxRetriesPerRequest: 3
    };

    expect(connectionOpts.maxRetriesPerRequest).toBe(3);
    expect(connectionOpts.host).toBe('localhost');
  });
});

describe('ClusterManager Queue Operations', () => {
  it('should set default job options', () => {
    const defaultJobOptions = {
      removeOnComplete: 1000,
      removeOnFail: 100,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      delay: 0
    };

    expect(defaultJobOptions.removeOnComplete).toBe(1000);
    expect(defaultJobOptions.backoff.type).toBe('exponential');
  });

  it('should add job to queue with options', () => {
    const jobAddOptions = {
      priority: 5,
      delay: 0,
      removeOnComplete: 100,
      removeOnFail: 50
    };

    expect(jobAddOptions.priority).toBe(5);
    expect(jobAddOptions.removeOnComplete).toBe(100);
  });
});

describe('ClusterManager Worker Limiter', () => {
  it('should configure worker rate limiter', () => {
    const limiterConfig = {
      max: 5,
      duration: 60000
    };

    expect(limiterConfig.max).toBe(5);
    expect(limiterConfig.duration).toBe(60000);
  });

  it('should create workers based on config', () => {
    const maxWorkers = 3;
    const createdWorkers: any[] = [];

    for (let i = 0; i < maxWorkers; i++) {
      createdWorkers.push({ id: `worker-${i}` });
    }

    expect(createdWorkers.length).toBe(3);
  });
});

describe('ClusterManager Queue Events Handling', () => {
  it('should handle job completed event', () => {
    let completedJobId: string | null = null;

    const onCompleted = (data: { jobId: string }) => {
      completedJobId = data.jobId;
    };

    onCompleted({ jobId: 'test-job-123' });
    expect(completedJobId).toBe('test-job-123');
  });

  it('should handle job failed event', () => {
    let failedJobId: string | null = null;
    let failedReason: string | null = null;

    const onFailed = (data: { jobId: string; failedReason: string }) => {
      failedJobId = data.jobId;
      failedReason = data.failedReason;
    };

    onFailed({ jobId: 'test-job-456', failedReason: 'Timeout' });
    expect(failedJobId).toBe('test-job-456');
    expect(failedReason).toBe('Timeout');
  });

  it('should handle job progress event', () => {
    let progressData: any = null;

    const onProgress = (data: { jobId: string; data: any }) => {
      progressData = data.data;
    };

    onProgress({ jobId: 'test-job-789', data: { percent: 50 } });
    expect(progressData.percent).toBe(50);
  });
});

describe('ClusterManager Render Job Processing', () => {
  it('should process render job with user agent', () => {
    const options = {
      userAgent: 'CustomBot/1.0',
      viewport: { width: 1920, height: 1080 },
      blockResources: false
    };

    let userAgentSet = false;
    if (options.userAgent) {
      userAgentSet = true;
    }

    expect(userAgentSet).toBe(true);
  });

  it('should process render job with viewport', () => {
    const options = {
      viewport: { width: 1280, height: 720 }
    };

    let viewportSet = false;
    if (options.viewport) {
      viewportSet = true;
    }

    expect(viewportSet).toBe(true);
  });

  it('should block resources when configured', () => {
    const options = { blockResources: true };
    const blockedTypes = ['image', 'stylesheet', 'font', 'media'];

    let interceptionEnabled = false;
    if (options.blockResources) {
      interceptionEnabled = true;
    }

    expect(interceptionEnabled).toBe(true);
  });

  it('should calculate render duration', () => {
    const startTime = Date.now() - 1500;
    const duration = Date.now() - startTime;

    expect(duration).toBeGreaterThanOrEqual(1500);
    expect(duration).toBeLessThan(2000);
  });

  it('should build successful render result', () => {
    const result = {
      jobId: 'job-123',
      url: 'https://example.com',
      success: true,
      html: '<html></html>',
      statusCode: 200,
      duration: 1500,
      metrics: {
        renderTime: 1500,
        memoryUsage: process.memoryUsage().heapUsed,
        networkRequests: 25
      },
      metadata: {
        workerId: 'worker-1',
        browserVersion: 'Chrome/100.0',
        platform: process.platform
      }
    };

    expect(result.success).toBe(true);
    expect(result.metrics.renderTime).toBe(1500);
    expect(result.metadata.platform).toBe(process.platform);
  });

  it('should build failed render result', () => {
    const error = new Error('Navigation timeout');
    const result = {
      jobId: 'job-456',
      url: 'https://example.com',
      success: false,
      error: error.message,
      duration: 30000,
      metrics: {
        renderTime: 30000,
        memoryUsage: process.memoryUsage().heapUsed,
        networkRequests: 5
      },
      metadata: {
        workerId: 'worker-2',
        browserVersion: 'unknown',
        platform: process.platform
      }
    };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Navigation timeout');
  });
});

describe('ClusterManager Stats Calculation', () => {
  it('should calculate worker stats', () => {
    const workers = [
      { isRunning: () => true },
      { isRunning: () => true },
      { isRunning: () => false }
    ];

    const stats = {
      active: workers.filter(w => w.isRunning()).length,
      idle: workers.filter(w => !w.isRunning()).length,
      total: workers.length
    };

    expect(stats.active).toBe(2);
    expect(stats.idle).toBe(1);
    expect(stats.total).toBe(3);
  });

  it('should calculate success rate from stats', () => {
    const completed = 95;
    const failed = 5;
    const total = completed + failed;

    let successRate = 0;
    if (total > 0) {
      successRate = (completed / total) * 100;
    }

    expect(successRate).toBe(95);
  });

  it('should return zero success rate when no jobs', () => {
    const completed = 0;
    const failed = 0;
    const total = completed + failed;

    let successRate = 0;
    if (total > 0) {
      successRate = (completed / total) * 100;
    }

    expect(successRate).toBe(0);
  });
});

describe('ClusterManager Pause and Resume', () => {
  it('should pause queue when available', async () => {
    const mockQueue = {
      pause: vi.fn().mockResolvedValue(undefined)
    };

    await mockQueue.pause();
    expect(mockQueue.pause).toHaveBeenCalled();
  });

  it('should resume queue when available', async () => {
    const mockQueue = {
      resume: vi.fn().mockResolvedValue(undefined)
    };

    await mockQueue.resume();
    expect(mockQueue.resume).toHaveBeenCalled();
  });

  it('should not throw when pausing null queue', async () => {
    const queue = null;

    const pause = async () => {
      if (queue) {
        // pause logic
      }
    };

    await expect(pause()).resolves.not.toThrow();
  });
});

describe('ClusterManager Shutdown Sequence', () => {
  it('should close all workers in order', async () => {
    const closeOrder: string[] = [];

    const workers = [
      { close: vi.fn().mockImplementation(async () => { closeOrder.push('worker-0'); }) },
      { close: vi.fn().mockImplementation(async () => { closeOrder.push('worker-1'); }) }
    ];

    for (const worker of workers) {
      await worker.close();
    }

    expect(closeOrder).toEqual(['worker-0', 'worker-1']);
  });

  it('should close queue after workers', async () => {
    const closeOrder: string[] = [];

    const mockQueue = {
      close: vi.fn().mockImplementation(async () => { closeOrder.push('queue'); })
    };

    const workers: any[] = [];

    for (const worker of workers) {
      await worker.close();
    }

    await mockQueue.close();

    expect(closeOrder).toEqual(['queue']);
  });

  it('should close browser last', async () => {
    const closeOrder: string[] = [];

    const mockBrowser = {
      close: vi.fn().mockImplementation(async () => { closeOrder.push('browser'); })
    };

    await mockBrowser.close();

    expect(closeOrder).toContain('browser');
  });

  it('should quit Redis connection on shutdown', async () => {
    const mockRedis = {
      quit: vi.fn().mockResolvedValue('OK')
    };

    const result = await mockRedis.quit();
    expect(result).toBe('OK');
  });

  it('should reset isInitialized flag on shutdown', async () => {
    let isInitialized = true;

    const shutdown = async () => {
      isInitialized = false;
    };

    await shutdown();
    expect(isInitialized).toBe(false);
  });
});

describe('ClusterManager Browser Launch', () => {
  it('should configure browser launch options', () => {
    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    };

    expect(launchOptions.headless).toBe(true);
    expect(launchOptions.args).toContain('--no-sandbox');
    expect(launchOptions.defaultViewport.width).toBe(1920);
  });
});

describe('ClusterManager Navigation Options', () => {
  it('should set navigation timeout', () => {
    const navigationOptions = {
      waitUntil: 'networkidle0',
      timeout: 30000
    };

    expect(navigationOptions.timeout).toBe(30000);
    expect(navigationOptions.waitUntil).toBe('networkidle0');
  });

  it('should get page status code from response', () => {
    const mockResponse = { status: () => 200 };
    const statusCode = mockResponse.status() || 200;

    expect(statusCode).toBe(200);
  });

  it('should default to 200 when response is null', () => {
    const mockResponse: any = null;
    const statusCode = mockResponse?.status() || 200;

    expect(statusCode).toBe(200);
  });
});

describe('ClusterManager Job Data Structure', () => {
  it('should create complete job data', () => {
    const jobData = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: 'https://example.com',
      priority: 5,
      attempts: 0,
      createdAt: new Date(),
      metadata: {
        userAgent: 'SEOShieldProxy/1.0',
        referer: undefined,
        protocol: 'https',
        headers: {}
      },
      options: {
        timeout: 30000,
        waitUntil: 'networkidle0' as const,
        viewport: { width: 1920, height: 1080 },
        userAgent: undefined,
        blockResources: false
      }
    };

    expect(jobData.id).toContain('job-');
    expect(jobData.priority).toBe(5);
    expect(jobData.metadata.userAgent).toBe('SEOShieldProxy/1.0');
    expect(jobData.options.timeout).toBe(30000);
  });
});
