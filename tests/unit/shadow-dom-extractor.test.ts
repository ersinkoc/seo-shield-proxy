import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/utils/logger', () => ({
  Logger: class {
    info() {}
    error() {}
    warn() {}
    debug() {}
  }
}));

describe('ShadowDOMExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import ShadowDOMExtractor', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      expect(module.ShadowDOMExtractor).toBeDefined();
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(config).toBeDefined();
    });

    it('should have enabled flag', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(typeof config.enabled).toBe('boolean');
      expect(config.enabled).toBe(true);
    });

    it('should have deepSerialization flag', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(config.deepSerialization).toBe(true);
    });

    it('should have includeShadowContent flag', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(config.includeShadowContent).toBe(true);
    });

    it('should have flattenShadowTrees flag', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(config.flattenShadowTrees).toBe(true);
    });

    it('should have customElements object', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(typeof config.customElements).toBe('object');
      expect(config.customElements).not.toBeNull();
    });

    it('should have lit-element extraction config', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(config.customElements['lit-element']).toBeDefined();
      expect(config.customElements['lit-element'].extractMethod).toBe('slot');
    });

    it('should have stencil-component extraction config', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(config.customElements['stencil-component']).toBeDefined();
      expect(config.customElements['stencil-component'].extractMethod).toBe('slot');
    });

    it('should have custom-element extraction config', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(config.customElements['custom-element']).toBeDefined();
      expect(config.customElements['custom-element'].extractMethod).toBe('custom');
      expect(config.customElements['custom-element'].selector).toBe('.content');
    });

    it('should have preserveShadowBoundaries flag', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(config.preserveShadowBoundaries).toBe(false);
    });

    it('should have extractCSSVariables flag', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(config.extractCSSVariables).toBe(true);
    });

    it('should have extractComputedStyles flag', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      expect(config.extractComputedStyles).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should create instance with default config', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);
      expect(extractor).toBeDefined();
    });

    it('should create instance with disabled config', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = false;
      const extractor = new module.ShadowDOMExtractor(config);
      expect(extractor).toBeDefined();
    });

    it('should create instance with custom elements', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = {
        enabled: true,
        deepSerialization: false,
        includeShadowContent: false,
        flattenShadowTrees: false,
        customElements: {
          'my-component': {
            extractMethod: 'attribute' as const,
            attribute: 'data-content'
          }
        },
        preserveShadowBoundaries: true,
        extractCSSVariables: false,
        extractComputedStyles: true
      };
      const extractor = new module.ShadowDOMExtractor(config);
      expect(extractor).toBeDefined();
    });
  });

  describe('extractCompleteContent', () => {
    it('should have extractCompleteContent method', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);
      expect(typeof extractor.extractCompleteContent).toBe('function');
    });

    it('should return basic structure when disabled', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = false;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
        evaluate: vi.fn()
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(result.lightDOM).toBe('<html><body>Test</body></html>');
      expect(result.shadowDOMs).toEqual([]);
      expect(result.flattened).toBe('<html><body>Test</body></html>');
      expect(result.warnings).toContain('Shadow DOM extraction is disabled');
    });

    it('should return stats when disabled', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = false;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
        evaluate: vi.fn()
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(result.stats).toBeDefined();
      expect(result.stats.totalShadowRoots).toBe(0);
      expect(result.stats.extractedElements).toBe(0);
      expect(result.stats.cssVariables).toBe(0);
      expect(result.stats.nestedDepth).toBe(0);
      expect(result.stats.extractionTime).toBeGreaterThanOrEqual(0);
    });

    it('should execute with enabled config', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = true;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
        evaluate: vi.fn().mockResolvedValue({
          lightDOM: '<html><body>Test</body></html>',
          shadowDOMs: [],
          flattened: '<html><body>Test</body></html>',
          extractedElements: 0,
          cssVariables: [],
          maxDepth: 0,
          warnings: []
        })
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(result.lightDOM).toBe('<html><body>Test</body></html>');
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle shadow DOM content', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = true;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html><body><my-component></my-component></body></html>'),
        evaluate: vi.fn().mockResolvedValue({
          lightDOM: '<html><body><my-component></my-component></body></html>',
          shadowDOMs: [{
            host: 'my-component',
            hostSelector: 'body > my-component',
            content: '<div>Shadow Content</div>',
            slots: [],
            cssVariables: {},
            styles: ''
          }],
          flattened: '<html><body><div>Shadow Content</div></body></html>',
          extractedElements: 1,
          cssVariables: ['--primary-color'],
          maxDepth: 1,
          warnings: []
        })
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(result.shadowDOMs.length).toBe(1);
      expect(result.shadowDOMs[0].host).toBe('my-component');
      expect(result.stats.totalShadowRoots).toBe(1);
      expect(result.stats.extractedElements).toBe(1);
    });

    it('should handle extraction errors', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = true;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html><body>Error Test</body></html>'),
        evaluate: vi.fn().mockRejectedValue(new Error('Extraction failed'))
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(result.lightDOM).toBe('<html><body>Error Test</body></html>');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Extraction failed');
    });

    it('should track extraction time', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = false;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
        evaluate: vi.fn()
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(typeof result.stats.extractionTime).toBe('number');
      expect(result.stats.extractionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('extractCustomElementContent', () => {
    it('should have extractCustomElementContent method', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);
      expect(typeof extractor.extractCustomElementContent).toBe('function');
    });

    it('should return empty array for unknown element', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue([])
      };

      const result = await extractor.extractCustomElementContent(mockPage as any, 'unknown-element');

      expect(result).toEqual([]);
    });

    it('should extract lit-element content', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue(['<div>Content 1</div>', '<div>Content 2</div>'])
      };

      const result = await extractor.extractCustomElementContent(mockPage as any, 'lit-element');

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(result).toEqual(['<div>Content 1</div>', '<div>Content 2</div>']);
    });

    it('should extract stencil-component content', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue(['<span>Stencil</span>'])
      };

      const result = await extractor.extractCustomElementContent(mockPage as any, 'stencil-component');

      expect(result).toEqual(['<span>Stencil</span>']);
    });

    it('should extract custom-element content with selector', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue(['<div class="content">Custom Content</div>'])
      };

      const result = await extractor.extractCustomElementContent(mockPage as any, 'custom-element');

      expect(result).toEqual(['<div class="content">Custom Content</div>']);
    });

    it('should support attribute extraction method', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = {
        enabled: true,
        deepSerialization: true,
        includeShadowContent: true,
        flattenShadowTrees: true,
        customElements: {
          'attr-element': {
            extractMethod: 'attribute' as const,
            attribute: 'data-content'
          }
        },
        preserveShadowBoundaries: false,
        extractCSSVariables: true,
        extractComputedStyles: false
      };
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue(['attribute-value'])
      };

      const result = await extractor.extractCustomElementContent(mockPage as any, 'attr-element');

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(result).toEqual(['attribute-value']);
    });
  });

  describe('getShadowCSSVariables', () => {
    it('should have getShadowCSSVariables method', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);
      expect(typeof extractor.getShadowCSSVariables).toBe('function');
    });

    it('should return empty object when no variables', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({})
      };

      const result = await extractor.getShadowCSSVariables(mockPage as any);

      expect(result).toEqual({});
    });

    it('should return CSS variables', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          '--primary-color': '#007bff',
          '--secondary-color': '#6c757d',
          '--font-size': '16px'
        })
      };

      const result = await extractor.getShadowCSSVariables(mockPage as any);

      expect(result['--primary-color']).toBe('#007bff');
      expect(result['--secondary-color']).toBe('#6c757d');
      expect(result['--font-size']).toBe('16px');
    });
  });

  describe('hasShadowDOM', () => {
    it('should have hasShadowDOM method', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);
      expect(typeof extractor.hasShadowDOM).toBe('function');
    });

    it('should return false when no shadow DOM', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue(false)
      };

      const result = await extractor.hasShadowDOM(mockPage as any);

      expect(result).toBe(false);
    });

    it('should return true when shadow DOM exists', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue(true)
      };

      const result = await extractor.hasShadowDOM(mockPage as any);

      expect(result).toBe(true);
    });
  });

  describe('getShadowDOMStats', () => {
    it('should have getShadowDOMStats method', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);
      expect(typeof extractor.getShadowDOMStats).toBe('function');
    });

    it('should return stats structure', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          totalElements: 100,
          shadowHosts: 5,
          openShadowRoots: 5,
          closedShadowRoots: 0,
          customElements: ['my-component', 'my-button']
        })
      };

      const result = await extractor.getShadowDOMStats(mockPage as any);

      expect(result).toHaveProperty('totalElements');
      expect(result).toHaveProperty('shadowHosts');
      expect(result).toHaveProperty('openShadowRoots');
      expect(result).toHaveProperty('closedShadowRoots');
      expect(result).toHaveProperty('customElements');
    });

    it('should return numeric values for element counts', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          totalElements: 200,
          shadowHosts: 10,
          openShadowRoots: 8,
          closedShadowRoots: 2,
          customElements: ['lit-element', 'stencil-component']
        })
      };

      const result = await extractor.getShadowDOMStats(mockPage as any);

      expect(typeof result.totalElements).toBe('number');
      expect(typeof result.shadowHosts).toBe('number');
      expect(typeof result.openShadowRoots).toBe('number');
      expect(typeof result.closedShadowRoots).toBe('number');
      expect(result.totalElements).toBe(200);
      expect(result.shadowHosts).toBe(10);
    });

    it('should return array for customElements', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          totalElements: 50,
          shadowHosts: 3,
          openShadowRoots: 3,
          closedShadowRoots: 0,
          customElements: ['my-card', 'my-header', 'my-footer']
        })
      };

      const result = await extractor.getShadowDOMStats(mockPage as any);

      expect(Array.isArray(result.customElements)).toBe(true);
      expect(result.customElements.length).toBe(3);
      expect(result.customElements).toContain('my-card');
    });

    it('should handle zero shadow hosts', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue({
          totalElements: 75,
          shadowHosts: 0,
          openShadowRoots: 0,
          closedShadowRoots: 0,
          customElements: []
        })
      };

      const result = await extractor.getShadowDOMStats(mockPage as any);

      expect(result.shadowHosts).toBe(0);
      expect(result.customElements).toEqual([]);
    });
  });

  describe('extraction result interfaces', () => {
    it('should return ExtractedContent structure', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = false;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html></html>'),
        evaluate: vi.fn()
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(result).toHaveProperty('lightDOM');
      expect(result).toHaveProperty('shadowDOMs');
      expect(result).toHaveProperty('flattened');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('warnings');
    });

    it('should return proper stats structure', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = false;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html></html>'),
        evaluate: vi.fn()
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(result.stats).toHaveProperty('totalShadowRoots');
      expect(result.stats).toHaveProperty('extractedElements');
      expect(result.stats).toHaveProperty('cssVariables');
      expect(result.stats).toHaveProperty('nestedDepth');
      expect(result.stats).toHaveProperty('extractionTime');
    });

    it('should return shadowDOMs as array', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = false;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html></html>'),
        evaluate: vi.fn()
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(Array.isArray(result.shadowDOMs)).toBe(true);
    });

    it('should return warnings as array', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = false;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html></html>'),
        evaluate: vi.fn()
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('shadow DOM content structure', () => {
    it('should return shadow DOM with all properties', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = true;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html></html>'),
        evaluate: vi.fn().mockResolvedValue({
          lightDOM: '<html><body><my-elem></my-elem></body></html>',
          shadowDOMs: [{
            host: 'my-elem',
            hostSelector: 'body > my-elem',
            content: '<div>Inner</div>',
            slots: [{ name: 'default', content: 'Slot content' }],
            cssVariables: { '--color': 'red' },
            styles: '.inner { color: red; }'
          }],
          flattened: '<html><body><div>Inner</div></body></html>',
          extractedElements: 1,
          cssVariables: ['--color'],
          maxDepth: 1,
          warnings: []
        })
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(result.shadowDOMs[0]).toHaveProperty('host');
      expect(result.shadowDOMs[0]).toHaveProperty('hostSelector');
      expect(result.shadowDOMs[0]).toHaveProperty('content');
      expect(result.shadowDOMs[0]).toHaveProperty('slots');
      expect(result.shadowDOMs[0]).toHaveProperty('cssVariables');
      expect(result.shadowDOMs[0]).toHaveProperty('styles');
    });

    it('should extract nested shadow DOMs', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();
      config.enabled = true;
      const extractor = new module.ShadowDOMExtractor(config);

      const mockPage = {
        content: vi.fn().mockResolvedValue('<html></html>'),
        evaluate: vi.fn().mockResolvedValue({
          lightDOM: '<html><body><outer-elem></outer-elem></body></html>',
          shadowDOMs: [
            { host: 'outer-elem', hostSelector: 'body > outer-elem', content: '<inner-elem></inner-elem>', slots: [], cssVariables: {}, styles: '' },
            { host: 'inner-elem', hostSelector: 'body > outer-elem > inner-elem', content: '<span>Deep</span>', slots: [], cssVariables: {}, styles: '' }
          ],
          flattened: '<html><body><span>Deep</span></body></html>',
          extractedElements: 2,
          cssVariables: [],
          maxDepth: 2,
          warnings: []
        })
      };

      const result = await extractor.extractCompleteContent(mockPage as any);

      expect(result.shadowDOMs.length).toBe(2);
      expect(result.stats.nestedDepth).toBe(2);
    });
  });

  describe('config interface validation', () => {
    it('should have ShadowDOMConfig structure', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = module.ShadowDOMExtractor.getDefaultConfig();

      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('deepSerialization');
      expect(config).toHaveProperty('includeShadowContent');
      expect(config).toHaveProperty('flattenShadowTrees');
      expect(config).toHaveProperty('customElements');
      expect(config).toHaveProperty('preserveShadowBoundaries');
      expect(config).toHaveProperty('extractCSSVariables');
      expect(config).toHaveProperty('extractComputedStyles');
    });

    it('should accept custom configuration', async () => {
      const module = await import('../../src/admin/shadow-dom-extractor');
      const config = {
        enabled: false,
        deepSerialization: false,
        includeShadowContent: false,
        flattenShadowTrees: false,
        customElements: {},
        preserveShadowBoundaries: true,
        extractCSSVariables: false,
        extractComputedStyles: true
      };
      const extractor = new module.ShadowDOMExtractor(config);
      expect(extractor).toBeDefined();
    });
  });
});
