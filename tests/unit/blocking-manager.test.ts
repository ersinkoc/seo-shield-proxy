import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../src/admin/config-manager', () => ({
  default: {
    getConfig: vi.fn(() => ({ blockingRules: [] })),
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

describe('BlockingManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('module import', () => {
    it('should import BlockingManager', async () => {
      const module = await import('../../src/admin/blocking-manager');
      expect(module.default).toBeDefined();
    });
  });

  describe('methods existence', () => {
    it('should have getRules method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.getRules).toBe('function');
    });

    it('should have createRule method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.createRule).toBe('function');
    });

    it('should have updateRule method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.updateRule).toBe('function');
    });

    it('should have deleteRule method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.deleteRule).toBe('function');
    });

    it('should have shouldBlockRequest method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.shouldBlockRequest).toBe('function');
    });

    it('should have toggleRule method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.toggleRule).toBe('function');
    });

    it('should have getRule method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.getRule).toBe('function');
    });

    it('should have testBlocking method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.testBlocking).toBe('function');
    });

    it('should have getTestHistory method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.getTestHistory).toBe('function');
    });

    it('should have getStats method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.getStats).toBe('function');
    });

    it('should have clearStats method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.clearStats).toBe('function');
    });

    it('should have exportRules method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.exportRules).toBe('function');
    });

    it('should have importRules method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.importRules).toBe('function');
    });

    it('should have getRuleTemplates method', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      expect(typeof manager.getRuleTemplates).toBe('function');
    });
  });

  describe('getRules', () => {
    it('should return empty rules initially', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      const rules = manager.getRules();
      expect(Array.isArray(rules)).toBe(true);
    });
  });

  describe('shouldBlockRequest', () => {
    it('should return blocked false for non-matching URL', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      const result = manager.shouldBlockRequest('http://example.com/test', 'document');
      expect(result).toBeDefined();
      expect(result.blocked).toBe(false);
    });

    it('should handle missing resource type', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;
      const result = manager.shouldBlockRequest('http://example.com/test');
      expect(result).toBeDefined();
      expect(typeof result.blocked).toBe('boolean');
    });
  });

  describe('createRule', () => {
    it('should create a new rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const rule = await manager.createRule({
        name: 'Test Rule',
        description: 'Test description',
        enabled: true,
        type: 'domain',
        pattern: 'google-analytics.com',
        action: 'block',
        priority: 50,
      });

      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Test Rule');
      expect(rule.createdAt).toBeDefined();
    });
  });

  describe('updateRule', () => {
    it('should return null for non-existent rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const result = await manager.updateRule('non-existent-id', { enabled: false });
      expect(result).toBeNull();
    });

    it('should update an existing rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const rule = await manager.createRule({
        name: 'Update Test',
        enabled: true,
        type: 'url',
        pattern: '/test',
        action: 'block',
        priority: 30,
      });

      const updated = await manager.updateRule(rule.id, { enabled: false });
      expect(updated).toBeDefined();
      expect(updated?.enabled).toBe(false);
    });
  });

  describe('deleteRule', () => {
    it('should return false for non-existent rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const result = await manager.deleteRule('non-existent-id');
      expect(result).toBe(false);
    });

    it('should delete an existing rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const rule = await manager.createRule({
        name: 'Delete Test',
        enabled: true,
        type: 'url',
        pattern: '/delete',
        action: 'block',
        priority: 30,
      });

      const result = await manager.deleteRule(rule.id);
      expect(result).toBe(true);
    });
  });

  describe('toggleRule', () => {
    it('should return false for non-existent rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const result = await manager.toggleRule('non-existent-id');
      expect(result).toBe(false);
    });

    it('should toggle an existing rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const rule = await manager.createRule({
        name: 'Toggle Test',
        enabled: true,
        type: 'url',
        pattern: '/toggle',
        action: 'block',
        priority: 30,
      });

      const result = await manager.toggleRule(rule.id);
      expect(result).toBe(true);
    });
  });

  describe('getRule', () => {
    it('should return null for non-existent rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const result = manager.getRule('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return existing rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const rule = await manager.createRule({
        name: 'Get Test',
        enabled: true,
        type: 'url',
        pattern: '/get',
        action: 'block',
        priority: 30,
      });

      const result = manager.getRule(rule.id);
      expect(result).toBeDefined();
      expect(result?.name).toBe('Get Test');
    });
  });

  describe('testBlocking', () => {
    it('should test blocking for a URL', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const result = await manager.testBlocking('http://example.com/test', 'Mozilla/5.0');
      expect(result).toBeDefined();
      expect(result.url).toBe('http://example.com/test');
      expect(result.results).toBeDefined();
      expect(typeof result.results.blocked).toBe('boolean');
      expect(typeof result.results.responseTime).toBe('number');
    });

    it('should test blocking with headers', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const result = await manager.testBlocking('http://example.com/test', 'Mozilla/5.0', { 'X-Test': 'value' });
      expect(result).toBeDefined();
      expect(result.headers).toEqual({ 'X-Test': 'value' });
    });
  });

  describe('getTestHistory', () => {
    it('should return test history', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      await manager.testBlocking('http://example.com/test1');
      await manager.testBlocking('http://example.com/test2');

      const history = manager.getTestHistory(10);
      expect(Array.isArray(history)).toBe(true);
    });

    it('should return limited history', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const history = manager.getTestHistory(5);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return blocking statistics', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const stats = manager.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalRules).toBe('number');
      expect(typeof stats.enabledRules).toBe('number');
      expect(typeof stats.totalBlocked).toBe('number');
      expect(typeof stats.todayBlocked).toBe('number');
      expect(Array.isArray(stats.topBlocked)).toBe(true);
      expect(stats.performanceImpact).toBeDefined();
    });
  });

  describe('clearStats', () => {
    it('should clear stats for all rules', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      await manager.clearStats();
      // Should not throw
      expect(true).toBe(true);
    });

    it('should clear stats for specific rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const rule = await manager.createRule({
        name: 'Stats Test',
        enabled: true,
        type: 'url',
        pattern: '/stats',
        action: 'block',
        priority: 30,
      });

      await manager.clearStats(rule.id);
      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle non-existent rule ID', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      await manager.clearStats('non-existent-id');
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('exportRules', () => {
    it('should export rules as JSON', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      await manager.createRule({
        name: 'Export Test',
        enabled: true,
        type: 'url',
        pattern: '/export',
        action: 'block',
        priority: 30,
      });

      const exported = manager.exportRules();
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('importRules', () => {
    it('should import rules from JSON', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const rulesJson = JSON.stringify([
        {
          name: 'Imported Rule',
          type: 'url',
          pattern: '/imported',
          action: 'block',
          priority: 40,
        }
      ]);

      const count = await manager.importRules(rulesJson);
      expect(count).toBe(1);
    });

    it('should throw on invalid JSON', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      await expect(manager.importRules('invalid json')).rejects.toThrow('Invalid JSON format');
    });
  });

  describe('getRuleTemplates', () => {
    it('should return rule templates', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const templates = manager.getRuleTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('type');
      expect(templates[0]).toHaveProperty('pattern');
      expect(templates[0]).toHaveProperty('action');
    });
  });

  describe('rule matching', () => {
    it('should block matching domain rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      await manager.createRule({
        name: 'Domain Block',
        enabled: true,
        type: 'domain',
        pattern: 'google-analytics.com',
        action: 'block',
        priority: 100,
      });

      const result = manager.shouldBlockRequest('https://google-analytics.com/collect', 'script');
      expect(result.blocked).toBe(true);
    });

    it('should block matching URL pattern rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      await manager.createRule({
        name: 'URL Block',
        enabled: true,
        type: 'url',
        pattern: '/api/track',
        action: 'block',
        priority: 100,
      });

      const result = manager.shouldBlockRequest('https://example.com/api/track', 'xhr');
      expect(result.blocked).toBe(true);
    });

    it('should block matching regex pattern rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      await manager.createRule({
        name: 'Pattern Block',
        enabled: true,
        type: 'pattern',
        pattern: '.*analytics.*',
        action: 'block',
        priority: 100,
      });

      const result = manager.shouldBlockRequest('https://example.com/analytics.js', 'script');
      expect(result.blocked).toBe(true);
    });

    it('should block matching resource type rule', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      await manager.createRule({
        name: 'Resource Block',
        enabled: true,
        type: 'resource',
        pattern: 'image',
        action: 'block',
        priority: 100,
      });

      const result = manager.shouldBlockRequest('https://example.com/image.png', 'image');
      expect(result.blocked).toBe(true);
    });

    it('should not block when rule is disabled', async () => {
      const module = await import('../../src/admin/blocking-manager');
      const manager = module.default;

      const rule = await manager.createRule({
        name: 'Disabled Rule',
        enabled: false,
        type: 'domain',
        pattern: 'disabled-domain.com',
        action: 'block',
        priority: 100,
      });

      const result = manager.shouldBlockRequest('https://disabled-domain.com/test', 'document');
      expect(result.blocked).toBe(false);
    });
  });
});
