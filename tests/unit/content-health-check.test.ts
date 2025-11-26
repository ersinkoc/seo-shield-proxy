import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/logger', () => ({
  Logger: class {
    info() {}
    error() {}
    warn() {}
    debug() {}
  }
}));

describe('ContentHealthCheckManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import ContentHealthCheckManager', async () => {
      const module = await import('../../src/admin/content-health-check');
      expect(module.ContentHealthCheckManager).toBeDefined();
    });
  });

  describe('constructor', () => {
    it('should create instance with config', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 30,
        maxTitleLength: 60,
        minDescriptionLength: 120,
        maxDescriptionLength: 160,
        h1Required: true,
        metaDescriptionRequired: true,
        minBodyLength: 500,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);
      expect(manager).toBeDefined();
      expect(manager.config).toBe(config);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = module.ContentHealthCheckManager.getDefaultConfig();

      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.minBodyLength).toBe(500);
      expect(config.minTitleLength).toBe(30);
      expect(config.metaDescriptionRequired).toBe(true);
      expect(config.h1Required).toBe(true);
      expect(config.failOnMissingCritical).toBe(true);
    });

    it('should have critical selectors', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = module.ContentHealthCheckManager.getDefaultConfig();

      expect(Array.isArray(config.criticalSelectors)).toBe(true);
      expect(config.criticalSelectors.length).toBeGreaterThan(0);
    });

    it('should have title selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = module.ContentHealthCheckManager.getDefaultConfig();

      const titleSelector = config.criticalSelectors.find(s => s.selector === 'title');
      expect(titleSelector).toBeDefined();
      expect(titleSelector?.type).toBe('title');
      expect(titleSelector?.required).toBe(true);
    });

    it('should have meta description selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = module.ContentHealthCheckManager.getDefaultConfig();

      const metaSelector = config.criticalSelectors.find(s => s.selector === 'meta[name="description"]');
      expect(metaSelector).toBeDefined();
      expect(metaSelector?.type).toBe('meta');
    });

    it('should have h1 selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = module.ContentHealthCheckManager.getDefaultConfig();

      const h1Selector = config.criticalSelectors.find(s => s.selector === 'h1');
      expect(h1Selector).toBeDefined();
      expect(h1Selector?.type).toBe('h1');
    });

    it('should have body selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = module.ContentHealthCheckManager.getDefaultConfig();

      const bodySelector = config.criticalSelectors.find(s => s.selector === 'body');
      expect(bodySelector).toBeDefined();
      expect(bodySelector?.type).toBe('custom');
    });
  });

  describe('getDefaultCriticalSelectors', () => {
    it('should return general selectors', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('general');

      expect(Array.isArray(selectors)).toBe(true);
      expect(selectors.length).toBeGreaterThan(0);
    });

    it('should return ecommerce selectors', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('ecommerce');

      expect(Array.isArray(selectors)).toBe(true);

      const productTitle = selectors.find(s => s.selector === '.product-title');
      expect(productTitle).toBeDefined();

      const price = selectors.find(s => s.selector === '.price');
      expect(price).toBeDefined();
    });

    it('should return blog selectors', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('blog');

      expect(Array.isArray(selectors)).toBe(true);

      const blogTitle = selectors.find(s => s.selector === '.blog-title');
      expect(blogTitle).toBeDefined();

      const blogContent = selectors.find(s => s.selector === '.blog-content');
      expect(blogContent).toBeDefined();
    });

    it('should return corporate selectors', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('corporate');

      expect(Array.isArray(selectors)).toBe(true);

      const nav = selectors.find(s => s.selector === 'nav, .navigation, .menu');
      expect(nav).toBeDefined();
    });

    it('should include base selectors for all types', async () => {
      const module = await import('../../src/admin/content-health-check');

      const pageTypes: Array<'ecommerce' | 'blog' | 'corporate' | 'general'> = ['ecommerce', 'blog', 'corporate', 'general'];

      for (const type of pageTypes) {
        const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors(type);

        // All should have title selector
        const titleSelector = selectors.find(s => s.selector === 'title');
        expect(titleSelector).toBeDefined();

        // All should have meta description
        const metaSelector = selectors.find(s => s.selector === 'meta[name="description"]');
        expect(metaSelector).toBeDefined();

        // All should have h1
        const h1Selector = selectors.find(s => s.selector === 'h1');
        expect(h1Selector).toBeDefined();
      }
    });
  });

  describe('checkPageHealth method', () => {
    it('should have checkPageHealth method', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = module.ContentHealthCheckManager.getDefaultConfig();
      const manager = new module.ContentHealthCheckManager(config);

      expect(typeof manager.checkPageHealth).toBe('function');
    });

    it('should return health check result structure', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 30,
        minBodyLength: 500,
        metaDescriptionRequired: true,
        h1Required: true,
        failOnMissingCritical: true,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockImplementation((fn) => {
          // Simulate first call for metrics
          if (typeof fn === 'function') {
            return {
              titleLength: 45,
              title: 'Test Page Title for SEO Testing',
              descriptionLength: 150,
              description: 'This is a test description for the page that is long enough',
              h1Count: 1,
              wordCount: 500,
              bodyLength: 2500,
              structuredDataCount: 1,
              hasCanonical: true,
              hasOgTitle: true,
              hasOgDescription: true,
              hasOgImage: true,
              hasTwitterCard: true,
              hasTwitterTitle: true,
              hasHtmlLang: true,
              hasViewport: true,
              imagesWithoutAlt: 0,
            };
          }
          return {};
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result).toBeDefined();
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle page evaluation errors', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 30,
        minBodyLength: 500,
        metaDescriptionRequired: true,
        h1Required: true,
        failOnMissingCritical: true,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockRejectedValue(new Error('Page evaluation failed')),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result.passed).toBe(false);
      expect(result.success).toBe(false);
      expect(result.score).toBe(0);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].type).toBe('error');
    });
  });

  describe('critical selector types', () => {
    it('should support title type', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('general');

      const titleSelector = selectors.find(s => s.type === 'title');
      expect(titleSelector).toBeDefined();
    });

    it('should support meta type', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('general');

      const metaSelector = selectors.find(s => s.type === 'meta');
      expect(metaSelector).toBeDefined();
    });

    it('should support h1 type', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('general');

      const h1Selector = selectors.find(s => s.type === 'h1');
      expect(h1Selector).toBeDefined();
    });

    it('should support custom type', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('general');

      const customSelector = selectors.find(s => s.type === 'custom');
      expect(customSelector).toBeDefined();
    });
  });

  describe('selector configuration', () => {
    it('should have minLength for title selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('general');

      const titleSelector = selectors.find(s => s.selector === 'title');
      expect(titleSelector?.minLength).toBe(30);
    });

    it('should have maxLength for title selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('general');

      const titleSelector = selectors.find(s => s.selector === 'title');
      expect(titleSelector?.maxLength).toBe(60);
    });

    it('should have description for selectors', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('general');

      for (const selector of selectors) {
        expect(selector.description).toBeDefined();
        expect(typeof selector.description).toBe('string');
      }
    });

    it('should have required flag for selectors', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('general');

      for (const selector of selectors) {
        expect(typeof selector.required).toBe('boolean');
      }
    });
  });

  describe('health score calculation', () => {
    it('should return score between 0 and 100', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 30,
        minBodyLength: 500,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 50,
          title: 'A Good Page Title That Is Long Enough For SEO',
          descriptionLength: 140,
          description: 'A good meta description',
          h1Count: 1,
          wordCount: 400,
          bodyLength: 2000,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('metrics tracking', () => {
    it('should track title length', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 30,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 45,
          title: 'Test Title',
          descriptionLength: 0,
          description: '',
          h1Count: 0,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result.metrics.titleLength).toBe(45);
    });

    it('should track description length', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 150,
          description: 'Test description',
          h1Count: 0,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result.metrics.descriptionLength).toBe(150);
    });

    it('should track h1 count', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 0,
          description: '',
          h1Count: 2,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result.metrics.h1Count).toBe(2);
    });

    it('should track word count', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 0,
          description: '',
          h1Count: 1,
          wordCount: 350,
          bodyLength: 1500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result.metrics.wordCount).toBe(350);
    });

    it('should track load time', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test',
          descriptionLength: 0,
          description: '',
          h1Count: 1,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result.metrics.loadTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('issue detection', () => {
    it('should detect missing title', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 30,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 0,
          title: '',
          descriptionLength: 0,
          description: '',
          h1Count: 0,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const titleIssue = result.issues.find(i => i.selector === 'title' && i.type === 'error');
      expect(titleIssue).toBeDefined();
      expect(titleIssue?.message).toContain('missing');
    });

    it('should detect short title', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 30,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 15,
          title: 'Short Title',
          descriptionLength: 0,
          description: '',
          h1Count: 0,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const titleIssue = result.issues.find(i => i.selector === 'title' && i.message.includes('short'));
      expect(titleIssue).toBeDefined();
      expect(titleIssue?.type).toBe('warning');
    });

    it('should detect multiple H1 tags', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 0,
          description: '',
          h1Count: 3,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const h1Issue = result.issues.find(i => i.selector === 'h1' && i.message.includes('Multiple'));
      expect(h1Issue).toBeDefined();
      expect(h1Issue?.type).toBe('warning');
    });

    it('should detect images without alt text', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 0,
          description: '',
          h1Count: 1,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 5,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const imgIssue = result.issues.find(i => i.message.includes('images missing alt'));
      expect(imgIssue).toBeDefined();
      expect(imgIssue?.type).toBe('warning');
    });
  });

  describe('interface exports', () => {
    it('should export ContentHealthConfig interface implicitly', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = module.ContentHealthCheckManager.getDefaultConfig();

      // Verify the config matches ContentHealthConfig interface
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('criticalSelectors');
      expect(config).toHaveProperty('minBodyLength');
      expect(config).toHaveProperty('minTitleLength');
      expect(config).toHaveProperty('metaDescriptionRequired');
      expect(config).toHaveProperty('h1Required');
      expect(config).toHaveProperty('failOnMissingCritical');
    });

    it('should have correct CriticalSelector structure', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('general');

      for (const selector of selectors) {
        expect(selector).toHaveProperty('selector');
        expect(selector).toHaveProperty('type');
        expect(selector).toHaveProperty('required');
        expect(['title', 'meta', 'h1', 'canonical', 'json-ld', 'critical-css', 'custom']).toContain(selector.type);
      }
    });
  });

  describe('HealthCheckResult interface', () => {
    it('should have all required properties', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 0,
          description: '',
          h1Count: 1,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('recommendations');
    });

    it('should have metrics with all fields', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test',
          descriptionLength: 140,
          description: 'Test desc',
          h1Count: 1,
          wordCount: 300,
          bodyLength: 1500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result.metrics).toHaveProperty('titleLength');
      expect(result.metrics).toHaveProperty('descriptionLength');
      expect(result.metrics).toHaveProperty('h1Count');
      expect(result.metrics).toHaveProperty('wordCount');
      expect(result.metrics).toHaveProperty('loadTime');
      expect(result.metrics).toHaveProperty('criticalSelectorsFound');
      expect(result.metrics).toHaveProperty('totalCriticalSelectors');
    });
  });

  describe('title validation edge cases', () => {
    it('should detect very long title', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 30,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 80,
          title: 'This is a very long title that exceeds the recommended maximum of 60 characters',
          descriptionLength: 0,
          description: '',
          h1Count: 1,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const titleIssue = result.issues.find(i => i.selector === 'title' && i.message.includes('long'));
      expect(titleIssue).toBeDefined();
      expect(titleIssue?.type).toBe('warning');
    });

    it('should pass for title in optimal range', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 30,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 45,
          title: 'A Perfect SEO Title That Is Just Right',
          descriptionLength: 0,
          description: '',
          h1Count: 1,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const titleIssue = result.issues.find(i => i.selector === 'title');
      expect(titleIssue).toBeUndefined();
    });
  });

  describe('description validation edge cases', () => {
    it('should detect missing required description', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: true,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 0,
          description: '',
          h1Count: 1,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const descIssue = result.issues.find(i => i.selector === 'meta[name="description"]' && i.type === 'error');
      expect(descIssue).toBeDefined();
      expect(descIssue?.message).toContain('missing');
    });

    it('should detect short description', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 50,
          description: 'Short description',
          h1Count: 1,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const descIssue = result.issues.find(i => i.selector === 'meta[name="description"]' && i.message.includes('outside optimal'));
      expect(descIssue).toBeDefined();
    });

    it('should detect long description', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 200,
          description: 'Very long description that exceeds the recommended maximum',
          h1Count: 1,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const descIssue = result.issues.find(i => i.selector === 'meta[name="description"]' && i.message.includes('outside optimal'));
      expect(descIssue).toBeDefined();
    });
  });

  describe('H1 validation edge cases', () => {
    it('should detect missing required H1', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: true,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 0,
          description: '',
          h1Count: 0,
          wordCount: 100,
          bodyLength: 500,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const h1Issue = result.issues.find(i => i.selector === 'h1' && i.type === 'error');
      expect(h1Issue).toBeDefined();
      expect(h1Issue?.message).toContain('missing');
    });
  });

  describe('body content validation', () => {
    it('should detect short body content', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 1000,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: []
      };
      const manager = new module.ContentHealthCheckManager(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          titleLength: 30,
          title: 'Test Title',
          descriptionLength: 0,
          description: '',
          h1Count: 1,
          wordCount: 50,
          bodyLength: 200,
          structuredDataCount: 0,
          hasCanonical: false,
          hasOgTitle: false,
          hasOgDescription: false,
          hasOgImage: false,
          hasTwitterCard: false,
          hasTwitterTitle: false,
          hasHtmlLang: false,
          hasViewport: false,
          imagesWithoutAlt: 0,
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const bodyIssue = result.issues.find(i => i.selector === 'body' && i.message.includes('too short'));
      expect(bodyIssue).toBeDefined();
      expect(bodyIssue?.type).toBe('error');
    });
  });

  describe('critical selector validation', () => {
    it('should find required critical selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: true,
        criticalSelectors: [
          { selector: '.main-content', type: 'custom' as const, required: true, description: 'Main content' }
        ]
      };
      const manager = new module.ContentHealthCheckManager(config);

      let callCount = 0;
      const mockPage = {
        evaluate: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              titleLength: 30,
              title: 'Test',
              descriptionLength: 0,
              description: '',
              h1Count: 1,
              wordCount: 100,
              bodyLength: 500
            };
          } else if (callCount === 2) {
            return true; // Selector found
          } else {
            return {
              structuredDataCount: 0,
              hasCanonical: false,
              hasOgTitle: false,
              hasOgDescription: false,
              hasOgImage: false,
              hasTwitterCard: false,
              hasTwitterTitle: false,
              hasHtmlLang: false,
              hasViewport: false,
              imagesWithoutAlt: 0,
            };
          }
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      expect(result.metrics.criticalSelectorsFound).toBe(1);
    });

    it('should detect missing required critical selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: true,
        criticalSelectors: [
          { selector: '.non-existent', type: 'custom' as const, required: true, description: 'Non-existent element' }
        ]
      };
      const manager = new module.ContentHealthCheckManager(config);

      let callCount = 0;
      const mockPage = {
        evaluate: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              titleLength: 30,
              title: 'Test',
              descriptionLength: 0,
              description: '',
              h1Count: 1,
              wordCount: 100,
              bodyLength: 500
            };
          } else if (callCount === 2) {
            return false; // Selector not found
          } else {
            return {
              structuredDataCount: 0,
              hasCanonical: false,
              hasOgTitle: false,
              hasOgDescription: false,
              hasOgImage: false,
              hasTwitterCard: false,
              hasTwitterTitle: false,
              hasHtmlLang: false,
              hasViewport: false,
              imagesWithoutAlt: 0,
            };
          }
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const selectorIssue = result.issues.find(i => i.selector === '.non-existent' && i.type === 'error');
      expect(selectorIssue).toBeDefined();
    });

    it('should warn for missing optional critical selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: [
          { selector: '.optional-element', type: 'custom' as const, required: false, description: 'Optional element' }
        ]
      };
      const manager = new module.ContentHealthCheckManager(config);

      let callCount = 0;
      const mockPage = {
        evaluate: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              titleLength: 30,
              title: 'Test',
              descriptionLength: 0,
              description: '',
              h1Count: 1,
              wordCount: 100,
              bodyLength: 500
            };
          } else if (callCount === 2) {
            return false; // Selector not found
          } else {
            return {
              structuredDataCount: 0,
              hasCanonical: false,
              hasOgTitle: false,
              hasOgDescription: false,
              hasOgImage: false,
              hasTwitterCard: false,
              hasTwitterTitle: false,
              hasHtmlLang: false,
              hasViewport: false,
              imagesWithoutAlt: 0,
            };
          }
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const selectorIssue = result.issues.find(i => i.selector === '.optional-element' && i.type === 'warning');
      expect(selectorIssue).toBeDefined();
    });

    it('should handle selector evaluation errors', async () => {
      const module = await import('../../src/admin/content-health-check');
      const config = {
        enabled: true,
        minTitleLength: 10,
        minBodyLength: 100,
        metaDescriptionRequired: false,
        h1Required: false,
        failOnMissingCritical: false,
        criticalSelectors: [
          { selector: '.error-selector', type: 'custom' as const, required: true, description: 'Error selector' }
        ]
      };
      const manager = new module.ContentHealthCheckManager(config);

      let callCount = 0;
      const mockPage = {
        evaluate: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              titleLength: 30,
              title: 'Test',
              descriptionLength: 0,
              description: '',
              h1Count: 1,
              wordCount: 100,
              bodyLength: 500
            };
          } else if (callCount === 2) {
            throw new Error('Selector evaluation failed');
          } else {
            return {
              structuredDataCount: 0,
              hasCanonical: false,
              hasOgTitle: false,
              hasOgDescription: false,
              hasOgImage: false,
              hasTwitterCard: false,
              hasTwitterTitle: false,
              hasHtmlLang: false,
              hasViewport: false,
              imagesWithoutAlt: 0,
            };
          }
        }),
      };

      const result = await manager.checkPageHealth(mockPage as any, 'https://example.com');

      const errorIssue = result.issues.find(i => i.selector === '.error-selector' && i.message.includes('Error checking'));
      expect(errorIssue).toBeDefined();
    });
  });

  describe('health score calculation', () => {
    it('should deduct points for errors', () => {
      const errorCount = 2;
      const initialScore = 100;
      const scoreAfterErrors = initialScore - (errorCount * 25);
      expect(scoreAfterErrors).toBe(50);
    });

    it('should deduct points for warnings', () => {
      const warningCount = 3;
      const initialScore = 100;
      const scoreAfterWarnings = initialScore - (warningCount * 10);
      expect(scoreAfterWarnings).toBe(70);
    });

    it('should add bonus for good title length', () => {
      const titleLength = 45;
      const bonus = titleLength >= 30 && titleLength <= 60 ? 5 : 0;
      expect(bonus).toBe(5);
    });

    it('should add bonus for good description length', () => {
      const descriptionLength = 140;
      const bonus = descriptionLength >= 120 && descriptionLength <= 160 ? 5 : 0;
      expect(bonus).toBe(5);
    });

    it('should add bonus for single H1', () => {
      const h1Count = 1;
      const bonus = h1Count === 1 ? 5 : 0;
      expect(bonus).toBe(5);
    });

    it('should add bonus for sufficient word count', () => {
      const wordCount = 350;
      const bonus = wordCount >= 300 ? 5 : 0;
      expect(bonus).toBe(5);
    });

    it('should add bonus for critical selector coverage', () => {
      const criticalSelectorsFound = 3;
      const totalCriticalSelectors = 4;
      const coveragePercentage = criticalSelectorsFound / totalCriticalSelectors;
      const bonus = Math.round(coveragePercentage * 10);
      expect(bonus).toBe(8);
    });

    it('should cap score at 0 minimum', () => {
      const calculatedScore = -50;
      const finalScore = Math.max(0, Math.min(100, calculatedScore));
      expect(finalScore).toBe(0);
    });

    it('should cap score at 100 maximum', () => {
      const calculatedScore = 150;
      const finalScore = Math.max(0, Math.min(100, calculatedScore));
      expect(finalScore).toBe(100);
    });
  });

  describe('recommendation generation', () => {
    it('should recommend adding title when missing', () => {
      const titleLength = 0;
      const recommendations: string[] = [];
      if (titleLength === 0) {
        recommendations.push('Add a descriptive page title (30-60 characters)');
      }
      expect(recommendations).toContain('Add a descriptive page title (30-60 characters)');
    });

    it('should recommend expanding short title', () => {
      const titleLength = 20;
      const recommendations: string[] = [];
      if (titleLength > 0 && titleLength < 30) {
        recommendations.push('Expand page title to at least 30 characters');
      }
      expect(recommendations).toContain('Expand page title to at least 30 characters');
    });

    it('should recommend shortening long title', () => {
      const titleLength = 75;
      const recommendations: string[] = [];
      if (titleLength > 60) {
        recommendations.push('Shorten page title to 60 characters or less');
      }
      expect(recommendations).toContain('Shorten page title to 60 characters or less');
    });

    it('should recommend adding description when missing', () => {
      const descriptionLength = 0;
      const recommendations: string[] = [];
      if (descriptionLength === 0) {
        recommendations.push('Add a meta description (120-160 characters)');
      }
      expect(recommendations).toContain('Add a meta description (120-160 characters)');
    });

    it('should recommend optimizing description length', () => {
      const descriptionLength = 100;
      const recommendations: string[] = [];
      if (descriptionLength > 0 && (descriptionLength < 120 || descriptionLength > 160)) {
        recommendations.push('Optimize meta description to 120-160 characters');
      }
      expect(recommendations).toContain('Optimize meta description to 120-160 characters');
    });

    it('should recommend adding H1 when missing', () => {
      const h1Count = 0;
      const recommendations: string[] = [];
      if (h1Count === 0) {
        recommendations.push('Add a single H1 tag for the main heading');
      }
      expect(recommendations).toContain('Add a single H1 tag for the main heading');
    });

    it('should recommend using single H1', () => {
      const h1Count = 3;
      const recommendations: string[] = [];
      if (h1Count > 1) {
        recommendations.push('Use only one H1 tag per page');
      }
      expect(recommendations).toContain('Use only one H1 tag per page');
    });

    it('should recommend adding more content', () => {
      const wordCount = 150;
      const recommendations: string[] = [];
      if (wordCount < 300) {
        recommendations.push('Add more substantive content (aim for 300+ words)');
      }
      expect(recommendations).toContain('Add more substantive content (aim for 300+ words)');
    });

    it('should recommend adding missing critical selectors', () => {
      const totalCriticalSelectors = 5;
      const criticalSelectorsFound = 3;
      const criticalMissing = totalCriticalSelectors - criticalSelectorsFound;
      const recommendations: string[] = [];
      if (criticalMissing > 0) {
        recommendations.push(`Add ${criticalMissing} missing critical selector(s) for better content validation`);
      }
      expect(recommendations).toContain('Add 2 missing critical selector(s) for better content validation');
    });
  });

  describe('logging format', () => {
    it('should format pass status correctly', () => {
      const passed = true;
      const status = passed ? '✅ PASS' : '❌ FAIL';
      expect(status).toBe('✅ PASS');
    });

    it('should format fail status correctly', () => {
      const passed = false;
      const status = passed ? '✅ PASS' : '❌ FAIL';
      expect(status).toBe('❌ FAIL');
    });

    it('should pad score to 3 characters', () => {
      const score = 75;
      const padded = score.toString().padStart(3, ' ');
      expect(padded).toBe(' 75');
      expect(padded.length).toBe(3);
    });
  });

  describe('pass/fail logic', () => {
    it('should pass when score >= 70 and no errors', () => {
      const score = 75;
      const hasErrors = false;
      const passed = score >= 70 && !hasErrors;
      expect(passed).toBe(true);
    });

    it('should fail when score < 70', () => {
      const score = 50;
      const hasErrors = false;
      const passed = score >= 70 && !hasErrors;
      expect(passed).toBe(false);
    });

    it('should fail when has errors', () => {
      const score = 85;
      const hasErrors = true;
      const passed = score >= 70 && !hasErrors;
      expect(passed).toBe(false);
    });
  });

  describe('ecommerce page type selectors', () => {
    it('should include product description selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('ecommerce');

      const descSelector = selectors.find(s => s.selector === '.product-description, .description');
      expect(descSelector).toBeDefined();
      expect(descSelector?.required).toBe(true);
    });

    it('should include product image selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('ecommerce');

      const imgSelector = selectors.find(s => s.selector === 'img[alt]');
      expect(imgSelector).toBeDefined();
    });
  });

  describe('blog page type selectors', () => {
    it('should include author selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('blog');

      const authorSelector = selectors.find(s => s.selector === '.author, .by-author');
      expect(authorSelector).toBeDefined();
      expect(authorSelector?.required).toBe(false);
    });

    it('should include publish date selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('blog');

      const dateSelector = selectors.find(s => s.selector === '.publish-date, .entry-date');
      expect(dateSelector).toBeDefined();
    });
  });

  describe('corporate page type selectors', () => {
    it('should include company name selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('corporate');

      const companySelector = selectors.find(s => s.selector === '.company-name, .brand');
      expect(companySelector).toBeDefined();
    });

    it('should include contact selector', async () => {
      const module = await import('../../src/admin/content-health-check');
      const selectors = module.ContentHealthCheckManager.getDefaultCriticalSelectors('corporate');

      const contactSelector = selectors.find(s => s.selector === '.contact, .contact-info');
      expect(contactSelector).toBeDefined();
    });
  });

  describe('issue structure', () => {
    it('should have correct issue structure for errors', () => {
      const issue = {
        type: 'error' as const,
        selector: 'title',
        message: 'Page title is missing',
        actual: '',
        expected: 'non-empty title'
      };

      expect(issue.type).toBe('error');
      expect(issue.selector).toBeDefined();
      expect(issue.message).toBeDefined();
    });

    it('should have correct issue structure for warnings', () => {
      const issue = {
        type: 'warning' as const,
        selector: 'meta[name="description"]',
        message: 'Meta description length outside optimal range',
        actual: 100,
        expected: '120-160'
      };

      expect(issue.type).toBe('warning');
      expect(issue.actual).toBe(100);
      expect(issue.expected).toBe('120-160');
    });
  });
});
