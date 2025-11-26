import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPage = {
  goto: vi.fn().mockResolvedValue({ status: () => 200, headers: () => ({}) }),
  setViewport: vi.fn().mockResolvedValue(undefined),
  setUserAgent: vi.fn().mockResolvedValue(undefined),
  screenshot: vi.fn().mockResolvedValue(Buffer.from('test')),
  content: vi.fn().mockResolvedValue('<html></html>'),
  title: vi.fn().mockResolvedValue('Test'),
  evaluate: vi.fn().mockResolvedValue({}),
  metrics: vi.fn().mockResolvedValue({
    JSHeapUsedSize: 1000,
    JSHeapTotalSize: 2000,
    JSHeapSizeLimit: 5000
  }),
  on: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined)
};

const mockBrowser = {
  newPage: vi.fn().mockResolvedValue(mockPage)
};

vi.mock('../../src/browser', () => ({
  default: {
    getBrowser: vi.fn().mockResolvedValue(mockBrowser),
    getPage: vi.fn().mockResolvedValue(mockPage),
    releasePage: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../../src/cache', () => ({
  default: {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(undefined)
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

describe('UASimulator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import UASimulator', async () => {
      const module = await import('../../src/admin/ua-simulator');
      expect(module.default).toBeDefined();
    });

    it('should be a singleton', async () => {
      const module1 = await import('../../src/admin/ua-simulator');
      const module2 = await import('../../src/admin/ua-simulator');
      expect(module1.default).toBe(module2.default);
    });
  });

  describe('getUserAgents', () => {
    it('should have getUserAgents method', async () => {
      const module = await import('../../src/admin/ua-simulator');
      expect(typeof module.default.getUserAgents).toBe('function');
    });

    it('should get user agents as array', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgents();
      expect(Array.isArray(uas)).toBe(true);
    });

    it('should return sorted by popularity descending', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgents();

      for (let i = 0; i < uas.length - 1; i++) {
        expect(uas[i].popularity).toBeGreaterThanOrEqual(uas[i + 1].popularity);
      }
    });

    it('should include Googlebot templates', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgents();

      const googlebot = uas.find(ua => ua.id === 'googlebot-desktop');
      expect(googlebot).toBeDefined();
      expect(googlebot?.name).toBe('Googlebot Desktop');
      expect(googlebot?.category).toBe('searchbot');
    });

    it('should include social bot templates', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgents();

      const facebookBot = uas.find(ua => ua.id === 'facebookbot');
      expect(facebookBot).toBeDefined();
      expect(facebookBot?.category).toBe('socialbot');
    });

    it('should include browser templates', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgents();

      const chrome = uas.find(ua => ua.id === 'chrome-desktop');
      expect(chrome).toBeDefined();
      expect(chrome?.category).toBe('browser');
    });

    it('should include capabilities for each template', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgents();

      for (const ua of uas) {
        expect(ua.capabilities).toBeDefined();
        expect(typeof ua.capabilities.javascript).toBe('boolean');
        expect(typeof ua.capabilities.css).toBe('boolean');
        expect(typeof ua.capabilities.images).toBe('boolean');
        expect(typeof ua.capabilities.cookies).toBe('boolean');
      }
    });
  });

  describe('getUserAgent', () => {
    it('should return user agent by ID', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('googlebot-desktop');

      expect(ua).not.toBeNull();
      expect(ua?.id).toBe('googlebot-desktop');
      expect(ua?.name).toBe('Googlebot Desktop');
    });

    it('should return null for unknown ID', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('unknown-bot');

      expect(ua).toBeNull();
    });

    it('should return bingbot template', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('bingbot');

      expect(ua).not.toBeNull();
      expect(ua?.name).toBe('Bingbot');
    });

    it('should return mobile safari template', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('safari-mobile');

      expect(ua).not.toBeNull();
      expect(ua?.category).toBe('mobile');
    });
  });

  describe('getUserAgentsByCategory', () => {
    it('should filter by searchbot category', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgentsByCategory('searchbot');

      expect(uas.length).toBeGreaterThan(0);
      for (const ua of uas) {
        expect(ua.category).toBe('searchbot');
      }
    });

    it('should filter by socialbot category', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgentsByCategory('socialbot');

      expect(uas.length).toBeGreaterThan(0);
      for (const ua of uas) {
        expect(ua.category).toBe('socialbot');
      }
    });

    it('should filter by monitoring category', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgentsByCategory('monitoring');

      expect(uas.length).toBeGreaterThan(0);
      for (const ua of uas) {
        expect(ua.category).toBe('monitoring');
      }
    });

    it('should filter by browser category', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgentsByCategory('browser');

      expect(uas.length).toBeGreaterThan(0);
      for (const ua of uas) {
        expect(ua.category).toBe('browser');
      }
    });

    it('should filter by mobile category', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgentsByCategory('mobile');

      expect(uas.length).toBeGreaterThan(0);
      for (const ua of uas) {
        expect(ua.category).toBe('mobile');
      }
    });
  });

  describe('getStats', () => {
    it('should have getStats method', async () => {
      const module = await import('../../src/admin/ua-simulator');
      expect(typeof module.default.getStats).toBe('function');
    });

    it('should return stats object', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const stats = module.default.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalSimulations).toBe('number');
      expect(typeof stats.successfulSimulations).toBe('number');
      expect(typeof stats.failedSimulations).toBe('number');
      expect(typeof stats.averageRenderTime).toBe('number');
      expect(Array.isArray(stats.topUserAgents)).toBe(true);
    });

    it('should return zero stats when no simulations', async () => {
      vi.resetModules();
      const module = await import('../../src/admin/ua-simulator');
      module.default.clearHistory();

      const stats = module.default.getStats();

      expect(stats.totalSimulations).toBe(0);
      expect(stats.successfulSimulations).toBe(0);
      expect(stats.failedSimulations).toBe(0);
      expect(stats.averageRenderTime).toBe(0);
    });
  });

  describe('getSimulationHistory', () => {
    it('should return simulation history', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const history = module.default.getSimulationHistory();

      expect(Array.isArray(history)).toBe(true);
    });

    it('should accept limit parameter', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const history = module.default.getSimulationHistory(5);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeLessThanOrEqual(5);
    });

    it('should default to limit of 20', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const history = module.default.getSimulationHistory();

      expect(history.length).toBeLessThanOrEqual(20);
    });
  });

  describe('getActiveSimulations', () => {
    it('should return active simulations', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const active = module.default.getActiveSimulations();

      expect(Array.isArray(active)).toBe(true);
    });
  });

  describe('clearHistory', () => {
    it('should clear simulation history', async () => {
      const module = await import('../../src/admin/ua-simulator');

      module.default.clearHistory();

      const history = module.default.getSimulationHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('getSimulation', () => {
    it('should return null for unknown simulation ID', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const simulation = module.default.getSimulation('unknown-id');

      expect(simulation).toBeNull();
    });
  });

  describe('cancelSimulation', () => {
    it('should return false for unknown simulation ID', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const result = await module.default.cancelSimulation('unknown-id');

      expect(result).toBe(false);
    });
  });

  describe('startSimulation', () => {
    it('should have startSimulation method', async () => {
      const module = await import('../../src/admin/ua-simulator');
      expect(typeof module.default.startSimulation).toBe('function');
    });

    it('should create simulation request', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('googlebot-desktop');

      if (ua) {
        const request = await module.default.startSimulation('https://example.com', ua);

        expect(request).toBeDefined();
        expect(request.id).toMatch(/^sim_/);
        expect(request.url).toBe('https://example.com');
        expect(request.userAgent).toBe(ua.userAgent);
        // Status can be pending or running since simulation starts immediately in background
        expect(['pending', 'running']).toContain(request.status);
      }
    });

    it('should set default options', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('googlebot-desktop');

      if (ua) {
        const request = await module.default.startSimulation('https://example.com', ua);

        expect(request.options.width).toBe(1200);
        expect(request.options.height).toBe(800);
        expect(request.options.deviceScaleFactor).toBe(1);
        expect(request.options.waitUntil).toBe('networkidle2');
        expect(request.options.timeout).toBe(30000);
      }
    });

    it('should accept custom options', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('googlebot-desktop');

      if (ua) {
        const request = await module.default.startSimulation('https://example.com', ua, {
          width: 1920,
          height: 1080,
          timeout: 60000
        });

        expect(request.options.width).toBe(1920);
        expect(request.options.height).toBe(1080);
        expect(request.options.timeout).toBe(60000);
      }
    });

    it('should include timestamp in request', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('googlebot-desktop');

      if (ua) {
        const beforeTime = new Date();
        const request = await module.default.startSimulation('https://example.com', ua);
        const afterTime = new Date();

        expect(request.timestamp).toBeDefined();
        expect(request.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(request.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      }
    });
  });

  describe('compareSimulations', () => {
    it('should throw error when simulations not completed', async () => {
      const module = await import('../../src/admin/ua-simulator');

      const request1 = {
        id: 'sim_1',
        url: 'https://example.com',
        userAgent: 'test',
        options: {},
        timestamp: new Date(),
        status: 'pending' as const
      };

      const request2 = {
        id: 'sim_2',
        url: 'https://example.com',
        userAgent: 'test2',
        options: {},
        timestamp: new Date(),
        status: 'pending' as const
      };

      await expect(module.default.compareSimulations(request1, request2))
        .rejects.toThrow('Both simulations must be completed to compare');
    });

    it('should compare completed simulations', async () => {
      const module = await import('../../src/admin/ua-simulator');

      const result1 = {
        html: '<html>Test 1</html>',
        screenshot: 'data:image/png;base64,test1',
        title: 'Test 1',
        status: 200,
        headers: {},
        renderTime: 1000,
        resources: {
          totalRequests: 10,
          blockedRequests: 0,
          totalSize: 50000,
          domains: ['example.com', 'cdn.example.com']
        },
        console: [],
        network: []
      };

      const result2 = {
        html: '<html>Test 2</html>',
        screenshot: 'data:image/png;base64,test2',
        title: 'Test 2',
        status: 200,
        headers: {},
        renderTime: 1500,
        resources: {
          totalRequests: 12,
          blockedRequests: 0,
          totalSize: 60000,
          domains: ['example.com', 'api.example.com']
        },
        console: [],
        network: []
      };

      const request1 = {
        id: 'sim_1',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        options: {},
        timestamp: new Date(),
        status: 'completed' as const,
        result: result1
      };

      const request2 = {
        id: 'sim_2',
        url: 'https://example.com',
        userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
        options: {},
        timestamp: new Date(),
        status: 'completed' as const,
        result: result2
      };

      const comparison = await module.default.compareSimulations(request1, request2);

      expect(comparison).toBeDefined();
      expect(comparison.requests).toHaveLength(2);
      expect(comparison.comparison.renderTimes).toHaveLength(2);
      expect(comparison.comparison.resourceDifferences).toBeDefined();
      expect(comparison.timestamp).toBeDefined();
    });

    it('should identify unique domains in comparison', async () => {
      const module = await import('../../src/admin/ua-simulator');

      const result1 = {
        html: '<html>Test 1</html>',
        screenshot: 'data:image/png;base64,test1',
        title: 'Test 1',
        status: 200,
        headers: {},
        renderTime: 1000,
        resources: {
          totalRequests: 10,
          blockedRequests: 0,
          totalSize: 50000,
          domains: ['example.com', 'unique1.com']
        },
        console: [],
        network: []
      };

      const result2 = {
        html: '<html>Test 2</html>',
        screenshot: 'data:image/png;base64,test2',
        title: 'Test 2',
        status: 200,
        headers: {},
        renderTime: 1500,
        resources: {
          totalRequests: 12,
          blockedRequests: 0,
          totalSize: 60000,
          domains: ['example.com', 'unique2.com']
        },
        console: [],
        network: []
      };

      const request1 = {
        id: 'sim_1',
        url: 'https://example.com',
        userAgent: 'test1',
        options: {},
        timestamp: new Date(),
        status: 'completed' as const,
        result: result1
      };

      const request2 = {
        id: 'sim_2',
        url: 'https://example.com',
        userAgent: 'test2',
        options: {},
        timestamp: new Date(),
        status: 'completed' as const,
        result: result2
      };

      const comparison = await module.default.compareSimulations(request1, request2);

      expect(comparison.comparison.resourceDifferences.uniqueToFirst).toContain('unique1.com');
      expect(comparison.comparison.resourceDifferences.uniqueToSecond).toContain('unique2.com');
      expect(comparison.comparison.resourceDifferences.common).toContain('example.com');
    });
  });

  describe('user agent templates', () => {
    it('should have googlebot-mobile template', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('googlebot-mobile');

      expect(ua).not.toBeNull();
      expect(ua?.name).toBe('Googlebot Smartphone');
      expect(ua?.userAgent).toContain('Googlebot');
    });

    it('should have Yahoo Slurp template', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('slurp');

      expect(ua).not.toBeNull();
      expect(ua?.name).toBe('Yahoo! Slurp');
    });

    it('should have Twitter bot template', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('twitterbot');

      expect(ua).not.toBeNull();
      expect(ua?.category).toBe('socialbot');
    });

    it('should have LinkedIn bot template', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('linkedinbot');

      expect(ua).not.toBeNull();
      expect(ua?.category).toBe('socialbot');
    });

    it('should have SEMrush bot template', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('semrushbot');

      expect(ua).not.toBeNull();
      expect(ua?.category).toBe('monitoring');
    });

    it('should have Ahrefs bot template', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('ahrefsbot');

      expect(ua).not.toBeNull();
      expect(ua?.category).toBe('monitoring');
    });
  });

  describe('user agent capabilities', () => {
    it('should have JavaScript enabled for Googlebot', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('googlebot-desktop');

      expect(ua?.capabilities.javascript).toBe(true);
    });

    it('should have JavaScript disabled for Facebook bot', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('facebookbot');

      expect(ua?.capabilities.javascript).toBe(false);
    });

    it('should have cookies enabled for Chrome browser', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const ua = module.default.getUserAgent('chrome-desktop');

      expect(ua?.capabilities.cookies).toBe(true);
    });

    it('should have cookies disabled for search bots', async () => {
      const module = await import('../../src/admin/ua-simulator');
      const uas = module.default.getUserAgentsByCategory('searchbot');

      for (const ua of uas) {
        expect(ua.capabilities.cookies).toBe(false);
      }
    });
  });
});
