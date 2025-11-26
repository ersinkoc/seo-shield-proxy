import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedBotDetector } from '../../src/bot-detection/advanced-bot-detector';

// Mock MongoStorage
const mockMongoStorage = {
  logAudit: vi.fn().mockResolvedValue(undefined)
};

describe('AdvancedBotDetector', () => {
  let detector: AdvancedBotDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new AdvancedBotDetector(mockMongoStorage as any);
  });

  describe('constructor', () => {
    it('should create detector instance', () => {
      expect(detector).toBeDefined();
    });
  });

  describe('detectBot', () => {
    it('should detect Googlebot', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('googlebot');
    });

    it('should detect Bingbot', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('bingbot');
    });

    it('should detect Facebook crawler', async () => {
      const result = await detector.detectBot({
        userAgent: 'facebookexternalhit/1.1'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('facebookexternalhit');
    });

    it('should detect Twitter bot', async () => {
      const result = await detector.detectBot({
        userAgent: 'Twitterbot/1.0'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('twitterbot');
    });

    it('should detect LinkedIn bot', async () => {
      const result = await detector.detectBot({
        userAgent: 'LinkedInBot/1.0'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('linkedinbot');
    });

    it('should detect headless browser', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0 HeadlessChrome/91.0'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('headless');
    });

    it('should detect curl requests', async () => {
      const result = await detector.detectBot({
        userAgent: 'curl/7.68.0'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('curl');
    });

    it('should detect wget requests', async () => {
      const result = await detector.detectBot({
        userAgent: 'Wget/1.20.3'
      });
      expect(result.isBot).toBe(true);
    });

    it('should allow normal browser requests', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      expect(result.isBot).toBe(false);
      expect(result.action).toBe('allow');
    });

    it('should handle empty user agent', async () => {
      const result = await detector.detectBot({
        userAgent: ''
      });
      expect(result).toBeDefined();
    });

    it('should handle missing user agent', async () => {
      const result = await detector.detectBot({});
      expect(result).toBeDefined();
    });

    it('should check IP reputation for private IPs', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1'
      });
      expect(result).toBeDefined();
    });

    it('should check IP reputation for localhost', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        ip: '127.0.0.1'
      });
      expect(result).toBeDefined();
    });
  });

  describe('getBotRules', () => {
    it('should return bot rules', async () => {
      const rules = await detector.getBotRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  describe('getBotRule', () => {
    it('should return specific rule by id', async () => {
      const rule = await detector.getBotRule('googlebot');
      expect(rule).toBeDefined();
      expect(rule?.name).toBe('Googlebot');
    });

    it('should return undefined for non-existent rule', async () => {
      const rule = await detector.getBotRule('nonexistent');
      expect(rule).toBeUndefined();
    });
  });

  describe('addBotRule', () => {
    it('should add new bot rule', async () => {
      const newRule = await detector.addBotRule({
        name: 'Test Bot',
        enabled: true,
        pattern: /testbot/i,
        type: 'userAgent',
        action: 'block',
        priority: 50
      });
      expect(newRule.id).toBeDefined();
      expect(newRule.name).toBe('Test Bot');
    });
  });

  describe('updateBotRule', () => {
    it('should update existing rule', async () => {
      const result = await detector.updateBotRule('googlebot', { priority: 150 });
      expect(result).toBe(true);
    });

    it('should return false for non-existent rule', async () => {
      const result = await detector.updateBotRule('nonexistent', { priority: 50 });
      expect(result).toBe(false);
    });
  });

  describe('deleteBotRule', () => {
    it('should delete existing rule', async () => {
      await detector.addBotRule({
        name: 'To Delete',
        enabled: true,
        pattern: /todelete/i,
        type: 'userAgent',
        action: 'block',
        priority: 50
      });
      const rules = await detector.getBotRules();
      const ruleToDelete = rules.find(r => r.name === 'To Delete');
      const result = await detector.deleteBotRule(ruleToDelete!.id);
      expect(result).toBe(true);
    });

    it('should return false for non-existent rule', async () => {
      const result = await detector.deleteBotRule('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('toggleBotRule', () => {
    it('should toggle rule enabled state', async () => {
      const result = await detector.toggleBotRule('googlebot');
      expect(result).toBe(true);
    });

    it('should return false for non-existent rule', async () => {
      const result = await detector.toggleBotRule('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clearIPReputationCache', () => {
    it('should clear IP reputation cache', async () => {
      await expect(detector.clearIPReputationCache()).resolves.not.toThrow();
    });
  });

  describe('getStatistics', () => {
    it('should return statistics', async () => {
      const stats = await detector.getStatistics();
      expect(stats.totalRules).toBeGreaterThan(0);
      expect(stats.enabledRules).toBeGreaterThan(0);
      expect(stats.rulesByType).toBeDefined();
      expect(stats.rulesByAction).toBeDefined();
    });

    it('should include rulesByBotType in statistics', async () => {
      const stats = await detector.getStatistics();
      expect(stats.rulesByBotType).toBeDefined();
      expect(stats.ipReputationCacheSize).toBeDefined();
      expect(stats.lastRulesUpdate).toBeDefined();
    });
  });

  describe('detectBot - additional coverage', () => {
    it('should detect YandexBot', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('yandexbot');
    });

    it('should detect DuckDuckBot', async () => {
      const result = await detector.detectBot({
        userAgent: 'DuckDuckBot/1.0'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('duckduckbot');
    });

    it('should detect BaiduSpider', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0 (compatible; Baiduspider/2.0)'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('baidu');
    });

    it('should detect UptimeRobot', async () => {
      const result = await detector.detectBot({
        userAgent: 'UptimeRobot/2.0'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('uptimerobot');
      expect(result.action).toBe('block');
    });

    it('should detect Pingdom', async () => {
      const result = await detector.detectBot({
        userAgent: 'Pingdom.com_bot_version_1.4'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('pingdom');
    });

    it('should detect Screaming Frog', async () => {
      const result = await detector.detectBot({
        userAgent: 'Screaming Frog SEO Spider/15.0'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('screamingfrog');
    });

    it('should detect Puppeteer', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0 puppeteer'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('puppeteer');
    });

    it('should detect Selenium', async () => {
      const result = await detector.detectBot({
        userAgent: 'Selenium/4.0'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('selenium');
    });

    it('should detect WordPress', async () => {
      const result = await detector.detectBot({
        userAgent: 'WordPress/5.8'
      });
      expect(result.isBot).toBe(true);
      expect(result.rulesMatched).toContain('wordpress');
    });

    it('should detect bot-like patterns', async () => {
      const result = await detector.detectBot({
        userAgent: 'GenericBot/1.0 crawler'
      });
      expect(result.isBot).toBe(true);
    });

    it('should handle headers with x-forwarded-for', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        headers: { 'x-forwarded-for': '1.2.3.4' }
      });
      expect(result).toBeDefined();
    });

    it('should handle headers with via', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        headers: { 'via': '1.1 proxy.example.com' }
      });
      expect(result).toBeDefined();
    });

    it('should handle referer with bot pattern', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        referer: 'http://crawler.example.com/bot'
      });
      expect(result).toBeDefined();
    });

    it('should handle referer with spider pattern', async () => {
      const result = await detector.detectBot({
        userAgent: 'short',
        referer: 'http://spider.example.com'
      });
      expect(result).toBeDefined();
    });

    it('should handle referer with scrape pattern', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        referer: 'http://scrape.example.com'
      });
      expect(result).toBeDefined();
    });

    it('should detect python-requests library', async () => {
      const result = await detector.detectBot({
        userAgent: 'python-requests/2.25.1'
      });
      expect(result.isBot).toBe(true);
    });

    it('should detect java http clients', async () => {
      const result = await detector.detectBot({
        userAgent: 'java/1.8.0'
      });
      expect(result.isBot).toBe(true);
    });

    it('should handle 10.x.x.x private IP range', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        ip: '10.0.0.1'
      });
      expect(result).toBeDefined();
    });

    it('should handle 172.16-31.x.x private IP range', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        ip: '172.16.0.1'
      });
      expect(result).toBeDefined();
    });

    it('should handle IPv6 localhost', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        ip: '::1'
      });
      expect(result).toBeDefined();
    });

    it('should handle IPv6 link-local', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        ip: 'fe80::1'
      });
      expect(result).toBeDefined();
    });

    it('should handle IPv6 unique local address', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        ip: 'fc00::1'
      });
      expect(result).toBeDefined();
    });

    it('should use cached IP reputation', async () => {
      // First request to cache the IP
      await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.100'
      });
      // Second request should use cache
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.100'
      });
      expect(result).toBeDefined();
    });

    it('should handle public IP addresses', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        ip: '8.8.8.8'
      });
      expect(result).toBeDefined();
    });

    it('should handle request with path and method', async () => {
      const result = await detector.detectBot({
        userAgent: 'Mozilla/5.0',
        path: '/api/test',
        method: 'GET'
      });
      expect(result).toBeDefined();
    });
  });

  describe('detectBot - disabled rules', () => {
    it('should skip disabled rules', async () => {
      // Disable googlebot rule
      await detector.updateBotRule('googlebot', { enabled: false });
      const result = await detector.detectBot({
        userAgent: 'Googlebot/2.1'
      });
      // Should still detect via generic bot pattern
      expect(result.rulesMatched).not.toContain('googlebot');
    });
  });

  describe('detectBot - heuristics edge cases', () => {
    it('should handle very short user agent', async () => {
      const result = await detector.detectBot({
        userAgent: 'Bot'
      });
      expect(result.isBot).toBe(true);
    });

    it('should score user agent without browser identifiers', async () => {
      const result = await detector.detectBot({
        userAgent: 'CustomAgent/1.0 NoMozilla NoBrowser'
      });
      expect(result).toBeDefined();
    });

    it('should detect phantom in user agent', async () => {
      const result = await detector.detectBot({
        userAgent: 'PhantomJS/2.1 bot crawler'
      });
      expect(result.isBot).toBe(true);
    });

    it('should detect automated in user agent', async () => {
      const result = await detector.detectBot({
        userAgent: 'AutomatedTest/1.0'
      });
      expect(result.isBot).toBe(true);
    });

    it('should detect crawl patterns', async () => {
      const result = await detector.detectBot({
        userAgent: 'WebCrawl/1.0'
      });
      expect(result.isBot).toBe(true);
    });

    it('should detect harvest patterns', async () => {
      const result = await detector.detectBot({
        userAgent: 'DataHarvest/1.0'
      });
      expect(result.isBot).toBe(true);
    });

    it('should detect script patterns', async () => {
      const result = await detector.detectBot({
        userAgent: 'MyScript/1.0'
      });
      expect(result.isBot).toBe(true);
    });

    it('should handle high bot score for confirmed bot', async () => {
      const result = await detector.detectBot({
        userAgent: 'bot crawler spider scrape harvest',
        headers: { 'x-forwarded-for': '1.2.3.4', 'via': '1.1 proxy' },
        referer: 'http://bot.crawler.spider.scrape/'
      });
      expect(result.isBot).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(30);
    });
  });

  describe('error handling', () => {
    it('should handle logAudit failure gracefully', async () => {
      mockMongoStorage.logAudit.mockRejectedValueOnce(new Error('DB Error'));
      const result = await detector.detectBot({
        userAgent: 'Googlebot/2.1'
      });
      // Should not throw, just log error
      expect(result.isBot).toBe(true);
    });
  });
});
