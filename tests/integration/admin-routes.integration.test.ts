import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

// Mock dependencies before importing admin-routes
vi.mock('../../src/cache', () => ({
  default: {
    get: vi.fn((key: string) => key === 'http://test.com' ? '{"content":"<html></html>","renderTime":1700000000000}' : undefined),
    set: vi.fn(() => true),
    delete: vi.fn(() => 1),
    flush: vi.fn(),
    getStats: vi.fn(() => ({ keys: 5, hits: 10, misses: 2, ksize: 50, vsize: 100 })),
    keys: vi.fn(() => ['key1', 'key2']),
    getAllEntries: vi.fn(() => [{ url: 'http://test.com', size: 1000, ttl: 3600000 }]),
    isReady: vi.fn(() => true),
    close: vi.fn().mockResolvedValue(undefined),
    getWithTTL: vi.fn()
  },
  getCache: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(() => true),
    delete: vi.fn(() => 1),
    flush: vi.fn(),
    getStats: vi.fn(() => ({ keys: 5, hits: 10, misses: 2 })),
    keys: vi.fn(() => []),
    getAllEntries: vi.fn(() => []),
    isReady: vi.fn(() => true)
  })
}));

vi.mock('../../src/admin/metrics-collector', () => ({
  default: {
    getStats: vi.fn(() => ({
      totalRequests: 1000,
      successfulRequests: 950,
      failedRequests: 50,
      avgResponseTime: 150,
      cacheHitRate: 75
    })),
    getBotStats: vi.fn(() => ({
      Googlebot: 100,
      Bingbot: 50,
      others: 850
    })),
    getRecentRequests: vi.fn(() => []),
    reset: vi.fn()
  }
}));

vi.mock('../../src/admin/cache-warmer', () => ({
  default: {
    getStats: vi.fn(() => ({ queued: 5, processed: 95, total: 100 })),
    addUrls: vi.fn(() => ({ added: 2 })),
    parseSitemap: vi.fn().mockResolvedValue(['http://test.com/1', 'http://test.com/2']),
    clear: vi.fn(),
    warmUrl: vi.fn().mockResolvedValue({ added: 1 })
  }
}));

vi.mock('../../src/admin/hotfix-engine', () => ({
  default: {
    getRules: vi.fn(() => [{ id: 'rule-1', name: 'Test Rule', urlPattern: '/test/*', enabled: true }]),
    getStats: vi.fn(() => ({ totalRules: 1, activeRules: 1 })),
    createRule: vi.fn(() => ({ id: 'rule-2', name: 'New Rule' })),
    getRule: vi.fn((id: string) => id === 'rule-1' ? { id: 'rule-1', name: 'Test Rule' } : null),
    updateRule: vi.fn(() => ({ id: 'rule-1', name: 'Updated Rule' })),
    deleteRule: vi.fn(() => true),
    toggleRule: vi.fn(() => true),
    testUrl: vi.fn(() => ({ matched: true, rules: ['rule-1'] })),
    getTestHistory: vi.fn(() => [])
  }
}));

vi.mock('../../src/admin/forensics-collector', () => ({
  default: {
    getStats: vi.fn(() => ({ totalErrors: 100, resolvedErrors: 80 })),
    getErrors: vi.fn(() => ({ errors: [], total: 0 })),
    getError: vi.fn((id: string) => id === 'error-1' ? { id: 'error-1', message: 'Test Error' } : null),
    deleteError: vi.fn(() => true),
    cleanup: vi.fn(() => 50)
  }
}));

vi.mock('../../src/admin/blocking-manager', () => ({
  default: {
    getRules: vi.fn(() => [{ id: 'block-1', name: 'Block Rule', pattern: '/admin/*', enabled: true }]),
    getStats: vi.fn(() => ({ totalBlocked: 500, activeRules: 3 })),
    createRule: vi.fn(() => ({ id: 'block-2', name: 'New Block Rule' })),
    testRequest: vi.fn(() => ({ blocked: false })),
    updateRule: vi.fn(() => ({ id: 'block-1', name: 'Updated Block Rule' })),
    deleteRule: vi.fn(() => true),
    toggleRule: vi.fn(() => true),
    getRule: vi.fn((id: string) => id === 'block-1' ? { id: 'block-1', name: 'Block Rule' } : null)
  }
}));

vi.mock('../../src/admin/ua-simulator', () => ({
  default: {
    getUserAgents: vi.fn(() => [{ id: 'googlebot', name: 'Googlebot', userAgent: 'Googlebot/2.1' }]),
    getUserAgent: vi.fn((id: string) => id === 'googlebot' ? { id: 'googlebot', name: 'Googlebot' } : null),
    startSimulation: vi.fn().mockResolvedValue({ id: 'sim-1', status: 'running' }),
    getSimulation: vi.fn((id: string) => id === 'sim-1' ? { id: 'sim-1', status: 'completed' } : null),
    getHistory: vi.fn(() => []),
    compareSimulations: vi.fn(() => ({ differences: 5 })),
    cancelSimulation: vi.fn(() => true)
  }
}));

vi.mock('../../src/admin/snapshot-service', () => ({
  default: {
    captureSnapshot: vi.fn().mockResolvedValue({ id: 'snap-1', url: 'http://test.com' }),
    getSnapshot: vi.fn((id: string) => id === 'snap-1' ? { id: 'snap-1', url: 'http://test.com' } : null),
    getAllSnapshots: vi.fn(() => ({ snapshots: [], total: 0 })),
    getSnapshotsByUrl: vi.fn(() => []),
    compareSnapshots: vi.fn().mockResolvedValue({ changes: 5 }),
    getDiff: vi.fn((id: string) => id === 'diff-1' ? { id: 'diff-1', changes: 5 } : null),
    deleteSnapshot: vi.fn(() => true)
  }
}));

vi.mock('../../src/admin/config-manager', () => ({
  default: {
    getConfig: vi.fn(() => ({
      cacheEnabled: true,
      cacheTTL: 3600000,
      botDetectionEnabled: true,
      adminAuth: {
        enabled: false
      }
    })),
    updateConfig: vi.fn((updates: any) => ({ ...updates, updated: true })),
    resetConfig: vi.fn(() => ({ cacheEnabled: true, reset: true })),
    manageBots: vi.fn(() => ({ success: true }))
  }
}));

vi.mock('../../src/admin/ssr-events-store', () => {
  const mockStore = {
    getEvents: vi.fn(() => [{ id: 'event-1', type: 'render' }]),
    getStats: vi.fn(() => ({ totalRenders: 1000, avgRenderTime: 150 }))
  };
  return {
    default: mockStore,
    ssrEventsStore: mockStore
  };
});

vi.mock('../../src/browser', () => ({
  default: {
    getActiveBrowsers: vi.fn(() => 2),
    getPoolStats: vi.fn(() => ({ available: 3, busy: 1, total: 4 })),
    close: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../../src/admin/seo-protocols-service', () => {
  const mockService = {
    getStatus: vi.fn(() => ({ protocols: [] })),
    getMetrics: vi.fn(() => ({ requests: 1000 })),
    toggleProtocol: vi.fn(() => true),
    runProtocol: vi.fn().mockResolvedValue({ status: 'success' })
  };
  return {
    default: mockService,
    getSEOProtocolsService: vi.fn(() => mockService)
  };
});

vi.mock('../../src/admin/websocket', () => ({
  default: {
    broadcastTrafficEvent: vi.fn()
  },
  broadcastTrafficEvent: vi.fn()
}));

vi.mock('../../src/database/database-manager', () => {
  const mockDbManager = {
    isConnected: vi.fn(() => true),
    getHealth: vi.fn(() => ({ connected: true, stats: {} })),
    getAdditionalStats: vi.fn().mockResolvedValue({}),
    getAuditLogs: vi.fn().mockResolvedValue([]),
    logAudit: vi.fn().mockResolvedValue(undefined),
    getErrorLogs: vi.fn().mockResolvedValue([]),
    logError: vi.fn().mockResolvedValue(undefined)
  };
  return {
    default: mockDbManager,
    databaseManager: mockDbManager
  };
});

vi.mock('../../src/config', () => ({
  default: {
    PORT: 8080,
    TARGET_URL: 'http://localhost:3000',
    CACHE_TTL: 60000,
    NODE_ENV: 'test',
    adminAuth: {
      enabled: false
    },
    ADMIN_PASSWORD: 'test-password',
    JWT_SECRET: 'test-jwt-secret-key-for-testing'
  }
}));

describe('Admin Routes Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Import and use admin routes
    const adminRoutesModule = await import('../../src/admin/admin-routes');
    app.use('/shieldapi', adminRoutesModule.default);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /shieldapi/cache', () => {
    it('should return cache stats', async () => {
      const response = await request(app).get('/shieldapi/cache');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /shieldapi/metrics/reset', () => {
    it('should reset metrics', async () => {
      const response = await request(app).post('/shieldapi/metrics/reset');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /shieldapi/warmer/add', () => {
    it('should require URLs array', async () => {
      const response = await request(app)
        .post('/shieldapi/warmer/add')
        .send({});
      expect(response.status).toBe(400);
    });

    it('should add URLs to warmer', async () => {
      const response = await request(app)
        .post('/shieldapi/warmer/add')
        .send({ urls: ['http://test.com/1', 'http://test.com/2'] });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /shieldapi/warmer/sitemap', () => {
    it('should require sitemapUrl', async () => {
      const response = await request(app)
        .post('/shieldapi/warmer/sitemap')
        .send({});
      expect(response.status).toBe(400);
    });

    it('should parse sitemap and add URLs', async () => {
      const response = await request(app)
        .post('/shieldapi/warmer/sitemap')
        .send({ sitemapUrl: 'http://test.com/sitemap.xml' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /shieldapi/warmer/warm', () => {
    it('should require URL', async () => {
      const response = await request(app)
        .post('/shieldapi/warmer/warm')
        .send({});
      expect(response.status).toBe(400);
    });

    it('should warm single URL', async () => {
      const response = await request(app)
        .post('/shieldapi/warmer/warm')
        .send({ url: 'http://test.com' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Hotfix Endpoints', () => {
    it('GET /shieldapi/hotfix/rules should return rules', async () => {
      const response = await request(app).get('/shieldapi/hotfix/rules');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('GET /shieldapi/hotfix/stats should return stats', async () => {
      const response = await request(app).get('/shieldapi/hotfix/stats');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('POST /shieldapi/hotfix/rules should require name and urlPattern', async () => {
      const response = await request(app)
        .post('/shieldapi/hotfix/rules')
        .send({});
      expect(response.status).toBe(400);
    });

    it('POST /shieldapi/hotfix/rules should create rule', async () => {
      const response = await request(app)
        .post('/shieldapi/hotfix/rules')
        .send({ name: 'New Rule', urlPattern: '/test/*' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('PUT /shieldapi/hotfix/rules/:id should update rule', async () => {
      const response = await request(app)
        .put('/shieldapi/hotfix/rules/rule-1')
        .send({ name: 'Updated Rule' });
      expect(response.status).toBe(200);
    });

    it('DELETE /shieldapi/hotfix/rules/:id should delete rule', async () => {
      const response = await request(app).delete('/shieldapi/hotfix/rules/rule-1');
      expect(response.status).toBe(200);
    });

    it('POST /shieldapi/hotfix/rules/:id/toggle should toggle rule', async () => {
      const response = await request(app).post('/shieldapi/hotfix/rules/rule-1/toggle');
      expect(response.status).toBe(200);
    });

  });

  describe('Forensics Endpoints', () => {
    it('GET /shieldapi/forensics/stats should return stats', async () => {
      const response = await request(app).get('/shieldapi/forensics/stats');
      expect(response.status).toBe(200);
    });

    it('GET /shieldapi/forensics/errors should return errors', async () => {
      const response = await request(app).get('/shieldapi/forensics/errors');
      expect(response.status).toBe(200);
    });

    it('GET /shieldapi/forensics/errors/:id should return error', async () => {
      const response = await request(app).get('/shieldapi/forensics/errors/error-1');
      expect(response.status).toBe(200);
    });

    it('DELETE /shieldapi/forensics/errors/:id should delete error', async () => {
      const response = await request(app).delete('/shieldapi/forensics/errors/error-1');
      expect(response.status).toBe(200);
    });

  });

  describe('Blocking Endpoints', () => {
    it('GET /shieldapi/blocking/rules should return rules', async () => {
      const response = await request(app).get('/shieldapi/blocking/rules');
      expect(response.status).toBe(200);
    });

    it('GET /shieldapi/blocking/stats should return stats', async () => {
      const response = await request(app).get('/shieldapi/blocking/stats');
      expect(response.status).toBe(200);
    });

    it('POST /shieldapi/blocking/rules should require name and pattern', async () => {
      const response = await request(app)
        .post('/shieldapi/blocking/rules')
        .send({});
      expect(response.status).toBe(400);
    });

    it('POST /shieldapi/blocking/rules should create rule', async () => {
      const response = await request(app)
        .post('/shieldapi/blocking/rules')
        .send({ name: 'Block Rule', pattern: '/admin/*' });
      expect(response.status).toBe(200);
    });

    it('POST /shieldapi/blocking/test should require URL', async () => {
      const response = await request(app)
        .post('/shieldapi/blocking/test')
        .send({});
      expect(response.status).toBe(400);
    });

  });

  describe('Simulate Endpoints', () => {
    it('GET /shieldapi/simulate/user-agents should return user agents', async () => {
      const response = await request(app).get('/shieldapi/simulate/user-agents');
      expect(response.status).toBe(200);
    });

    it('POST /shieldapi/simulate/start should require URL and userAgentId', async () => {
      const response = await request(app)
        .post('/shieldapi/simulate/start')
        .send({});
      expect(response.status).toBe(400);
    });

    it('POST /shieldapi/simulate/start should start simulation', async () => {
      const response = await request(app)
        .post('/shieldapi/simulate/start')
        .send({ url: 'http://test.com', userAgentId: 'googlebot' });
      expect(response.status).toBe(200);
    });

    it('GET /shieldapi/simulate/:id should return simulation', async () => {
      const response = await request(app).get('/shieldapi/simulate/sim-1');
      expect(response.status).toBe(200);
    });
  });

  describe('Snapshot Endpoints', () => {
    it('POST /shieldapi/snapshots/capture should require URL', async () => {
      const response = await request(app)
        .post('/shieldapi/snapshots/capture')
        .send({});
      expect(response.status).toBe(400);
    });

    it('POST /shieldapi/snapshots/capture should capture snapshot', async () => {
      const response = await request(app)
        .post('/shieldapi/snapshots/capture')
        .send({ url: 'http://test.com' });
      expect(response.status).toBe(200);
    });

    it('GET /shieldapi/snapshots should return snapshots', async () => {
      const response = await request(app).get('/shieldapi/snapshots');
      expect(response.status).toBe(200);
    });

    it('GET /shieldapi/snapshots/:id should return snapshot', async () => {
      const response = await request(app).get('/shieldapi/snapshots/snap-1');
      expect(response.status).toBe(200);
    });
  });

  // Note: SSR Events, Traffic Events, Audit Logs, Error Logs, and Database Stats
  // endpoints require complex database mocking and are covered by unit tests instead
});
