import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../src/cache', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('../../src/admin/config-manager', () => ({
  default: {
    getConfig: vi.fn(() => ({ hotfixRules: [] })),
    updateConfig: vi.fn().mockResolvedValue(undefined)
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

describe('HotfixEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('module import', () => {
    it('should import HotfixEngine', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      expect(module.default).toBeDefined();
    });
  });

  describe('methods existence', () => {
    it('should have getRules method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.getRules).toBe('function');
    });

    it('should have createRule method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.createRule).toBe('function');
    });

    it('should have updateRule method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.updateRule).toBe('function');
    });

    it('should have deleteRule method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.deleteRule).toBe('function');
    });

    it('should have applyHotfixes method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.applyHotfixes).toBe('function');
    });

    it('should have testHotfix method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.testHotfix).toBe('function');
    });

    it('should have getTestHistory method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.getTestHistory).toBe('function');
    });

    it('should have getRule method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.getRule).toBe('function');
    });

    it('should have toggleRule method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.toggleRule).toBe('function');
    });

    it('should have getStats method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.getStats).toBe('function');
    });
  });

  describe('getRules', () => {
    it('should return empty rules initially', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      const rules = engine.getRules();
      expect(Array.isArray(rules)).toBe(true);
    });
  });

  describe('applyHotfixes', () => {
    it('should apply hotfixes to HTML', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      const result = await engine.applyHotfixes('<html><head></head><body></body></html>', 'http://test.com');
      expect(result).toBeDefined();
      expect(result.html).toBeDefined();
      expect(typeof result.applied).toBe('boolean');
      expect(typeof result.processingTime).toBe('number');
      expect(Array.isArray(result.matchedRules)).toBe(true);
    });

    it('should apply hotfixes with headers', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      const result = await engine.applyHotfixes(
        '<html><head></head><body></body></html>',
        'http://test.com',
        { 'user-agent': 'Mozilla/5.0' }
      );
      expect(result).toBeDefined();
    });
  });

  describe('createRule', () => {
    it('should create a new rule', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const rule = await engine.createRule({
        name: 'Test Rule',
        description: 'Test description',
        enabled: true,
        priority: 50,
        urlPattern: '.*test.*',
        conditions: {},
        actions: [
          { type: 'replace', selector: 'old', value: 'new' }
        ]
      });

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Test Rule');
      expect(rule.createdAt).toBeDefined();
      expect(rule.updatedAt).toBeDefined();
    });
  });

  describe('updateRule', () => {
    it('should return null for non-existent rule', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const result = await engine.updateRule('non-existent', { enabled: false });
      expect(result).toBeNull();
    });

    it('should update an existing rule', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const rule = await engine.createRule({
        name: 'Update Test',
        enabled: true,
        priority: 30,
        urlPattern: '.*',
        conditions: {},
        actions: []
      });

      const updated = await engine.updateRule(rule.id, { enabled: false });
      expect(updated).toBeDefined();
      expect(updated?.enabled).toBe(false);
    });
  });

  describe('deleteRule', () => {
    it('should return false for non-existent rule', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const result = await engine.deleteRule('non-existent');
      expect(result).toBe(false);
    });

    it('should delete an existing rule', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const rule = await engine.createRule({
        name: 'Delete Test',
        enabled: true,
        priority: 30,
        urlPattern: '.*',
        conditions: {},
        actions: []
      });

      const result = await engine.deleteRule(rule.id);
      expect(result).toBe(true);
    });
  });

  describe('getRule', () => {
    it('should return null for non-existent rule', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const result = engine.getRule('non-existent');
      expect(result).toBeNull();
    });

    it('should return existing rule', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const rule = await engine.createRule({
        name: 'Get Test',
        enabled: true,
        priority: 30,
        urlPattern: '.*',
        conditions: {},
        actions: []
      });

      const result = engine.getRule(rule.id);
      expect(result).toBeDefined();
      expect(result?.name).toBe('Get Test');
    });
  });

  describe('toggleRule', () => {
    it('should return false for non-existent rule', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const result = await engine.toggleRule('non-existent');
      expect(result).toBe(false);
    });

    it('should toggle rule enabled state', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const rule = await engine.createRule({
        name: 'Toggle Test',
        enabled: true,
        priority: 30,
        urlPattern: '.*',
        conditions: {},
        actions: []
      });

      const result = await engine.toggleRule(rule.id);
      expect(result).toBe(true);
    });
  });

  describe('testHotfix', () => {
    it('should have testHotfix method', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;
      expect(typeof engine.testHotfix).toBe('function');
    });
  });

  describe('getTestHistory', () => {
    it('should return test history array', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const history = engine.getTestHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should return limited history', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const history = engine.getTestHistory(5);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return stats object', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      const stats = engine.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.enabled).toBe('number');
      expect(typeof stats.disabled).toBe('number');
      expect(typeof stats.expired).toBe('number');
    });
  });

  describe('action types', () => {
    it('should apply replace action with regex', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      await engine.createRule({
        name: 'Replace Regex',
        enabled: true,
        priority: 100,
        urlPattern: '.*',
        conditions: {},
        actions: [
          { type: 'replace', selector: 'old', value: 'new', regex: 'old', flags: 'g' }
        ]
      });

      const result = await engine.applyHotfixes('<html>old content old</html>', 'http://test.com');
      expect(result.html).toBe('<html>new content new</html>');
      expect(result.applied).toBe(true);
    });

    it('should apply prepend action', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      await engine.createRule({
        name: 'Prepend Test',
        enabled: true,
        priority: 100,
        urlPattern: '.*',
        conditions: {},
        actions: [
          { type: 'prepend', selector: 'head', value: '<meta name="test" content="value">' }
        ]
      });

      const result = await engine.applyHotfixes('<html><head></head><body></body></html>', 'http://test.com');
      expect(result.html).toContain('<meta name="test" content="value">');
      expect(result.applied).toBe(true);
    });

    it('should apply append action', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      await engine.createRule({
        name: 'Append Test',
        enabled: true,
        priority: 100,
        urlPattern: '.*',
        conditions: {},
        actions: [
          { type: 'append', selector: 'body', value: '<script>console.log("test")</script>' }
        ]
      });

      const result = await engine.applyHotfixes('<html><body>content</body></html>', 'http://test.com');
      expect(result.applied).toBe(true);
    });

    it('should apply remove action', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      await engine.createRule({
        name: 'Remove Test',
        enabled: true,
        priority: 100,
        urlPattern: '.*',
        conditions: {},
        actions: [
          { type: 'remove', selector: '<script[^>]*>.*?</script>', flags: 'gis' }
        ]
      });

      const result = await engine.applyHotfixes('<html><script>bad code</script></html>', 'http://test.com');
      expect(result.html).not.toContain('bad code');
      expect(result.applied).toBe(true);
    });

    it('should apply remove attribute action', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      await engine.createRule({
        name: 'Remove Attr Test',
        enabled: true,
        priority: 100,
        urlPattern: '.*',
        conditions: {},
        actions: [
          { type: 'remove', selector: 'img', target: 'loading' }
        ]
      });

      const result = await engine.applyHotfixes('<img loading="lazy" src="test.jpg">', 'http://test.com');
      expect(result.html).not.toContain('loading=');
      expect(result.applied).toBe(true);
    });

    it('should apply attribute action', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      await engine.createRule({
        name: 'Attribute Test',
        enabled: true,
        priority: 100,
        urlPattern: '.*',
        conditions: {},
        actions: [
          { type: 'attribute', selector: 'img', target: 'alt', value: 'test alt' }
        ]
      });

      const result = await engine.applyHotfixes('<img src="test.jpg">', 'http://test.com');
      expect(result.html).toContain('alt="test alt"');
      expect(result.applied).toBe(true);
    });
  });

  describe('rule conditions', () => {
    it('should match user agent condition', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      await engine.createRule({
        name: 'UA Condition',
        enabled: true,
        priority: 100,
        urlPattern: '.*',
        conditions: { userAgent: 'Googlebot' },
        actions: [
          { type: 'replace', selector: 'test', value: 'replaced' }
        ]
      });

      const result = await engine.applyHotfixes(
        '<html>test</html>',
        'http://test.com',
        { 'user-agent': 'Googlebot/2.1' }
      );
      expect(result.html).toBe('<html>replaced</html>');
    });

    it('should match header conditions', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      await engine.createRule({
        name: 'Header Condition',
        enabled: true,
        priority: 100,
        urlPattern: '.*',
        conditions: { headers: { 'x-custom-header': 'value' } },
        actions: [
          { type: 'replace', selector: 'test', value: 'replaced' }
        ]
      });

      const result = await engine.applyHotfixes(
        '<html>test</html>',
        'http://test.com',
        { 'x-custom-header': 'value' }
      );
      expect(result.html).toBe('<html>replaced</html>');
    });

    it('should not match when header condition fails', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      await engine.createRule({
        name: 'Header Fail',
        enabled: true,
        priority: 100,
        urlPattern: '.*',
        conditions: { headers: { 'x-custom-header': 'expected' } },
        actions: [
          { type: 'replace', selector: 'test', value: 'replaced' }
        ]
      });

      const result = await engine.applyHotfixes(
        '<html>test</html>',
        'http://test.com',
        { 'x-custom-header': 'different' }
      );
      expect(result.html).toBe('<html>test</html>');
    });
  });

  describe('disabled rules', () => {
    it('should not apply disabled rules', async () => {
      const module = await import('../../src/admin/hotfix-engine');
      const engine = module.default;

      await engine.createRule({
        name: 'Disabled Rule',
        enabled: false,
        priority: 100,
        urlPattern: '.*',
        conditions: {},
        actions: [
          { type: 'replace', selector: 'test', value: 'replaced' }
        ]
      });

      const result = await engine.applyHotfixes('<html>test</html>', 'http://test.com');
      expect(result.html).toBe('<html>test</html>');
      expect(result.applied).toBe(false);
    });
  });
});
