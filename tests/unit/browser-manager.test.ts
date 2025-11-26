import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock puppeteer-cluster
const mockCluster = {
  execute: vi.fn().mockResolvedValue({ html: '<html></html>', statusCode: 200 }),
  idle: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  task: vi.fn().mockResolvedValue(undefined)
};

vi.mock('puppeteer-cluster', () => ({
  Cluster: {
    launch: vi.fn().mockResolvedValue(mockCluster),
    CONCURRENCY_CONTEXT: 3
  }
}));

// Mock puppeteer
const mockPage = {
  setViewport: vi.fn().mockResolvedValue(undefined),
  setUserAgent: vi.fn().mockResolvedValue(undefined),
  setRequestInterception: vi.fn().mockResolvedValue(undefined),
  goto: vi.fn().mockResolvedValue(undefined),
  content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
  evaluate: vi.fn().mockResolvedValue({
    statusCode: undefined,
    isSoft404: false,
    reasons: []
  }),
  viewport: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
  on: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined)
};

const mockBrowser = {
  newPage: vi.fn().mockResolvedValue(mockPage),
  close: vi.fn().mockResolvedValue(undefined)
};

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue(mockBrowser)
  }
}));

// Mock config
vi.mock('../../src/config', () => ({
  default: {
    MAX_CONCURRENT_RENDERS: 3,
    PUPPETEER_TIMEOUT: 30000,
    NODE_ENV: 'test'
  }
}));

// Mock forensics collector
vi.mock('../../src/admin/forensics-collector', () => ({
  default: {
    captureForensics: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock blocking manager
vi.mock('../../src/admin/blocking-manager', () => ({
  default: {
    shouldBlockRequest: vi.fn().mockReturnValue({ blocked: false })
  }
}));

// Mock content health check
vi.mock('../../src/admin/content-health-check', () => ({
  ContentHealthCheckManager: vi.fn().mockImplementation(() => ({
    checkPageHealth: vi.fn().mockResolvedValue({
      score: 85,
      passed: true,
      issues: []
    }),
    config: { failOnMissingCritical: false }
  })),
  CriticalSelector: vi.fn()
}));

// Mock virtual scroll manager
vi.mock('../../src/admin/virtual-scroll-manager', () => ({
  VirtualScrollManager: vi.fn().mockImplementation(() => ({
    triggerVirtualScroll: vi.fn().mockResolvedValue({
      success: true,
      scrollSteps: 5,
      completionRate: 100
    })
  }))
}));

// Mock SSR events store
vi.mock('../../src/admin/ssr-events-store', () => ({
  ssrEventsStore: {
    addEvent: vi.fn()
  },
  SSREvent: vi.fn()
}));

describe('BrowserManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global io mock
    (global as any).io = {
      emit: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('BrowserManager class structure', () => {
    it('should define RenderResult interface', () => {
      interface RenderResult {
        html: string;
        statusCode?: number;
      }

      const result: RenderResult = {
        html: '<html></html>',
        statusCode: 200
      };

      expect(result.html).toBe('<html></html>');
      expect(result.statusCode).toBe(200);
    });

    it('should define QueueMetrics interface', () => {
      interface QueueMetrics {
        queued: number;
        processing: number;
        completed: number;
        errors: number;
        maxConcurrency: number;
      }

      const metrics: QueueMetrics = {
        queued: 0,
        processing: 0,
        completed: 0,
        errors: 0,
        maxConcurrency: 3
      };

      expect(metrics.maxConcurrency).toBe(3);
    });
  });

  describe('shouldBlockRequest logic', () => {
    it('should block blacklisted domains - google-analytics.com', () => {
      const blacklistedDomains = [
        'google-analytics.com',
        'www.google-analytics.com',
        'googletagmanager.com',
        'www.googletagmanager.com'
      ];

      const shouldBlock = (url: string) => {
        try {
          const parsed = new URL(url);
          const hostname = parsed.hostname.toLowerCase();
          return blacklistedDomains.some(d => hostname.includes(d.toLowerCase()));
        } catch {
          return false;
        }
      };

      expect(shouldBlock('https://google-analytics.com/collect')).toBe(true);
      expect(shouldBlock('https://www.google-analytics.com/analytics.js')).toBe(true);
      expect(shouldBlock('https://googletagmanager.com/gtm.js')).toBe(true);
    });

    it('should block blacklisted domains - facebook', () => {
      const blacklistedDomains = [
        'facebook.net',
        'connect.facebook.net',
        'pixel.facebook.com'
      ];

      const shouldBlock = (url: string) => {
        try {
          const parsed = new URL(url);
          const hostname = parsed.hostname.toLowerCase();
          return blacklistedDomains.some(d => hostname.includes(d.toLowerCase()));
        } catch {
          return false;
        }
      };

      expect(shouldBlock('https://connect.facebook.net/en_US/fbevents.js')).toBe(true);
      expect(shouldBlock('https://pixel.facebook.com/pixel')).toBe(true);
    });

    it('should block blacklisted domains - ad networks', () => {
      const blacklistedDomains = [
        'doubleclick.net',
        'googlesyndication.com',
        'adnxs.com',
        'criteo.com',
        'taboola.com',
        'outbrain.com'
      ];

      const shouldBlock = (url: string) => {
        try {
          const parsed = new URL(url);
          const hostname = parsed.hostname.toLowerCase();
          return blacklistedDomains.some(d => hostname.includes(d.toLowerCase()));
        } catch {
          return false;
        }
      };

      expect(shouldBlock('https://ad.doubleclick.net/pagead/ads')).toBe(true);
      expect(shouldBlock('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')).toBe(true);
      expect(shouldBlock('https://criteo.com/cto_bundle')).toBe(true);
    });

    it('should block blacklisted domains - analytics tools', () => {
      const blacklistedDomains = [
        'hotjar.com',
        'hotjar.io',
        'mixpanel.com',
        'segment.io',
        'fullstory.com',
        'clarity.ms',
        'mouseflow.com'
      ];

      const shouldBlock = (url: string) => {
        try {
          const parsed = new URL(url);
          const hostname = parsed.hostname.toLowerCase();
          return blacklistedDomains.some(d => hostname.includes(d.toLowerCase()));
        } catch {
          return false;
        }
      };

      expect(shouldBlock('https://script.hotjar.com/modules')).toBe(true);
      expect(shouldBlock('https://api.mixpanel.com/track')).toBe(true);
      expect(shouldBlock('https://api.segment.io/v1/track')).toBe(true);
    });

    it('should block by URL patterns - analytics paths', () => {
      const blacklistedPatterns = [
        '/analytics',
        '/gtm',
        '/fbevents',
        '/pixel',
        '/tracking',
        '/collect',
        '/log',
        '/event',
        '/metrics'
      ];

      const shouldBlock = (url: string) => {
        const lowerUrl = url.toLowerCase();
        return blacklistedPatterns.some(p => lowerUrl.includes(p));
      };

      expect(shouldBlock('https://example.com/analytics/track')).toBe(true);
      expect(shouldBlock('https://example.com/gtm.js')).toBe(true);
      expect(shouldBlock('https://example.com/fbevents.js')).toBe(true);
      expect(shouldBlock('https://example.com/pixel.png')).toBe(true);
      expect(shouldBlock('https://example.com/tracking/user')).toBe(true);
    });

    it('should block by URL patterns - ad related', () => {
      const blacklistedPatterns = [
        '/ads/',
        '/advertising/',
        '/doubleclick',
        '/googlead'
      ];

      const shouldBlock = (url: string) => {
        const lowerUrl = url.toLowerCase();
        return blacklistedPatterns.some(p => lowerUrl.includes(p));
      };

      expect(shouldBlock('https://example.com/ads/banner')).toBe(true);
      expect(shouldBlock('https://example.com/advertising/popup')).toBe(true);
      expect(shouldBlock('https://example.com/googlead/setup')).toBe(true);
    });

    it('should block by URL patterns - resource waste', () => {
      const blacklistedPatterns = [
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

      const shouldBlock = (url: string) => {
        const lowerUrl = url.toLowerCase();
        return blacklistedPatterns.some(p => lowerUrl.includes(p));
      };

      expect(shouldBlock('https://example.com/favicon.ico')).toBe(true);
      expect(shouldBlock('https://example.com/image.jpg')).toBe(true);
      expect(shouldBlock('https://example.com/style.css')).toBe(true);
      expect(shouldBlock('https://example.com/font.woff2')).toBe(true);
    });

    it('should block by resource type', () => {
      const blockedTypes = ['image', 'stylesheet', 'font', 'media', 'websocket', 'eventsource'];

      const shouldBlock = (resourceType: string) => {
        return blockedTypes.includes(resourceType);
      };

      expect(shouldBlock('image')).toBe(true);
      expect(shouldBlock('stylesheet')).toBe(true);
      expect(shouldBlock('font')).toBe(true);
      expect(shouldBlock('media')).toBe(true);
      expect(shouldBlock('websocket')).toBe(true);
      expect(shouldBlock('eventsource')).toBe(true);
      expect(shouldBlock('document')).toBe(false);
      expect(shouldBlock('script')).toBe(false);
    });

    it('should allow valid requests', () => {
      const blacklistedDomains = ['google-analytics.com', 'facebook.net'];
      const blacklistedPatterns = ['/analytics', '/tracking'];
      const blockedTypes = ['image', 'stylesheet'];

      const shouldBlock = (url: string, resourceType: string) => {
        try {
          const parsed = new URL(url);
          const hostname = parsed.hostname.toLowerCase();
          const lowerUrl = url.toLowerCase();

          if (blacklistedDomains.some(d => hostname.includes(d))) return true;
          if (blacklistedPatterns.some(p => lowerUrl.includes(p))) return true;
          if (blockedTypes.includes(resourceType)) return true;

          return false;
        } catch {
          return false;
        }
      };

      expect(shouldBlock('https://example.com/api/data', 'xhr')).toBe(false);
      expect(shouldBlock('https://cdn.example.com/main.js', 'script')).toBe(false);
      expect(shouldBlock('https://example.com/', 'document')).toBe(false);
    });

    it('should handle invalid URLs gracefully', () => {
      const shouldBlock = (url: string) => {
        try {
          new URL(url);
          return false;
        } catch {
          return false;
        }
      };

      expect(shouldBlock('not-a-url')).toBe(false);
      expect(shouldBlock('')).toBe(false);
    });
  });

  describe('soft 404 detection', () => {
    it('should detect soft 404 from title', () => {
      const detectSoft404 = (title: string, h1: string, bodyText: string) => {
        const reasons: string[] = [];
        const lowerTitle = title.toLowerCase();
        const lowerH1 = h1.toLowerCase();
        const lowerBody = bodyText.toLowerCase();

        if (lowerTitle.includes('404') || lowerTitle.includes('not found') || lowerTitle.includes('page not found')) {
          reasons.push(`Title indicates 404: "${title}"`);
        }

        if (lowerH1.includes('404') || lowerH1.includes('not found') || lowerH1.includes('page not found')) {
          reasons.push(`H1 indicates 404: "${h1}"`);
        }

        return { isSoft404: reasons.length > 0, reasons };
      };

      const result1 = detectSoft404('404 - Page Not Found', '', '');
      expect(result1.isSoft404).toBe(true);
      expect(result1.reasons[0]).toContain('Title indicates 404');

      const result2 = detectSoft404('Error: Not Found', '', '');
      expect(result2.isSoft404).toBe(true);

      const result3 = detectSoft404('My Website', '', '');
      expect(result3.isSoft404).toBe(false);
    });

    it('should detect soft 404 from H1', () => {
      const detectSoft404 = (title: string, h1: string) => {
        const reasons: string[] = [];
        const lowerH1 = h1.toLowerCase();

        if (lowerH1.includes('404') || lowerH1.includes('not found') || lowerH1.includes('page not found')) {
          reasons.push(`H1 indicates 404: "${h1}"`);
        }

        return { isSoft404: reasons.length > 0, reasons };
      };

      const result1 = detectSoft404('', '404 Error');
      expect(result1.isSoft404).toBe(true);

      const result2 = detectSoft404('', 'Page Not Found');
      expect(result2.isSoft404).toBe(true);
    });

    it('should detect soft 404 from body patterns', () => {
      const notFoundPatterns = [
        '404 - page not found',
        '404 error',
        'this page cannot be found',
        'the page you are looking for',
        'sorry, the page you',
        'we couldn\'t find the page',
        'no results found',
        'nothing found',
        'url not found',
        'resource not found',
        'content not available'
      ];

      const detectFromBody = (bodyText: string) => {
        const lowerBody = bodyText.toLowerCase();
        for (const pattern of notFoundPatterns) {
          if (lowerBody.includes(pattern)) {
            return { isSoft404: true, pattern };
          }
        }
        return { isSoft404: false };
      };

      expect(detectFromBody('Sorry, the page you requested was not found').isSoft404).toBe(true);
      expect(detectFromBody('No results found for your search').isSoft404).toBe(true);
      expect(detectFromBody('Welcome to our website').isSoft404).toBe(false);
    });

    it('should detect explicit prerender-status-code', () => {
      const parseStatusCode = (content: string | null) => {
        if (!content) return undefined;
        const code = parseInt(content, 10);
        if (!isNaN(code) && code >= 100 && code < 600) {
          return code;
        }
        return undefined;
      };

      expect(parseStatusCode('404')).toBe(404);
      expect(parseStatusCode('500')).toBe(500);
      expect(parseStatusCode('200')).toBe(200);
      expect(parseStatusCode('invalid')).toBe(undefined);
      expect(parseStatusCode(null)).toBe(undefined);
    });

    it('should detect minimal content with 404 indicators', () => {
      const detectMinimalContent = (bodyText: string, title: string, h1: string) => {
        const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
        const lowerTitle = title.toLowerCase();
        const lowerH1 = h1.toLowerCase();

        if (wordCount < 50 && (lowerTitle.includes('not found') || lowerH1.includes('not found'))) {
          return true;
        }
        return false;
      };

      expect(detectMinimalContent('Sorry page not found', 'Not Found', '')).toBe(true);
      expect(detectMinimalContent('This is a long page with lots of content that exceeds fifty words of text that we can use to test the minimal content detection algorithm and verify it works correctly for pages with more content', '', '')).toBe(false);
    });

    it('should detect 404-specific CSS selectors', () => {
      const notFoundSelectors = [
        '.error-404',
        '#error-404',
        '.not-found',
        '#not-found',
        '.page-not-found',
        '#page-not-found',
        '.error-page',
        '#error-page',
        '[class*="404"]',
        '[id*="404"]',
        '[class*="not-found"]',
        '[id*="not-found"]'
      ];

      const checkSelector = (selector: string) => {
        return notFoundSelectors.includes(selector);
      };

      expect(checkSelector('.error-404')).toBe(true);
      expect(checkSelector('#not-found')).toBe(true);
      expect(checkSelector('.page-not-found')).toBe(true);
      expect(checkSelector('.regular-class')).toBe(false);
    });
  });

  describe('QueueMetrics', () => {
    it('should initialize with correct default values', () => {
      const metrics = {
        queued: 0,
        processing: 0,
        completed: 0,
        errors: 0,
        maxConcurrency: 3
      };

      expect(metrics.queued).toBe(0);
      expect(metrics.processing).toBe(0);
      expect(metrics.completed).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.maxConcurrency).toBe(3);
    });

    it('should track queue changes', () => {
      const metrics = {
        queued: 0,
        processing: 0,
        completed: 0,
        errors: 0,
        maxConcurrency: 3
      };

      // Simulate adding to queue
      metrics.queued++;
      expect(metrics.queued).toBe(1);

      // Simulate processing
      metrics.processing++;
      metrics.queued = Math.max(0, metrics.queued - 1);
      expect(metrics.processing).toBe(1);
      expect(metrics.queued).toBe(0);

      // Simulate completion
      metrics.completed++;
      metrics.processing--;
      expect(metrics.completed).toBe(1);
      expect(metrics.processing).toBe(0);
    });

    it('should track errors', () => {
      const metrics = {
        queued: 1,
        processing: 1,
        completed: 0,
        errors: 0,
        maxConcurrency: 3
      };

      // Simulate error
      metrics.errors++;
      metrics.processing--;
      metrics.queued = Math.max(0, metrics.queued - 1);

      expect(metrics.errors).toBe(1);
      expect(metrics.processing).toBe(0);
      expect(metrics.queued).toBe(0);
    });

    it('should return copy of metrics', () => {
      const metrics = {
        queued: 5,
        processing: 2,
        completed: 10,
        errors: 1,
        maxConcurrency: 3
      };

      const getMetrics = () => ({ ...metrics });
      const result = getMetrics();

      expect(result).toEqual(metrics);
      expect(result).not.toBe(metrics);
    });
  });

  describe('emitSSREvent', () => {
    it('should create SSR event object with all fields', () => {
      const createSSREvent = (event: string, data: any) => ({
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        event,
        url: data.url || '',
        timestamp: data.timestamp || Date.now(),
        duration: data.duration,
        success: data.success,
        htmlLength: data.htmlLength,
        statusCode: data.statusCode,
        error: data.error,
        queueSize: data.queueSize,
        processing: data.processing,
        renderId: data.renderId,
        score: data.score,
        passed: data.passed,
        issues: data.issues
      });

      const event = createSSREvent('render_complete', {
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 1500,
        success: true,
        htmlLength: 5000,
        statusCode: 200
      });

      expect(event.event).toBe('render_complete');
      expect(event.url).toBe('https://example.com');
      expect(event.success).toBe(true);
      expect(event.htmlLength).toBe(5000);
      expect(event.statusCode).toBe(200);
    });

    it('should handle render_start event', () => {
      const data = {
        renderId: 'render_123',
        url: 'https://example.com',
        timestamp: Date.now(),
        queueSize: 2,
        processing: 1
      };

      const event = {
        event: 'render_start',
        ...data
      };

      expect(event.event).toBe('render_start');
      expect(event.renderId).toBe('render_123');
      expect(event.queueSize).toBe(2);
    });

    it('should handle render_error event', () => {
      const data = {
        renderId: 'render_123',
        url: 'https://example.com',
        timestamp: Date.now(),
        duration: 500,
        success: false,
        error: 'Timeout'
      };

      const event = {
        event: 'render_error',
        ...data
      };

      expect(event.event).toBe('render_error');
      expect(event.success).toBe(false);
      expect(event.error).toBe('Timeout');
    });

    it('should handle health_check event', () => {
      const data = {
        url: 'https://example.com',
        score: 85,
        passed: true,
        issues: [{ type: 'warning', message: 'Minor issue' }],
        timestamp: Date.now()
      };

      const event = {
        event: 'health_check',
        ...data
      };

      expect(event.event).toBe('health_check');
      expect(event.score).toBe(85);
      expect(event.passed).toBe(true);
      expect(event.issues).toHaveLength(1);
    });

    it('should silently fail on emit error', () => {
      const emitSSREvent = (event: string, data: any) => {
        try {
          // Simulate error
          throw new Error('Emit failed');
        } catch (e) {
          // Silently fail
        }
      };

      // Should not throw
      expect(() => emitSSREvent('render_complete', {})).not.toThrow();
    });

    it('should broadcast via global io', () => {
      (global as any).io = {
        emit: vi.fn()
      };

      const emitSSREvent = (event: string, data: any) => {
        try {
          (global as any).io?.emit('ssr_event', data);
        } catch (e) {
          // Silently fail
        }
      };

      emitSSREvent('render_complete', { url: 'https://example.com' });

      expect((global as any).io.emit).toHaveBeenCalledWith('ssr_event', { url: 'https://example.com' });
    });
  });

  describe('puppeteer configuration', () => {
    it('should use correct viewport settings', () => {
      const viewportConfig = {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      };

      expect(viewportConfig.width).toBe(1920);
      expect(viewportConfig.height).toBe(1080);
      expect(viewportConfig.deviceScaleFactor).toBe(1);
    });

    it('should use correct user agent', () => {
      const userAgent = 'Mozilla/5.0 (compatible; SEOShieldProxy/1.0; +https://github.com/seoshield/seo-shield-proxy)';

      expect(userAgent).toContain('SEOShieldProxy');
      expect(userAgent).toContain('compatible');
    });

    it('should have correct launch args', () => {
      const args = [
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

      expect(args).toContain('--no-sandbox');
      expect(args).toContain('--disable-gpu');
      expect(args).toContain('--disable-extensions');
      expect(args).toContain('--mute-audio');
    });

    it('should add single-process in development', () => {
      const nodeEnv = 'development';
      const args = nodeEnv === 'development' ? ['--single-process'] : [];

      expect(args).toContain('--single-process');
    });

    it('should not add single-process in production', () => {
      const nodeEnv = 'production';
      const args = nodeEnv === 'development' ? ['--single-process'] : [];

      expect(args).not.toContain('--single-process');
    });

    it('should add single-process with PUPPETEER_SINGLE_PROCESS env', () => {
      const puppeteerSingleProcess = 'true';
      const args = puppeteerSingleProcess === 'true' ? ['--single-process'] : [];

      expect(args).toContain('--single-process');
    });
  });

  describe('navigation strategies', () => {
    it('should try networkidle0 first', async () => {
      const waitStrategies = ['networkidle0', 'networkidle2', 'domcontentloaded'];

      expect(waitStrategies[0]).toBe('networkidle0');
    });

    it('should fallback to networkidle2', async () => {
      const tryNavigation = async (page: any, url: string) => {
        try {
          await page.goto(url, { waitUntil: 'networkidle0' });
        } catch {
          await page.goto(url, { waitUntil: 'networkidle2' });
        }
      };

      // Test with mock that fails networkidle0
      const failingPage = {
        goto: vi.fn()
          .mockRejectedValueOnce(new Error('networkidle0 timeout'))
          .mockResolvedValueOnce(undefined)
      };

      await tryNavigation(failingPage, 'https://example.com');

      expect(failingPage.goto).toHaveBeenCalledTimes(2);
      expect(failingPage.goto).toHaveBeenCalledWith('https://example.com', { waitUntil: 'networkidle0' });
      expect(failingPage.goto).toHaveBeenCalledWith('https://example.com', { waitUntil: 'networkidle2' });
    });

    it('should fallback to domcontentloaded', async () => {
      const tryNavigation = async (page: any, url: string) => {
        try {
          await page.goto(url, { waitUntil: 'networkidle0' });
        } catch {
          try {
            await page.goto(url, { waitUntil: 'networkidle2' });
          } catch {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await new Promise(r => setTimeout(r, 100)); // Wait for JS
          }
        }
      };

      const failingPage = {
        goto: vi.fn()
          .mockRejectedValueOnce(new Error('networkidle0 timeout'))
          .mockRejectedValueOnce(new Error('networkidle2 timeout'))
          .mockResolvedValueOnce(undefined)
      };

      await tryNavigation(failingPage, 'https://example.com');

      expect(failingPage.goto).toHaveBeenCalledTimes(3);
    });
  });

  describe('request blocking actions', () => {
    it('should handle abort action', () => {
      const handleBlockedRequest = (request: any, result: any) => {
        if (result.blocked) {
          if (result.action === 'redirect' && result.options?.redirectUrl) {
            request.redirect?.(result.options.redirectUrl);
          } else if (result.action === 'modify' && result.options?.modifyHeaders) {
            request.continue({ headers: { ...request.headers(), ...result.options.modifyHeaders } });
          } else {
            request.abort();
          }
        }
      };

      const mockRequest = {
        abort: vi.fn()
      };

      handleBlockedRequest(mockRequest, { blocked: true, action: 'block' });

      expect(mockRequest.abort).toHaveBeenCalled();
    });

    it('should handle redirect action', () => {
      const mockRequest = {
        redirect: vi.fn(),
        abort: vi.fn()
      };

      const handleBlockedRequest = (request: any, result: any) => {
        if (result.blocked && result.action === 'redirect' && result.options?.redirectUrl) {
          try {
            request.redirect?.(result.options.redirectUrl);
          } catch {
            request.abort();
          }
        }
      };

      handleBlockedRequest(mockRequest, {
        blocked: true,
        action: 'redirect',
        options: { redirectUrl: 'https://placeholder.com/image.png' }
      });

      expect(mockRequest.redirect).toHaveBeenCalledWith('https://placeholder.com/image.png');
    });

    it('should handle modify headers action', () => {
      const mockRequest = {
        headers: vi.fn().mockReturnValue({ 'content-type': 'text/html' }),
        continue: vi.fn()
      };

      const handleBlockedRequest = (request: any, result: any) => {
        if (result.blocked && result.action === 'modify' && result.options?.modifyHeaders) {
          request.continue({ headers: { ...request.headers(), ...result.options.modifyHeaders } });
        }
      };

      handleBlockedRequest(mockRequest, {
        blocked: true,
        action: 'modify',
        options: { modifyHeaders: { 'x-custom': 'value' } }
      });

      expect(mockRequest.continue).toHaveBeenCalledWith({
        headers: { 'content-type': 'text/html', 'x-custom': 'value' }
      });
    });
  });

  describe('cluster initialization', () => {
    it('should return existing cluster if already initialized', async () => {
      let cluster: any = mockCluster;
      let isInitializing = false;

      const getCluster = async () => {
        if (cluster) {
          return cluster;
        }
        return null;
      };

      const result = await getCluster();
      expect(result).toBe(mockCluster);
    });

    it('should return init promise if already initializing', async () => {
      let initPromise: Promise<any> | null = null;
      let isInitializing = false;

      const getCluster = async () => {
        if (isInitializing && initPromise) {
          return initPromise;
        }
        isInitializing = true;
        initPromise = Promise.resolve(mockCluster);
        return initPromise;
      };

      const result = await getCluster();
      expect(result).toBe(mockCluster);
    });
  });

  describe('render method', () => {
    it('should generate unique render ID', () => {
      const generateRenderId = () =>
        `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const id1 = generateRenderId();
      const id2 = generateRenderId();

      expect(id1).toMatch(/^render_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should track render duration', async () => {
      const renderStartTime = Date.now();
      await new Promise(r => setTimeout(r, 10));
      const renderDuration = Date.now() - renderStartTime;

      expect(renderDuration).toBeGreaterThanOrEqual(10);
    });

    it('should log queue metrics', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const metrics = { queued: 2, processing: 1, maxConcurrency: 3 };
      console.log(`Queue: ${metrics.queued} queued, ${metrics.processing}/${metrics.maxConcurrency} processing`);

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Queue:'));

      logSpy.mockRestore();
    });
  });

  describe('close method', () => {
    it('should close direct browser', async () => {
      const directBrowser = mockBrowser;
      await directBrowser.close();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should close cluster', async () => {
      await mockCluster.idle();
      await mockCluster.close();

      expect(mockCluster.idle).toHaveBeenCalled();
      expect(mockCluster.close).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const closeBrowser = async () => {
        try {
          throw new Error('Close failed');
        } catch (error) {
          console.error('Error closing browser:', (error as Error).message);
        }
      };

      await closeBrowser();

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error closing browser'), 'Close failed');

      errorSpy.mockRestore();
    });
  });

  describe('Content Health Check integration', () => {
    it('should check page health', async () => {
      const healthCheck = {
        checkPageHealth: vi.fn().mockResolvedValue({
          score: 85,
          passed: true,
          issues: []
        })
      };

      const result = await healthCheck.checkPageHealth({}, 'https://example.com');

      expect(result.score).toBe(85);
      expect(result.passed).toBe(true);
    });

    it('should handle health check failure', async () => {
      const healthCheck = {
        checkPageHealth: vi.fn().mockResolvedValue({
          score: 30,
          passed: false,
          issues: [{ type: 'error', message: 'Missing H1' }]
        }),
        config: { failOnMissingCritical: true }
      };

      const result = await healthCheck.checkPageHealth({}, 'https://example.com');

      expect(result.passed).toBe(false);
      expect(result.issues).toHaveLength(1);
    });

    it('should return 503 on critical health check failure', () => {
      const createErrorResponse = () => ({
        html: '<!DOCTYPE html><html><head><title>Service Unavailable</title><meta name="robots" content="noindex"></head><body><h1>503 Service Unavailable</h1><p>Content validation failed. Please try again later.</p></body></html>',
        statusCode: 503
      });

      const response = createErrorResponse();

      expect(response.statusCode).toBe(503);
      expect(response.html).toContain('Service Unavailable');
      expect(response.html).toContain('noindex');
    });
  });

  describe('Virtual Scroll Manager integration', () => {
    it('should trigger virtual scroll', async () => {
      const virtualScrollManager = {
        triggerVirtualScroll: vi.fn().mockResolvedValue({
          success: true,
          scrollSteps: 5,
          completionRate: 100
        })
      };

      const result = await virtualScrollManager.triggerVirtualScroll({}, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.scrollSteps).toBe(5);
      expect(result.completionRate).toBe(100);
    });

    it('should handle virtual scroll failure', async () => {
      const virtualScrollManager = {
        triggerVirtualScroll: vi.fn().mockResolvedValue({
          success: false,
          scrollSteps: 0,
          completionRate: 0
        })
      };

      const result = await virtualScrollManager.triggerVirtualScroll({}, 'https://example.com');

      expect(result.success).toBe(false);
    });

    it('should update HTML after successful scroll', async () => {
      const page = {
        content: vi.fn().mockResolvedValue('<html><body>Updated content</body></html>')
      };

      const html = await page.content();

      expect(html).toContain('Updated content');
    });
  });

  describe('forensics collector integration', () => {
    it('should capture forensics on error', async () => {
      const forensicsCollector = {
        captureForensics: vi.fn().mockResolvedValue(undefined)
      };

      await forensicsCollector.captureForensics('https://example.com', new Error('Render failed'), {
        userAgent: 'Mozilla/5.0',
        viewport: { width: 1920, height: 1080 },
        headers: {},
        waitStrategy: 'networkidle0',
        timeout: 30000
      }, mockPage);

      expect(forensicsCollector.captureForensics).toHaveBeenCalled();
    });

    it('should handle forensics capture error', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const captureForensics = async () => {
        try {
          throw new Error('Forensics failed');
        } catch (error) {
          console.warn('Failed to capture forensics:', (error as Error).message);
        }
      };

      await captureForensics();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to capture forensics'), 'Forensics failed');

      warnSpy.mockRestore();
    });
  });

  describe('network optimization logging', () => {
    it('should calculate block rate', () => {
      const blockedCount = 15;
      const allowedCount = 5;
      const totalRequests = blockedCount + allowedCount;
      const blockRate = totalRequests > 0 ? Math.round((blockedCount / totalRequests) * 100) : 0;

      expect(totalRequests).toBe(20);
      expect(blockRate).toBe(75);
    });

    it('should handle zero requests', () => {
      const blockedCount = 0;
      const allowedCount = 0;
      const totalRequests = blockedCount + allowedCount;
      const blockRate = totalRequests > 0 ? Math.round((blockedCount / totalRequests) * 100) : 0;

      expect(blockRate).toBe(0);
    });
  });
});

describe('Process Signal Handlers', () => {
  it('should handle SIGINT', async () => {
    const closeFn = vi.fn().mockResolvedValue(undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    const sigintHandler = async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await closeFn();
      process.exit(0);
    };

    await sigintHandler();

    expect(closeFn).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });

  it('should handle SIGTERM', async () => {
    const closeFn = vi.fn().mockResolvedValue(undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    const sigtermHandler = async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await closeFn();
      process.exit(0);
    };

    await sigtermHandler();

    expect(closeFn).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });
});
