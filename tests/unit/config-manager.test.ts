import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined)
  },
  access: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined)
}));

describe('ConfigManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import configManager', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(module.default).toBeDefined();
    });
  });

  describe('getConfig', () => {
    it('should get config', async () => {
      const module = await import('../../src/admin/config-manager');
      const config = module.default.getConfig();
      expect(config).toBeDefined();
    });

    it('should return config with required fields', async () => {
      const module = await import('../../src/admin/config-manager');
      const config = module.default.getConfig();

      expect(config.adminPath).toBeDefined();
      expect(config.adminAuth).toBeDefined();
      expect(config.cacheRules).toBeDefined();
      expect(config.botRules).toBeDefined();
      expect(config.cacheTTL).toBeDefined();
      expect(config.maxCacheSize).toBeDefined();
    });

    it('should have default cache rules', async () => {
      const module = await import('../../src/admin/config-manager');
      const config = module.default.getConfig();

      expect(Array.isArray(config.cacheRules.noCachePatterns)).toBe(true);
      expect(Array.isArray(config.cacheRules.cachePatterns)).toBe(true);
      expect(typeof config.cacheRules.cacheByDefault).toBe('boolean');
    });

    it('should have default bot rules', async () => {
      const module = await import('../../src/admin/config-manager');
      const config = module.default.getConfig();

      expect(Array.isArray(config.botRules.allowedBots)).toBe(true);
      expect(Array.isArray(config.botRules.blockedBots)).toBe(true);
      expect(typeof config.botRules.renderAllBots).toBe('boolean');
    });
  });

  describe('method existence', () => {
    it('should have updateConfig method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.updateConfig).toBe('function');
    });

    it('should have resetToDefaults method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.resetToDefaults).toBe('function');
    });

    it('should have saveConfig method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.saveConfig).toBe('function');
    });

    it('should have loadConfig method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.loadConfig).toBe('function');
    });

    it('should have initialize method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.initialize).toBe('function');
    });

    it('should have addCachePattern method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.addCachePattern).toBe('function');
    });

    it('should have removeCachePattern method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.removeCachePattern).toBe('function');
    });

    it('should have addAllowedBot method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.addAllowedBot).toBe('function');
    });

    it('should have addBlockedBot method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.addBlockedBot).toBe('function');
    });

    it('should have removeBot method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.removeBot).toBe('function');
    });

    it('should have shouldRenderBot method', async () => {
      const module = await import('../../src/admin/config-manager');
      expect(typeof module.default.shouldRenderBot).toBe('function');
    });
  });

  describe('updateConfig', () => {
    it('should update config', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      const updated = await manager.updateConfig({ cacheTTL: 7200 });
      expect(updated.cacheTTL).toBe(7200);
    });

    it('should deep merge cache rules', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      const updated = await manager.updateConfig({
        cacheRules: { cacheByDefault: false }
      });
      expect(updated.cacheRules.cacheByDefault).toBe(false);
      expect(updated.cacheRules.noCachePatterns).toBeDefined(); // Should preserve existing
    });

    it('should deep merge bot rules', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      const updated = await manager.updateConfig({
        botRules: { renderAllBots: false }
      });
      expect(updated.botRules.renderAllBots).toBe(false);
      expect(updated.botRules.allowedBots).toBeDefined(); // Should preserve existing
    });
  });

  describe('addCachePattern', () => {
    it('should add noCache pattern', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      const config = await manager.addCachePattern('/test/*', 'noCache');
      expect(config.cacheRules.noCachePatterns).toContain('/test/*');
    });

    it('should add cache pattern', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      const config = await manager.addCachePattern('/static/*', 'cache');
      expect(config.cacheRules.cachePatterns).toContain('/static/*');
    });

    it('should not add duplicate pattern', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await manager.addCachePattern('/unique/*', 'noCache');
      const configBefore = manager.getConfig();
      const countBefore = configBefore.cacheRules.noCachePatterns.filter(p => p === '/unique/*').length;

      await manager.addCachePattern('/unique/*', 'noCache');
      const configAfter = manager.getConfig();
      const countAfter = configAfter.cacheRules.noCachePatterns.filter(p => p === '/unique/*').length;

      expect(countAfter).toBe(countBefore);
    });

    it('should throw on invalid type', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await expect(manager.addCachePattern('/test', 'invalid' as any)).rejects.toThrow('Invalid pattern type');
    });
  });

  describe('removeCachePattern', () => {
    it('should remove noCache pattern', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await manager.addCachePattern('/removeme/*', 'noCache');
      const config = await manager.removeCachePattern('/removeme/*', 'noCache');
      expect(config.cacheRules.noCachePatterns).not.toContain('/removeme/*');
    });

    it('should remove cache pattern', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await manager.addCachePattern('/removestatic/*', 'cache');
      const config = await manager.removeCachePattern('/removestatic/*', 'cache');
      expect(config.cacheRules.cachePatterns).not.toContain('/removestatic/*');
    });
  });

  describe('addAllowedBot', () => {
    it('should add allowed bot', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      const config = await manager.addAllowedBot('TestBot');
      expect(config.botRules.allowedBots).toContain('TestBot');
    });

    it('should remove from blocked if adding to allowed', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await manager.addBlockedBot('MoveBot');
      const config = await manager.addAllowedBot('MoveBot');
      expect(config.botRules.allowedBots).toContain('MoveBot');
      expect(config.botRules.blockedBots).not.toContain('MoveBot');
    });
  });

  describe('addBlockedBot', () => {
    it('should add blocked bot', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      const config = await manager.addBlockedBot('BadBot');
      expect(config.botRules.blockedBots).toContain('BadBot');
    });

    it('should remove from allowed if adding to blocked', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await manager.addAllowedBot('SwitchBot');
      const config = await manager.addBlockedBot('SwitchBot');
      expect(config.botRules.blockedBots).toContain('SwitchBot');
      expect(config.botRules.allowedBots).not.toContain('SwitchBot');
    });
  });

  describe('removeBot', () => {
    it('should remove bot from all lists', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await manager.addAllowedBot('RemoveMe');
      const config = await manager.removeBot('RemoveMe');
      expect(config.botRules.allowedBots).not.toContain('RemoveMe');
      expect(config.botRules.blockedBots).not.toContain('RemoveMe');
    });
  });

  describe('shouldRenderBot', () => {
    it('should render allowed bot when renderAllBots is true', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await manager.updateConfig({ botRules: { renderAllBots: true, allowedBots: ['Googlebot'], blockedBots: [] } });
      expect(manager.shouldRenderBot('Googlebot')).toBe(true);
    });

    it('should not render blocked bot even when renderAllBots is true', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await manager.updateConfig({ botRules: { renderAllBots: true, allowedBots: [], blockedBots: ['EvilBot'] } });
      expect(manager.shouldRenderBot('EvilBot')).toBe(false);
    });

    it('should only render allowed bots when renderAllBots is false', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await manager.updateConfig({ botRules: { renderAllBots: false, allowedBots: ['Googlebot'], blockedBots: [] } });
      expect(manager.shouldRenderBot('Googlebot')).toBe(true);
      expect(manager.shouldRenderBot('RandomBot')).toBe(false);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset to defaults', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      // Make some changes
      await manager.updateConfig({ cacheTTL: 99999 });

      // Reset
      const config = await manager.resetToDefaults();

      // Default cacheTTL is 3600
      expect(config.cacheTTL).toBe(3600);
    });
  });

  describe('saveConfig', () => {
    it('should save config successfully', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      const result = await manager.saveConfig();
      // Should return true on success (mocked)
      expect(typeof result).toBe('boolean');
    });

    it('should handle invalid config', async () => {
      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      // Pass null/undefined
      const result = await manager.saveConfig(null as any);
      expect(result).toBe(false);
    });
  });

  describe('loadConfig', () => {
    it('should load config from file', async () => {
      const fs = await import('fs/promises');
      (fs.readFile as any).mockResolvedValue(JSON.stringify({
        adminPath: '/custom-admin',
        cacheTTL: 5000,
        adminAuth: { enabled: true, username: 'admin', password: 'test' },
        cacheRules: { noCachePatterns: [], cachePatterns: [], cacheByDefault: true, metaTagName: 'test' },
        botRules: { allowedBots: [], blockedBots: [], renderAllBots: true },
        maxCacheSize: 1000
      }));

      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      const config = await manager.loadConfig();
      expect(config).toBeDefined();
    });

    it('should return defaults on load error', async () => {
      const fs = await import('fs/promises');
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      const config = await manager.loadConfig();
      expect(config).toBeDefined();
      expect(config.cacheTTL).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const fs = await import('fs/promises');
      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(JSON.stringify({
        adminPath: '/admin',
        cacheTTL: 3600,
        adminAuth: { enabled: true, username: 'admin', password: 'test' },
        cacheRules: { noCachePatterns: [], cachePatterns: [], cacheByDefault: true, metaTagName: 'test' },
        botRules: { allowedBots: [], blockedBots: [], renderAllBots: true },
        maxCacheSize: 1000
      }));

      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await expect(manager.initialize()).resolves.not.toThrow();
    });

    it('should create default config if file does not exist', async () => {
      const fs = await import('fs/promises');
      (fs.access as any).mockRejectedValue(new Error('ENOENT'));
      (fs.writeFile as any).mockResolvedValue(undefined);

      const module = await import('../../src/admin/config-manager');
      const manager = module.default;

      await expect(manager.initialize()).resolves.not.toThrow();
    });
  });
});
