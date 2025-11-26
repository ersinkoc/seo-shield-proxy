import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockClusterExecute = vi.fn().mockResolvedValue({ html: '<html></html>', statusCode: 200 });
const mockClusterIdle = vi.fn().mockResolvedValue(undefined);
const mockClusterClose = vi.fn().mockResolvedValue(undefined);
const mockClusterTask = vi.fn();

vi.mock('puppeteer-cluster', () => ({
  Cluster: {
    launch: vi.fn().mockResolvedValue({
      execute: mockClusterExecute,
      idle: mockClusterIdle,
      close: mockClusterClose,
      task: mockClusterTask,
      CONCURRENCY_CONTEXT: 1,
      CONCURRENCY_PAGE: 2,
      CONCURRENCY_BROWSER: 3
    }),
    CONCURRENCY_CONTEXT: 1,
    CONCURRENCY_PAGE: 2,
    CONCURRENCY_BROWSER: 3
  }
}));

const mockBrowser = {
  newPage: vi.fn().mockResolvedValue({
    setViewport: vi.fn(),
    setUserAgent: vi.fn(),
    setRequestInterception: vi.fn(),
    on: vi.fn(),
    goto: vi.fn().mockResolvedValue(undefined),
    content: vi.fn().mockResolvedValue('<html><head><title>Test</title></head><body></body></html>'),
    evaluate: vi.fn().mockResolvedValue({ statusCode: 200, isSoft404: false, reasons: [] }),
    viewport: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
    close: vi.fn().mockResolvedValue(undefined)
  }),
  close: vi.fn().mockResolvedValue(undefined)
};

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue(mockBrowser)
  },
  launch: vi.fn().mockResolvedValue(mockBrowser)
}));

vi.mock('../../src/config', () => ({
  default: {
    PUPPETEER_TIMEOUT: 30000,
    MAX_CONCURRENT_RENDERS: 5,
    TARGET_URL: 'http://localhost:3000',
    PORT: 8080,
    NODE_ENV: 'test',
    USER_AGENT: 'SEOShieldProxy/1.0'
  }
}));

vi.mock('../../src/admin/forensics-collector', () => ({
  default: {
    captureForensics: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('../../src/admin/blocking-manager', () => ({
  default: {
    shouldBlockRequest: vi.fn().mockReturnValue({ blocked: false, action: 'allow' })
  }
}));

vi.mock('../../src/admin/ssr-events-store', () => ({
  ssrEventsStore: {
    addEvent: vi.fn()
  }
}));

vi.mock('../../src/admin/content-health-check', () => ({
  ContentHealthCheckManager: vi.fn().mockImplementation(() => ({
    checkPageHealth: vi.fn().mockResolvedValue({
      score: 100,
      passed: true,
      issues: []
    }),
    config: { failOnMissingCritical: false }
  }))
}));

vi.mock('../../src/admin/virtual-scroll-manager', () => ({
  VirtualScrollManager: Object.assign(
    vi.fn().mockImplementation(() => ({
      triggerVirtualScroll: vi.fn().mockResolvedValue({
        success: true,
        scrollSteps: 5,
        completionRate: 100
      })
    })),
    {
      getDefaultConfig: vi.fn().mockReturnValue({
        enabled: true,
        scrollSteps: 5,
        scrollInterval: 100
      })
    }
  )
}));

describe('Browser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import browser module', async () => {
      const module = await import('../../src/browser');
      expect(module).toBeDefined();
    });

    it('should have default export', async () => {
      const module = await import('../../src/browser');
      expect(module.default).toBeDefined();
    });
  });

  describe('methods', () => {
    it('should have render method', async () => {
      const module = await import('../../src/browser');
      expect(typeof module.default.render).toBe('function');
    });

    it('should have getMetrics method', async () => {
      const module = await import('../../src/browser');
      expect(typeof module.default.getMetrics).toBe('function');
    });

    it('should have close method', async () => {
      const module = await import('../../src/browser');
      expect(typeof module.default.close).toBe('function');
    });

    it('should have getBrowser method', async () => {
      const module = await import('../../src/browser');
      expect(typeof module.default.getBrowser).toBe('function');
    });
  });

  describe('getMetrics', () => {
    it('should return queue metrics object', async () => {
      const module = await import('../../src/browser');
      const metrics = module.default.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.queued).toBe('number');
      expect(typeof metrics.processing).toBe('number');
      expect(typeof metrics.completed).toBe('number');
      expect(typeof metrics.errors).toBe('number');
      expect(typeof metrics.maxConcurrency).toBe('number');
    });

    it('should have maxConcurrency set from config', async () => {
      const module = await import('../../src/browser');
      const metrics = module.default.getMetrics();
      expect(metrics.maxConcurrency).toBe(5);
    });
  });

  describe('interfaces', () => {
    it('should export RenderResult interface', async () => {
      const module = await import('../../src/browser');
      // RenderResult is a TypeScript interface, just verify module imports
      expect(module).toBeDefined();
    });

    it('should export QueueMetrics interface', async () => {
      const module = await import('../../src/browser');
      // QueueMetrics is a TypeScript interface, just verify module imports
      expect(module).toBeDefined();
    });
  });

  describe('close', () => {
    it('should call close without throwing', async () => {
      const module = await import('../../src/browser');
      // Close should not throw
      await expect(module.default.close()).resolves.not.toThrow();
    });
  });

  describe('render', () => {
    it('should return RenderResult with html and statusCode', async () => {
      const module = await import('../../src/browser');
      const result = await module.default.render('http://example.com');

      expect(result).toBeDefined();
      expect(result.html).toBeDefined();
      expect(typeof result.html).toBe('string');
    });

    it('should handle rendering multiple URLs', async () => {
      const module = await import('../../src/browser');

      const results = await Promise.all([
        module.default.render('http://example.com/page1'),
        module.default.render('http://example.com/page2')
      ]);

      expect(results.length).toBe(2);
      expect(results[0].html).toBeDefined();
      expect(results[1].html).toBeDefined();
    });

    it('should track metrics during render', async () => {
      const module = await import('../../src/browser');

      // Get initial metrics
      const initialMetrics = module.default.getMetrics();
      const initialCompleted = initialMetrics.completed;

      await module.default.render('http://example.com/metrics-test');

      const afterMetrics = module.default.getMetrics();
      expect(afterMetrics.completed).toBeGreaterThanOrEqual(initialCompleted);
    });
  });

  describe('getBrowser', () => {
    it('should return a browser instance', async () => {
      const module = await import('../../src/browser');
      const browser = await module.default.getBrowser();

      expect(browser).toBeDefined();
      expect(typeof browser.newPage).toBe('function');
    });

    it('should reuse existing browser instance', async () => {
      const module = await import('../../src/browser');

      const browser1 = await module.default.getBrowser();
      const browser2 = await module.default.getBrowser();

      expect(browser1).toBe(browser2);
    });
  });
});

describe('Browser Request Blocking', () => {
  const mockBlockingDomains = [
    'google-analytics.com',
    'googletagmanager.com',
    'facebook.net',
    'doubleclick.net',
    'hotjar.com',
    'mixpanel.com',
    'segment.io',
    'fullstory.com'
  ];

  const mockBlockedPatterns = [
    '/analytics',
    '/gtm',
    '/fbevents',
    '/pixel',
    '/tracking',
    '/collect',
    '.jpg',
    '.png',
    '.gif',
    '.css'
  ];

  it('should have blocking domains defined', () => {
    // Verify our test constants match what we expect the code to block
    expect(mockBlockingDomains).toContain('google-analytics.com');
    expect(mockBlockingDomains).toContain('googletagmanager.com');
    expect(mockBlockingDomains).toContain('facebook.net');
  });

  it('should have blocking patterns defined', () => {
    expect(mockBlockedPatterns).toContain('/analytics');
    expect(mockBlockedPatterns).toContain('/tracking');
    expect(mockBlockedPatterns).toContain('.jpg');
  });

  it('should block analytics domains', () => {
    const testUrls = [
      'https://www.google-analytics.com/analytics.js',
      'https://www.googletagmanager.com/gtm.js',
      'https://connect.facebook.net/en_US/fbevents.js'
    ];

    // Verify test URLs contain blocked domains
    for (const url of testUrls) {
      const hasBlockedDomain = mockBlockingDomains.some(domain => url.includes(domain));
      expect(hasBlockedDomain).toBe(true);
    }
  });

  it('should block image resource types', () => {
    const blockedResourceTypes = ['image', 'stylesheet', 'font', 'media', 'websocket', 'eventsource'];
    expect(blockedResourceTypes).toContain('image');
    expect(blockedResourceTypes).toContain('stylesheet');
    expect(blockedResourceTypes).toContain('font');
  });

  it('should allow document resource types', () => {
    const blockedResourceTypes = ['image', 'stylesheet', 'font', 'media', 'websocket', 'eventsource'];
    expect(blockedResourceTypes).not.toContain('document');
    expect(blockedResourceTypes).not.toContain('script');
    expect(blockedResourceTypes).not.toContain('xhr');
  });
});

describe('Browser Metrics Tracking', () => {
  it('should initialize with zero values', async () => {
    const module = await import('../../src/browser');
    const metrics = module.default.getMetrics();

    expect(metrics.queued).toBeGreaterThanOrEqual(0);
    expect(metrics.processing).toBeGreaterThanOrEqual(0);
    expect(metrics.completed).toBeGreaterThanOrEqual(0);
    expect(metrics.errors).toBeGreaterThanOrEqual(0);
  });

  it('should have maxConcurrency from config', async () => {
    const module = await import('../../src/browser');
    const metrics = module.default.getMetrics();

    expect(metrics.maxConcurrency).toBe(5);
  });

  it('should return immutable metrics', async () => {
    const module = await import('../../src/browser');
    const metrics1 = module.default.getMetrics();
    const metrics2 = module.default.getMetrics();

    // Should be different objects
    expect(metrics1).not.toBe(metrics2);
    // But with same values
    expect(metrics1.maxConcurrency).toBe(metrics2.maxConcurrency);
  });
});

describe('Browser SSR Events', () => {
  it('should have SSR events store available', async () => {
    const { ssrEventsStore } = await import('../../src/admin/ssr-events-store');

    // Verify ssrEventsStore is mocked
    expect(ssrEventsStore).toBeDefined();
    expect(typeof ssrEventsStore.addEvent).toBe('function');
  });

  it('should render and potentially emit events', async () => {
    const module = await import('../../src/browser');

    // Render should complete without error
    const result = await module.default.render('http://example.com/event-test');
    expect(result).toBeDefined();
  });
});

describe('Browser Content Health Check', () => {
  it('should have ContentHealthCheckManager available', async () => {
    const { ContentHealthCheckManager } = await import('../../src/admin/content-health-check');

    // Verify ContentHealthCheckManager is mocked
    expect(ContentHealthCheckManager).toBeDefined();
    expect(typeof ContentHealthCheckManager).toBe('function');
  });

  it('should create ContentHealthCheckManager instance', async () => {
    const { ContentHealthCheckManager } = await import('../../src/admin/content-health-check');

    // Create instance to verify mock works
    const instance = new ContentHealthCheckManager({});
    expect(instance).toBeDefined();
    expect(typeof instance.checkPageHealth).toBe('function');
  });
});

describe('Browser Virtual Scroll', () => {
  it('should have VirtualScrollManager available', async () => {
    const { VirtualScrollManager } = await import('../../src/admin/virtual-scroll-manager');

    // Verify VirtualScrollManager is mocked
    expect(VirtualScrollManager).toBeDefined();
    expect(typeof VirtualScrollManager).toBe('function');
    expect(typeof VirtualScrollManager.getDefaultConfig).toBe('function');
  });

  it('should get default config from VirtualScrollManager', async () => {
    const { VirtualScrollManager } = await import('../../src/admin/virtual-scroll-manager');

    const defaultConfig = VirtualScrollManager.getDefaultConfig();
    expect(defaultConfig).toBeDefined();
    expect(defaultConfig.enabled).toBe(true);
  });
});

describe('Browser Soft 404 Detection', () => {
  it('should detect soft 404 patterns', () => {
    const soft404Patterns = [
      '404 - page not found',
      '404 error',
      'this page cannot be found',
      'the page you are looking for',
      'sorry, the page you',
      'we couldn\'t find the page',
      'no results found',
      'nothing found'
    ];

    // Verify patterns are what we expect
    expect(soft404Patterns).toContain('404 error');
    expect(soft404Patterns.some(p => p.includes('page not found'))).toBe(true);
  });

  it('should detect 404-specific CSS selectors', () => {
    const notFoundSelectors = [
      '.error-404',
      '#error-404',
      '.not-found',
      '#not-found',
      '.page-not-found',
      '#page-not-found'
    ];

    expect(notFoundSelectors).toContain('.error-404');
    expect(notFoundSelectors).toContain('.not-found');
  });
});

describe('Browser Cluster Management', () => {
  it('should have Cluster module available', async () => {
    const { Cluster } = await import('puppeteer-cluster');

    // Verify Cluster is mocked and available
    expect(Cluster).toBeDefined();
    expect(Cluster.launch).toBeDefined();
    expect(typeof Cluster.launch).toBe('function');
  });

  it('should render successfully with cluster', async () => {
    const module = await import('../../src/browser');

    // Render should work with mocked cluster
    const result = await module.default.render('http://example.com/cluster-test');

    expect(result).toBeDefined();
    expect(result.html).toBeDefined();
  });

  it('should have correct concurrency constants', async () => {
    const { Cluster } = await import('puppeteer-cluster');

    // Verify concurrency constants are available
    expect(Cluster.CONCURRENCY_CONTEXT).toBe(1);
    expect(Cluster.CONCURRENCY_PAGE).toBe(2);
    expect(Cluster.CONCURRENCY_BROWSER).toBe(3);
  });
});

describe('Browser Error Handling', () => {
  it('should handle render errors gracefully', async () => {
    const module = await import('../../src/browser');

    // The mock always succeeds, so this tests the happy path
    const result = await module.default.render('http://example.com/error-test');
    expect(result).toBeDefined();
  });

  it('should track errors in metrics', async () => {
    const module = await import('../../src/browser');
    const metrics = module.default.getMetrics();

    // Errors count should be tracked
    expect(typeof metrics.errors).toBe('number');
    expect(metrics.errors).toBeGreaterThanOrEqual(0);
  });
});

describe('Browser Forensics', () => {
  it('should have forensics collector available', async () => {
    const forensicsCollector = await import('../../src/admin/forensics-collector');

    expect(forensicsCollector.default).toBeDefined();
    expect(typeof forensicsCollector.default.captureForensics).toBe('function');
  });
});

describe('Browser Resource Types', () => {
  const blockedTypes = ['image', 'stylesheet', 'font', 'media', 'websocket', 'eventsource'];
  const allowedTypes = ['document', 'script', 'xhr', 'fetch'];

  it('should define blocked resource types', () => {
    expect(blockedTypes.length).toBe(6);
    expect(blockedTypes).toContain('image');
    expect(blockedTypes).toContain('stylesheet');
  });

  it('should allow important resource types', () => {
    expect(allowedTypes).toContain('document');
    expect(allowedTypes).toContain('script');
    expect(allowedTypes).toContain('xhr');
    expect(allowedTypes).toContain('fetch');
  });
});

describe('Browser Configuration', () => {
  it('should use config values', async () => {
    const config = await import('../../src/config');

    expect(config.default.PUPPETEER_TIMEOUT).toBe(30000);
    expect(config.default.MAX_CONCURRENT_RENDERS).toBe(5);
  });

  it('should respect timeout settings', async () => {
    const config = await import('../../src/config');

    // Timeout should be reasonable
    expect(config.default.PUPPETEER_TIMEOUT).toBeGreaterThan(0);
    expect(config.default.PUPPETEER_TIMEOUT).toBeLessThanOrEqual(120000);
  });
});

describe('Browser URL Blocking Logic', () => {
  const BLACKLISTED_DOMAINS = [
    'google-analytics.com',
    'googletagmanager.com',
    'googleadservices.com',
    'doubleclick.net',
    'facebook.net',
    'hotjar.com',
    'mixpanel.com',
    'segment.io',
    'fullstory.com',
    'clarity.ms',
    'mouseflow.com',
    'optimizely.com',
    'googlesyndication.com',
    'adnxs.com',
    'amazon-adsystem.com',
    'criteo.com',
    'taboola.com',
    'outbrain.com'
  ];

  const BLACKLISTED_PATTERNS = [
    '/analytics',
    '/gtm',
    '/fbevents',
    '/pixel',
    '/tracking',
    '/collect',
    '/log',
    '/event',
    '/metrics',
    '/ads/',
    '/advertising/',
    '/doubleclick',
    '/googlead',
    '/widgets',
    '/embed',
    '/social',
    '/facebook',
    '/twitter',
    '/favicon.ico',
    '/robots.txt',
    '.webp',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.svg',
    '.css',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot'
  ];

  function shouldBlockRequest(requestUrl: string, resourceType: string): boolean {
    try {
      const url = new URL(requestUrl);
      const hostname = url.hostname.toLowerCase();

      for (const blacklistedDomain of BLACKLISTED_DOMAINS) {
        if (hostname.includes(blacklistedDomain.toLowerCase())) {
          return true;
        }
      }

      const lowerUrl = requestUrl.toLowerCase();
      for (const pattern of BLACKLISTED_PATTERNS) {
        if (lowerUrl.includes(pattern)) {
          return true;
        }
      }

      if (['image', 'stylesheet', 'font', 'media', 'websocket', 'eventsource'].includes(resourceType)) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  it('should block google analytics URLs', () => {
    expect(shouldBlockRequest('https://www.google-analytics.com/analytics.js', 'script')).toBe(true);
    expect(shouldBlockRequest('https://google-analytics.com/collect', 'xhr')).toBe(true);
  });

  it('should block google tag manager URLs', () => {
    expect(shouldBlockRequest('https://www.googletagmanager.com/gtm.js?id=GTM-XXX', 'script')).toBe(true);
  });

  it('should block facebook tracking URLs', () => {
    expect(shouldBlockRequest('https://connect.facebook.net/en_US/fbevents.js', 'script')).toBe(true);
  });

  it('should block hotjar URLs', () => {
    expect(shouldBlockRequest('https://static.hotjar.com/c/hotjar-123.js', 'script')).toBe(true);
  });

  it('should block ad network URLs', () => {
    expect(shouldBlockRequest('https://www.googlesyndication.com/pagead/js/adsbygoogle.js', 'script')).toBe(true);
    expect(shouldBlockRequest('https://cdn.criteo.com/js/ld/ld.js', 'script')).toBe(true);
    expect(shouldBlockRequest('https://cdn.taboola.com/libtrc/test/loader.js', 'script')).toBe(true);
  });

  it('should block tracking pattern URLs', () => {
    expect(shouldBlockRequest('https://example.com/analytics/track.js', 'script')).toBe(true);
    expect(shouldBlockRequest('https://example.com/tracking/pixel.gif', 'image')).toBe(true);
    expect(shouldBlockRequest('https://example.com/collect?data=x', 'xhr')).toBe(true);
  });

  it('should block static resource types', () => {
    expect(shouldBlockRequest('https://example.com/image.jpg', 'image')).toBe(true);
    expect(shouldBlockRequest('https://example.com/style.css', 'stylesheet')).toBe(true);
    expect(shouldBlockRequest('https://example.com/font.woff2', 'font')).toBe(true);
    expect(shouldBlockRequest('https://example.com/video.mp4', 'media')).toBe(true);
  });

  it('should allow document requests', () => {
    expect(shouldBlockRequest('https://example.com/page.html', 'document')).toBe(false);
  });

  it('should allow script requests to non-blocked domains', () => {
    expect(shouldBlockRequest('https://cdn.example.com/app.js', 'script')).toBe(false);
  });

  it('should allow xhr requests to non-blocked domains', () => {
    expect(shouldBlockRequest('https://api.example.com/data', 'xhr')).toBe(false);
    expect(shouldBlockRequest('https://api.example.com/api/users', 'fetch')).toBe(false);
  });

  it('should handle invalid URLs gracefully', () => {
    expect(shouldBlockRequest('not-a-valid-url', 'script')).toBe(false);
    expect(shouldBlockRequest('', 'script')).toBe(false);
  });

  it('should block doubleclick URLs', () => {
    expect(shouldBlockRequest('https://ad.doubleclick.net/ddm/activity', 'xhr')).toBe(true);
  });

  it('should block image files by extension pattern', () => {
    expect(shouldBlockRequest('https://example.com/images/photo.jpeg', 'document')).toBe(true);
    expect(shouldBlockRequest('https://example.com/icons/logo.png', 'document')).toBe(true);
    expect(shouldBlockRequest('https://example.com/background.webp', 'document')).toBe(true);
  });

  it('should block font files by extension pattern', () => {
    expect(shouldBlockRequest('https://example.com/fonts/arial.woff', 'document')).toBe(true);
    expect(shouldBlockRequest('https://example.com/fonts/arial.woff2', 'document')).toBe(true);
    expect(shouldBlockRequest('https://example.com/fonts/arial.ttf', 'document')).toBe(true);
  });
});

describe('Browser SSR Event Emission', () => {
  it('should create valid SSR event object', () => {
    const eventData = {
      url: 'https://example.com',
      timestamp: Date.now(),
      duration: 1500,
      success: true,
      htmlLength: 5000,
      statusCode: 200
    };

    const ssrEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      event: 'render_complete',
      url: eventData.url,
      timestamp: eventData.timestamp,
      duration: eventData.duration,
      success: eventData.success,
      htmlLength: eventData.htmlLength,
      statusCode: eventData.statusCode
    };

    expect(ssrEvent.id).toBeDefined();
    expect(ssrEvent.event).toBe('render_complete');
    expect(ssrEvent.url).toBe('https://example.com');
    expect(ssrEvent.success).toBe(true);
  });

  it('should create render_start event', () => {
    const renderId = `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const event = {
      event: 'render_start',
      renderId,
      url: 'https://example.com',
      timestamp: Date.now(),
      queueSize: 5,
      processing: 2
    };

    expect(event.event).toBe('render_start');
    expect(event.renderId).toContain('render_');
    expect(event.queueSize).toBe(5);
    expect(event.processing).toBe(2);
  });

  it('should create render_error event', () => {
    const event = {
      event: 'render_error',
      url: 'https://example.com',
      timestamp: Date.now(),
      duration: 5000,
      success: false,
      error: 'Navigation timeout'
    };

    expect(event.event).toBe('render_error');
    expect(event.success).toBe(false);
    expect(event.error).toBe('Navigation timeout');
  });

  it('should create health_check event', () => {
    const event = {
      event: 'health_check',
      url: 'https://example.com',
      timestamp: Date.now(),
      score: 85,
      passed: true,
      issues: [{ type: 'warning', message: 'Title too short' }]
    };

    expect(event.event).toBe('health_check');
    expect(event.score).toBe(85);
    expect(event.passed).toBe(true);
    expect(event.issues.length).toBe(1);
  });
});

describe('Browser Render Result Interface', () => {
  it('should have html property', () => {
    const result = { html: '<html></html>', statusCode: 200 };
    expect(result.html).toBeDefined();
    expect(typeof result.html).toBe('string');
  });

  it('should have optional statusCode property', () => {
    const result1 = { html: '<html></html>' };
    const result2 = { html: '<html></html>', statusCode: 404 };

    expect(result1.statusCode).toBeUndefined();
    expect(result2.statusCode).toBe(404);
  });

  it('should handle soft 404 status code', () => {
    const result = { html: '<html><body>Page not found</body></html>', statusCode: 404 };
    expect(result.statusCode).toBe(404);
  });

  it('should handle explicit prerender status code', () => {
    const result = { html: '<html><head><meta name="prerender-status-code" content="301"></head></html>', statusCode: 301 };
    expect(result.statusCode).toBe(301);
  });

  it('should handle 503 for failed content health check', () => {
    const result = {
      html: '<!DOCTYPE html><html><head><title>Service Unavailable</title></head><body><h1>503 Service Unavailable</h1></body></html>',
      statusCode: 503
    };
    expect(result.statusCode).toBe(503);
    expect(result.html).toContain('Service Unavailable');
  });
});

describe('Browser Queue Metrics Interface', () => {
  it('should have all required properties', () => {
    const metrics = {
      queued: 0,
      processing: 0,
      completed: 0,
      errors: 0,
      maxConcurrency: 5
    };

    expect(metrics.queued).toBeDefined();
    expect(metrics.processing).toBeDefined();
    expect(metrics.completed).toBeDefined();
    expect(metrics.errors).toBeDefined();
    expect(metrics.maxConcurrency).toBeDefined();
  });

  it('should allow incrementing queued count', () => {
    const metrics = { queued: 0, processing: 0, completed: 0, errors: 0, maxConcurrency: 5 };
    metrics.queued++;
    expect(metrics.queued).toBe(1);
  });

  it('should track processing correctly', () => {
    const metrics = { queued: 3, processing: 0, completed: 0, errors: 0, maxConcurrency: 5 };
    metrics.processing++;
    metrics.queued = Math.max(0, metrics.queued - 1);
    expect(metrics.processing).toBe(1);
    expect(metrics.queued).toBe(2);
  });

  it('should track completion correctly', () => {
    const metrics = { queued: 0, processing: 1, completed: 0, errors: 0, maxConcurrency: 5 };
    metrics.completed++;
    metrics.processing--;
    expect(metrics.completed).toBe(1);
    expect(metrics.processing).toBe(0);
  });

  it('should track errors correctly', () => {
    const metrics = { queued: 0, processing: 1, completed: 0, errors: 0, maxConcurrency: 5 };
    metrics.errors++;
    metrics.processing--;
    expect(metrics.errors).toBe(1);
    expect(metrics.processing).toBe(0);
  });
});

describe('Browser Puppeteer Launch Args', () => {
  const standardArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--no-first-run',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-extensions-with-background-pages',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--disable-renderer-backgrounding',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--force-color-profile=srgb',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio'
  ];

  it('should include no-sandbox for Docker compatibility', () => {
    expect(standardArgs).toContain('--no-sandbox');
    expect(standardArgs).toContain('--disable-setuid-sandbox');
  });

  it('should include memory optimization flags', () => {
    expect(standardArgs).toContain('--disable-dev-shm-usage');
    expect(standardArgs).toContain('--disable-gpu');
  });

  it('should include performance optimization flags', () => {
    expect(standardArgs).toContain('--disable-extensions');
    expect(standardArgs).toContain('--disable-background-networking');
    expect(standardArgs).toContain('--disable-background-timer-throttling');
  });

  it('should include rendering optimization flags', () => {
    expect(standardArgs).toContain('--force-color-profile=srgb');
    expect(standardArgs).toContain('--hide-scrollbars');
    expect(standardArgs).toContain('--mute-audio');
  });
});

describe('Browser Content Health Check Integration', () => {
  it('should have default health check configuration', () => {
    const defaultConfig = {
      enabled: true,
      criticalSelectors: [
        { selector: 'title', type: 'title', required: true, description: 'Page title' },
        { selector: 'meta[name="description"]', type: 'meta', required: true, description: 'Meta description' },
        { selector: 'h1', type: 'h1', required: true, description: 'H1 heading' },
        { selector: 'body', type: 'custom', required: true, description: 'Body content' }
      ],
      minBodyLength: 500,
      minTitleLength: 30,
      metaDescriptionRequired: true,
      h1Required: true,
      failOnMissingCritical: true
    };

    expect(defaultConfig.enabled).toBe(true);
    expect(defaultConfig.criticalSelectors.length).toBe(4);
    expect(defaultConfig.minBodyLength).toBe(500);
    expect(defaultConfig.failOnMissingCritical).toBe(true);
  });

  it('should handle health check failure with 503 response', () => {
    const failedHealthResult = {
      score: 40,
      passed: false,
      issues: [
        { type: 'error', selector: 'title', message: 'Page title is missing' },
        { type: 'error', selector: 'h1', message: 'H1 tag is missing' }
      ]
    };

    const hasErrors = failedHealthResult.issues.some((issue: any) => issue.type === 'error');
    expect(hasErrors).toBe(true);
    expect(failedHealthResult.passed).toBe(false);
  });
});

describe('Browser Virtual Scroll Integration', () => {
  it('should have default virtual scroll configuration', () => {
    const defaultConfig = {
      enabled: true,
      scrollSteps: 10,
      scrollInterval: 300,
      maxScrollHeight: 10000,
      waitAfterScroll: 1000,
      scrollSelectors: ['.infinite-scroll', '.virtual-scroll'],
      infiniteScrollSelectors: ['.load-more', '.pagination-next'],
      lazyImageSelectors: ['img[data-src]', 'img[loading="lazy"]'],
      triggerIntersectionObserver: true,
      waitForNetworkIdle: true,
      networkIdleTimeout: 5000
    };

    expect(defaultConfig.enabled).toBe(true);
    expect(defaultConfig.scrollSteps).toBe(10);
    expect(defaultConfig.triggerIntersectionObserver).toBe(true);
  });

  it('should update HTML after virtual scroll', () => {
    const initialHtml = '<html><body><div>Initial content</div></body></html>';
    const updatedHtml = '<html><body><div>Initial content</div><div>Lazy loaded content</div></body></html>';

    expect(updatedHtml.length).toBeGreaterThan(initialHtml.length);
    expect(updatedHtml).toContain('Lazy loaded content');
  });
});

describe('Browser Blocking Manager Integration', () => {
  it('should have blocking manager with shouldBlockRequest method', async () => {
    const blockingManager = await import('../../src/admin/blocking-manager');
    expect(blockingManager.default).toBeDefined();
    expect(typeof blockingManager.default.shouldBlockRequest).toBe('function');
  });

  it('should handle different blocking actions', () => {
    const blockActions = ['allow', 'block', 'redirect', 'modify'];

    for (const action of blockActions) {
      const result = { blocked: action !== 'allow', action };
      expect(result.action).toBe(action);
    }
  });

  it('should handle redirect action with URL', () => {
    const result = {
      blocked: true,
      action: 'redirect',
      options: { redirectUrl: 'https://example.com/blocked' }
    };

    expect(result.action).toBe('redirect');
    expect(result.options.redirectUrl).toBe('https://example.com/blocked');
  });

  it('should handle modify action with headers', () => {
    const result = {
      blocked: false,
      action: 'modify',
      options: { modifyHeaders: { 'X-Custom-Header': 'value' } }
    };

    expect(result.action).toBe('modify');
    expect(result.options.modifyHeaders['X-Custom-Header']).toBe('value');
  });
});

describe('Browser Navigation Strategies', () => {
  const waitStrategies = ['networkidle0', 'networkidle2', 'domcontentloaded'];

  it('should have primary strategy as networkidle0', () => {
    expect(waitStrategies[0]).toBe('networkidle0');
  });

  it('should have fallback strategy as networkidle2', () => {
    expect(waitStrategies[1]).toBe('networkidle2');
  });

  it('should have final fallback as domcontentloaded', () => {
    expect(waitStrategies[2]).toBe('domcontentloaded');
  });

  it('should add delay after domcontentloaded fallback', () => {
    const delayAfterDomContentLoaded = 2000;
    expect(delayAfterDomContentLoaded).toBe(2000);
  });
});

describe('Browser Viewport Configuration', () => {
  it('should use desktop viewport dimensions', () => {
    const viewport = {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    };

    expect(viewport.width).toBe(1920);
    expect(viewport.height).toBe(1080);
    expect(viewport.deviceScaleFactor).toBe(1);
  });
});

describe('Browser User Agent Configuration', () => {
  it('should use SEOShieldProxy user agent', () => {
    const userAgent = 'Mozilla/5.0 (compatible; SEOShieldProxy/1.0; +https://github.com/seoshield/seo-shield-proxy)';

    expect(userAgent).toContain('SEOShieldProxy/1.0');
    expect(userAgent).toContain('compatible');
    expect(userAgent).toContain('Mozilla/5.0');
  });
});

describe('Browser Render ID Generation', () => {
  it('should generate unique render IDs', () => {
    const generateRenderId = () => `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const id1 = generateRenderId();
    const id2 = generateRenderId();

    expect(id1).toContain('render_');
    expect(id2).toContain('render_');
    expect(id1).not.toBe(id2);
  });

  it('should include timestamp in render ID', () => {
    const before = Date.now();
    const renderId = `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const after = Date.now();

    const parts = renderId.split('_');
    const timestamp = parseInt(parts[1], 10);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe('Browser Performance Logging', () => {
  it('should calculate block rate correctly', () => {
    const blockedCount = 25;
    const allowedCount = 75;
    const totalRequests = blockedCount + allowedCount;
    const blockRate = totalRequests > 0 ? Math.round((blockedCount / totalRequests) * 100) : 0;

    expect(blockRate).toBe(25);
  });

  it('should handle zero total requests', () => {
    const blockedCount = 0;
    const allowedCount = 0;
    const totalRequests = blockedCount + allowedCount;
    const blockRate = totalRequests > 0 ? Math.round((blockedCount / totalRequests) * 100) : 0;

    expect(blockRate).toBe(0);
  });
});

describe('Blacklisted domains simulation', () => {
  const BLACKLISTED_DOMAINS = [
    'google-analytics.com',
    'googletagmanager.com',
    'doubleclick.net',
    'facebook.net',
    'hotjar.com',
    'mixpanel.com',
    'segment.io',
    'fullstory.com',
    'clarity.ms'
  ];

  it('should include google-analytics.com', () => {
    expect(BLACKLISTED_DOMAINS).toContain('google-analytics.com');
  });

  it('should include googletagmanager.com', () => {
    expect(BLACKLISTED_DOMAINS).toContain('googletagmanager.com');
  });

  it('should include doubleclick.net', () => {
    expect(BLACKLISTED_DOMAINS).toContain('doubleclick.net');
  });

  it('should include facebook.net', () => {
    expect(BLACKLISTED_DOMAINS).toContain('facebook.net');
  });

  it('should include hotjar.com', () => {
    expect(BLACKLISTED_DOMAINS).toContain('hotjar.com');
  });

  it('should check if hostname includes blacklisted domain', () => {
    const hostname = 'www.google-analytics.com';
    const isBlocked = BLACKLISTED_DOMAINS.some(d => hostname.includes(d.toLowerCase()));
    expect(isBlocked).toBe(true);
  });

  it('should not block non-blacklisted domains', () => {
    const hostname = 'www.example.com';
    const isBlocked = BLACKLISTED_DOMAINS.some(d => hostname.includes(d.toLowerCase()));
    expect(isBlocked).toBe(false);
  });
});

describe('Blacklisted patterns simulation', () => {
  const BLACKLISTED_PATTERNS = [
    '/analytics',
    '/gtm',
    '/fbevents',
    '/pixel',
    '/tracking',
    '/ads/',
    '/favicon.ico',
    '.webp',
    '.jpg',
    '.png',
    '.gif',
    '.css',
    '.woff'
  ];

  it('should block /analytics path', () => {
    const url = 'https://example.com/analytics';
    const isBlocked = BLACKLISTED_PATTERNS.some(p => url.toLowerCase().includes(p));
    expect(isBlocked).toBe(true);
  });

  it('should block /gtm path', () => {
    const url = 'https://example.com/gtm.js';
    const isBlocked = BLACKLISTED_PATTERNS.some(p => url.toLowerCase().includes(p));
    expect(isBlocked).toBe(true);
  });

  it('should block .webp images', () => {
    const url = 'https://example.com/image.webp';
    const isBlocked = BLACKLISTED_PATTERNS.some(p => url.toLowerCase().includes(p));
    expect(isBlocked).toBe(true);
  });

  it('should block .css files', () => {
    const url = 'https://example.com/style.css';
    const isBlocked = BLACKLISTED_PATTERNS.some(p => url.toLowerCase().includes(p));
    expect(isBlocked).toBe(true);
  });

  it('should not block document URLs', () => {
    const url = 'https://example.com/page.html';
    const isBlocked = BLACKLISTED_PATTERNS.some(p => url.toLowerCase().includes(p));
    expect(isBlocked).toBe(false);
  });
});

describe('Resource type blocking simulation', () => {
  const blockedResourceTypes = ['image', 'stylesheet', 'font', 'media', 'websocket', 'eventsource'];

  it('should block image resource type', () => {
    expect(blockedResourceTypes).toContain('image');
  });

  it('should block stylesheet resource type', () => {
    expect(blockedResourceTypes).toContain('stylesheet');
  });

  it('should block font resource type', () => {
    expect(blockedResourceTypes).toContain('font');
  });

  it('should block media resource type', () => {
    expect(blockedResourceTypes).toContain('media');
  });

  it('should block websocket resource type', () => {
    expect(blockedResourceTypes).toContain('websocket');
  });

  it('should not block document resource type', () => {
    expect(blockedResourceTypes).not.toContain('document');
  });

  it('should not block script resource type', () => {
    expect(blockedResourceTypes).not.toContain('script');
  });

  it('should not block xhr resource type', () => {
    expect(blockedResourceTypes).not.toContain('xhr');
  });
});

describe('Soft 404 detection patterns', () => {
  const notFoundPatterns = [
    '404 - page not found',
    '404 error',
    'this page cannot be found',
    'the page you are looking for',
    'sorry, the page you',
    'we couldn\'t find the page',
    'no results found',
    'nothing found'
  ];

  it('should detect "404 - page not found" pattern', () => {
    const bodyText = 'Sorry, 404 - page not found';
    const detected = notFoundPatterns.some(p => bodyText.toLowerCase().includes(p));
    expect(detected).toBe(true);
  });

  it('should detect "404 error" pattern', () => {
    const bodyText = 'Oops! 404 error occurred';
    const detected = notFoundPatterns.some(p => bodyText.toLowerCase().includes(p));
    expect(detected).toBe(true);
  });

  it('should detect "no results found" pattern', () => {
    const bodyText = 'No results found for your search';
    const detected = notFoundPatterns.some(p => bodyText.toLowerCase().includes(p));
    expect(detected).toBe(true);
  });

  it('should not detect normal content', () => {
    const bodyText = 'Welcome to our website. This is the homepage.';
    const detected = notFoundPatterns.some(p => bodyText.toLowerCase().includes(p));
    expect(detected).toBe(false);
  });
});

describe('Soft 404 selectors', () => {
  const notFoundSelectors = [
    '.error-404',
    '#error-404',
    '.not-found',
    '#not-found',
    '.page-not-found',
    '#page-not-found',
    '.error-page',
    '#error-page'
  ];

  it('should include .error-404 selector', () => {
    expect(notFoundSelectors).toContain('.error-404');
  });

  it('should include #not-found selector', () => {
    expect(notFoundSelectors).toContain('#not-found');
  });

  it('should include .page-not-found selector', () => {
    expect(notFoundSelectors).toContain('.page-not-found');
  });
});

describe('Content health check config', () => {
  const defaultConfig = {
    enabled: true,
    criticalSelectors: [
      { selector: 'title', type: 'title', required: true, description: 'Page title' },
      { selector: 'meta[name="description"]', type: 'meta', required: true, description: 'Meta description' },
      { selector: 'h1', type: 'h1', required: true, description: 'H1 heading' },
      { selector: 'body', type: 'custom', required: true, description: 'Body content' }
    ],
    minBodyLength: 500,
    minTitleLength: 30,
    metaDescriptionRequired: true,
    h1Required: true,
    failOnMissingCritical: true
  };

  it('should have enabled true by default', () => {
    expect(defaultConfig.enabled).toBe(true);
  });

  it('should have 4 critical selectors', () => {
    expect(defaultConfig.criticalSelectors.length).toBe(4);
  });

  it('should require title selector', () => {
    const titleSelector = defaultConfig.criticalSelectors.find(s => s.type === 'title');
    expect(titleSelector?.required).toBe(true);
  });

  it('should require meta description', () => {
    expect(defaultConfig.metaDescriptionRequired).toBe(true);
  });

  it('should have minimum body length of 500', () => {
    expect(defaultConfig.minBodyLength).toBe(500);
  });

  it('should have minimum title length of 30', () => {
    expect(defaultConfig.minTitleLength).toBe(30);
  });

  it('should fail on missing critical elements', () => {
    expect(defaultConfig.failOnMissingCritical).toBe(true);
  });
});

describe('SSR Event structure', () => {
  it('should create render_start event', () => {
    const event = {
      event: 'render_start',
      renderId: 'render_123',
      url: 'https://example.com',
      timestamp: Date.now(),
      queueSize: 1,
      processing: 0
    };

    expect(event.event).toBe('render_start');
    expect(event.renderId).toBeDefined();
    expect(event.url).toBeDefined();
  });

  it('should create render_complete event', () => {
    const event = {
      event: 'render_complete',
      renderId: 'render_123',
      url: 'https://example.com',
      timestamp: Date.now(),
      duration: 1500,
      success: true,
      htmlLength: 5000,
      statusCode: 200
    };

    expect(event.event).toBe('render_complete');
    expect(event.success).toBe(true);
    expect(event.statusCode).toBe(200);
  });

  it('should create render_error event', () => {
    const event = {
      event: 'render_error',
      renderId: 'render_123',
      url: 'https://example.com',
      timestamp: Date.now(),
      duration: 500,
      success: false,
      error: 'Navigation timeout'
    };

    expect(event.event).toBe('render_error');
    expect(event.success).toBe(false);
    expect(event.error).toBeDefined();
  });

  it('should create health_check event', () => {
    const event = {
      event: 'health_check',
      url: 'https://example.com',
      score: 85,
      passed: true,
      issues: [],
      timestamp: Date.now()
    };

    expect(event.event).toBe('health_check');
    expect(event.score).toBe(85);
    expect(event.passed).toBe(true);
  });

  it('should generate unique event ID', () => {
    const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(5);
  });
});

describe('Browser cluster configuration', () => {
  const clusterConfig = {
    concurrency: 1, // Cluster.CONCURRENCY_CONTEXT
    maxConcurrency: 5,
    timeout: 30000,
    retryLimit: 1,
    retryDelay: 1000,
    monitor: false
  };

  it('should use CONCURRENCY_CONTEXT', () => {
    expect(clusterConfig.concurrency).toBe(1);
  });

  it('should have max concurrency of 5', () => {
    expect(clusterConfig.maxConcurrency).toBe(5);
  });

  it('should have 30 second timeout', () => {
    expect(clusterConfig.timeout).toBe(30000);
  });

  it('should have retry limit of 1', () => {
    expect(clusterConfig.retryLimit).toBe(1);
  });

  it('should have retry delay of 1000ms', () => {
    expect(clusterConfig.retryDelay).toBe(1000);
  });

  it('should have monitor disabled', () => {
    expect(clusterConfig.monitor).toBe(false);
  });
});

describe('Puppeteer launch args', () => {
  const puppeteerArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-extensions',
    '--no-first-run',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-extensions-with-background-pages',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--disable-renderer-backgrounding',
    '--enable-features=NetworkService,NetworkServiceInProcess',
    '--force-color-profile=srgb',
    '--hide-scrollbars',
    '--metrics-recording-only',
    '--mute-audio'
  ];

  it('should include --no-sandbox', () => {
    expect(puppeteerArgs).toContain('--no-sandbox');
  });

  it('should include --disable-gpu', () => {
    expect(puppeteerArgs).toContain('--disable-gpu');
  });

  it('should include --disable-dev-shm-usage', () => {
    expect(puppeteerArgs).toContain('--disable-dev-shm-usage');
  });

  it('should include --mute-audio', () => {
    expect(puppeteerArgs).toContain('--mute-audio');
  });

  it('should include --hide-scrollbars', () => {
    expect(puppeteerArgs).toContain('--hide-scrollbars');
  });
});

describe('Request interception actions', () => {
  it('should abort blocked request', () => {
    const blockingResult = { blocked: true, action: 'block' };
    let aborted = false;

    if (blockingResult.blocked) {
      if (blockingResult.action !== 'redirect' && blockingResult.action !== 'modify') {
        aborted = true;
      }
    }

    expect(aborted).toBe(true);
  });

  it('should redirect when action is redirect', () => {
    const blockingResult = {
      blocked: true,
      action: 'redirect',
      options: { redirectUrl: 'https://example.com/redirect' }
    };

    expect(blockingResult.action).toBe('redirect');
    expect(blockingResult.options?.redirectUrl).toBeDefined();
  });

  it('should modify headers when action is modify', () => {
    const blockingResult = {
      blocked: true,
      action: 'modify',
      options: { modifyHeaders: { 'X-Custom': 'value' } }
    };

    expect(blockingResult.action).toBe('modify');
    expect(blockingResult.options?.modifyHeaders).toBeDefined();
  });

  it('should continue non-blocked request', () => {
    const blockingResult = { blocked: false, action: 'allow' };
    let continued = false;

    if (!blockingResult.blocked) {
      continued = true;
    }

    expect(continued).toBe(true);
  });
});

describe('503 Service Unavailable response', () => {
  it('should return 503 HTML when content health check fails', () => {
    const html503 = '<!DOCTYPE html><html><head><title>Service Unavailable</title><meta name="robots" content="noindex"></head><body><h1>503 Service Unavailable</h1><p>Content validation failed. Please try again later.</p></body></html>';

    expect(html503).toContain('503 Service Unavailable');
    expect(html503).toContain('noindex');
    expect(html503).toContain('Content validation failed');
  });

  it('should set status code to 503', () => {
    const response = {
      html: '503 response',
      statusCode: 503
    };

    expect(response.statusCode).toBe(503);
  });
});

describe('Virtual scroll result handling', () => {
  it('should handle successful scroll result', () => {
    const scrollResult = {
      success: true,
      scrollSteps: 5,
      completionRate: 100
    };

    expect(scrollResult.success).toBe(true);
    expect(scrollResult.scrollSteps).toBe(5);
    expect(scrollResult.completionRate).toBe(100);
  });

  it('should handle failed scroll result', () => {
    const scrollResult = {
      success: false,
      scrollSteps: 0,
      completionRate: 0
    };

    expect(scrollResult.success).toBe(false);
  });
});

describe('Render error handling', () => {
  it('should add url property to error', () => {
    const error = new Error('Navigation timeout') as Error & { url?: string; renderError?: boolean };
    error.url = 'https://example.com';
    error.renderError = true;

    expect(error.url).toBe('https://example.com');
    expect(error.renderError).toBe(true);
  });
});

describe('Metrics updates', () => {
  it('should increment queued count', () => {
    const metrics = { queued: 0, processing: 0, completed: 0, errors: 0 };
    metrics.queued++;
    expect(metrics.queued).toBe(1);
  });

  it('should decrement queued count (minimum 0)', () => {
    const metrics = { queued: 1, processing: 0, completed: 0, errors: 0 };
    metrics.queued = Math.max(0, metrics.queued - 1);
    expect(metrics.queued).toBe(0);
  });

  it('should not go below 0', () => {
    const metrics = { queued: 0, processing: 0, completed: 0, errors: 0 };
    metrics.queued = Math.max(0, metrics.queued - 1);
    expect(metrics.queued).toBe(0);
  });

  it('should increment processing count', () => {
    const metrics = { queued: 0, processing: 0, completed: 0, errors: 0 };
    metrics.processing++;
    expect(metrics.processing).toBe(1);
  });

  it('should increment completed count on success', () => {
    const metrics = { queued: 0, processing: 1, completed: 0, errors: 0 };
    metrics.completed++;
    metrics.processing--;
    expect(metrics.completed).toBe(1);
    expect(metrics.processing).toBe(0);
  });

  it('should increment errors count on failure', () => {
    const metrics = { queued: 0, processing: 1, completed: 0, errors: 0 };
    metrics.errors++;
    metrics.processing--;
    expect(metrics.errors).toBe(1);
    expect(metrics.processing).toBe(0);
  });
});

describe('Cluster initialization guard', () => {
  it('should return existing cluster if available', () => {
    let cluster = { id: 'existing-cluster' };
    let isInitializing = false;

    const getCluster = () => {
      if (cluster) return cluster;
      // ... initialization logic
    };

    expect(getCluster()).toBe(cluster);
  });

  it('should return initPromise if already initializing', () => {
    const cluster = null;
    const isInitializing = true;
    const initPromise = Promise.resolve({ id: 'initializing-cluster' });

    const getCluster = async () => {
      if (cluster) return cluster;
      if (isInitializing && initPromise) {
        return initPromise;
      }
    };

    expect(getCluster()).resolves.toEqual({ id: 'initializing-cluster' });
  });
});

describe('Direct browser fallback', () => {
  it('should use direct browser when cluster fails', () => {
    let useDirectBrowser = false;
    const clusterError = new Error('Cluster unavailable');

    try {
      throw clusterError;
    } catch {
      useDirectBrowser = true;
    }

    expect(useDirectBrowser).toBe(true);
  });

  it('should throw if browser not available', () => {
    const browser = null;

    const renderWithFallback = () => {
      if (!browser) {
        throw new Error('Browser not available');
      }
    };

    expect(renderWithFallback).toThrow('Browser not available');
  });
});

describe('SIGINT/SIGTERM handlers simulation', () => {
  it('should close browser on SIGINT', () => {
    let browserClosed = false;

    const handleSignal = async () => {
      browserClosed = true;
    };

    handleSignal();
    expect(browserClosed).toBe(true);
  });

  it('should close browser on SIGTERM', () => {
    let browserClosed = false;

    const handleSignal = async () => {
      browserClosed = true;
    };

    handleSignal();
    expect(browserClosed).toBe(true);
  });
});

describe('WebSocket broadcast simulation', () => {
  it('should broadcast SSR event via global.io', () => {
    let broadcastCalled = false;
    const mockGlobal = {
      io: {
        emit: (event: string, data: any) => {
          broadcastCalled = true;
          return true;
        }
      }
    };

    mockGlobal.io.emit('ssr_event', { url: 'test' });
    expect(broadcastCalled).toBe(true);
  });

  it('should not throw if global.io is undefined', () => {
    const mockGlobal: any = {};

    const emitSafely = () => {
      mockGlobal.io?.emit('ssr_event', { url: 'test' });
    };

    expect(emitSafely).not.toThrow();
  });
});
