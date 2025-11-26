import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MetricsCollector', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should import MetricsCollector', async () => {
    const module = await import('../../src/admin/metrics-collector');
    expect(module.default).toBeDefined();
  });

  it('should record a request', async () => {
    const module = await import('../../src/admin/metrics-collector');
    const collector = module.default;
    collector.reset();

    expect(() => {
      collector.recordRequest({
        path: '/test',
        userAgent: 'Mozilla/5.0',
        isBot: false,
        action: 'proxy',
        cacheStatus: null
      });
    }).not.toThrow();
  });

  it('should get stats', async () => {
    const module = await import('../../src/admin/metrics-collector');
    const collector = module.default;
    collector.reset();
    const stats = collector.getStats();

    expect(stats).toBeDefined();
    expect(typeof stats.totalRequests).toBe('number');
    expect(typeof stats.botRequests).toBe('number');
    expect(typeof stats.humanRequests).toBe('number');
    expect(typeof stats.uptime).toBe('number');
    expect(stats.cacheHitRate).toBeDefined();
    expect(stats.requestsPerSecond).toBeDefined();
  });

  it('should get bot stats', async () => {
    const module = await import('../../src/admin/metrics-collector');
    const collector = module.default;
    const botStats = collector.getBotStats();

    expect(botStats).toBeDefined();
  });

  it('should get URL stats', async () => {
    const module = await import('../../src/admin/metrics-collector');
    const collector = module.default;
    const urlStats = collector.getUrlStats();

    expect(urlStats).toBeDefined();
    expect(Array.isArray(urlStats)).toBe(true);
  });

  it('should get URL stats with custom limit', async () => {
    const module = await import('../../src/admin/metrics-collector');
    const collector = module.default;
    const urlStats = collector.getUrlStats(10);

    expect(urlStats).toBeDefined();
    expect(Array.isArray(urlStats)).toBe(true);
  });

  it('should reset stats', async () => {
    const module = await import('../../src/admin/metrics-collector');
    const collector = module.default;

    collector.recordRequest({
      path: '/test',
      userAgent: 'Mozilla/5.0',
      isBot: false,
      action: 'proxy',
      cacheStatus: null
    });

    collector.reset();
    const stats = collector.getStats();
    expect(stats.totalRequests).toBe(0);
  });

  it('should handle bot request recording', async () => {
    const module = await import('../../src/admin/metrics-collector');
    const collector = module.default;
    collector.reset();

    collector.recordRequest({
      path: '/bot-test',
      userAgent: 'Googlebot/2.1',
      isBot: true,
      action: 'ssr',
      cacheStatus: 'MISS'
    });

    const stats = collector.getStats();
    expect(stats.botRequests).toBeGreaterThan(0);
    expect(stats.ssrRendered).toBeGreaterThan(0);
    expect(stats.cacheMisses).toBeGreaterThan(0);
  });

  it('should handle cache hit recording', async () => {
    const module = await import('../../src/admin/metrics-collector');
    const collector = module.default;
    collector.reset();

    collector.recordRequest({
      path: '/cached',
      userAgent: 'Mozilla/5.0',
      isBot: true,
      action: 'ssr',
      cacheStatus: 'HIT'
    });

    const stats = collector.getStats();
    expect(stats.cacheHits).toBeGreaterThan(0);
  });

  describe('bot type detection', () => {
    it('should detect Googlebot', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/google',
        userAgent: 'Googlebot/2.1',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['Googlebot']).toBeGreaterThan(0);
    });

    it('should detect Bingbot', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/bing',
        userAgent: 'bingbot/2.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['Bingbot']).toBeGreaterThan(0);
    });

    it('should detect Twitterbot', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/twitter',
        userAgent: 'Twitterbot/1.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['Twitterbot']).toBeGreaterThan(0);
    });

    it('should detect Facebook', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/facebook',
        userAgent: 'facebookexternalhit/1.1',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['Facebook']).toBeGreaterThan(0);
    });

    it('should detect LinkedIn', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/linkedin',
        userAgent: 'LinkedInBot/1.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['LinkedIn']).toBeGreaterThan(0);
    });

    it('should detect Slack', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/slack',
        userAgent: 'Slackbot 1.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['Slack']).toBeGreaterThan(0);
    });

    it('should detect Telegram', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/telegram',
        userAgent: 'telegrambot/1.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['Telegram']).toBeGreaterThan(0);
    });

    it('should detect WhatsApp', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/whatsapp',
        userAgent: 'WhatsApp/2.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['WhatsApp']).toBeGreaterThan(0);
    });

    it('should detect Discord', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/discord',
        userAgent: 'Discordbot/2.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['Discord']).toBeGreaterThan(0);
    });

    it('should detect Baidu', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/baidu',
        userAgent: 'Baiduspider/2.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['Baidu']).toBeGreaterThan(0);
    });

    it('should detect Yandex', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/yandex',
        userAgent: 'YandexBot/3.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['Yandex']).toBeGreaterThan(0);
    });

    it('should detect DuckDuckGo', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/duckduckgo',
        userAgent: 'DuckDuckBot/1.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['DuckDuckGo']).toBeGreaterThan(0);
    });

    it('should categorize unknown bots as Other Bots', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/unknown',
        userAgent: 'UnknownBot/1.0',
        isBot: true,
        action: 'ssr',
        cacheStatus: null
      });

      const botStats = collector.getBotStats();
      expect(botStats['Other Bots']).toBeGreaterThan(0);
    });
  });

  describe('action types', () => {
    it('should record proxy action', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/proxy',
        userAgent: 'Mozilla/5.0',
        isBot: false,
        action: 'proxy',
        cacheStatus: null
      });

      const stats = collector.getStats();
      expect(stats.proxiedDirect).toBeGreaterThan(0);
    });

    it('should record static action', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/static/file.js',
        userAgent: 'Mozilla/5.0',
        isBot: false,
        action: 'static',
        cacheStatus: null
      });

      const stats = collector.getStats();
      expect(stats.staticAssets).toBeGreaterThan(0);
    });

    it('should record bypass action', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/api/data',
        userAgent: 'Mozilla/5.0',
        isBot: false,
        action: 'bypass',
        cacheStatus: null
      });

      const stats = collector.getStats();
      expect(stats.bypassedByRules).toBeGreaterThan(0);
    });

    it('should record error', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/error',
        userAgent: 'Mozilla/5.0',
        isBot: false,
        action: 'error',
        cacheStatus: null,
        error: 'Something went wrong'
      });

      const stats = collector.getStats();
      expect(stats.errors).toBeGreaterThan(0);
    });
  });

  describe('traffic timeline', () => {
    it('should get traffic timeline', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/timeline',
        userAgent: 'Mozilla/5.0',
        isBot: false,
        action: 'proxy',
        cacheStatus: null
      });

      const timeline = collector.getTrafficTimeline(5);
      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline)).toBe(true);
      expect(timeline.length).toBe(5);
      expect(timeline[timeline.length - 1]).toHaveProperty('timestamp');
      expect(timeline[timeline.length - 1]).toHaveProperty('total');
      expect(timeline[timeline.length - 1]).toHaveProperty('bots');
      expect(timeline[timeline.length - 1]).toHaveProperty('humans');
      expect(timeline[timeline.length - 1]).toHaveProperty('cacheHits');
      expect(timeline[timeline.length - 1]).toHaveProperty('cacheMisses');
    });

    it('should get default 60 minute timeline', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;

      const timeline = collector.getTrafficTimeline();
      expect(timeline.length).toBe(60);
    });
  });

  describe('recent traffic', () => {
    it('should get recent traffic', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/recent1',
        userAgent: 'Mozilla/5.0',
        isBot: false,
        action: 'proxy',
        cacheStatus: null
      });

      collector.recordRequest({
        path: '/recent2',
        userAgent: 'Mozilla/5.0',
        isBot: false,
        action: 'proxy',
        cacheStatus: null
      });

      const traffic = collector.getRecentTraffic(10);
      expect(traffic).toBeDefined();
      expect(Array.isArray(traffic)).toBe(true);
      expect(traffic.length).toBe(2);
      // Most recent first
      expect(traffic[0].path).toBe('/recent2');
    });

    it('should get default limit of recent traffic', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;

      const traffic = collector.getRecentTraffic();
      expect(traffic).toBeDefined();
      expect(Array.isArray(traffic)).toBe(true);
    });
  });

  describe('cache hit rate', () => {
    it('should calculate cache hit rate correctly', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      // 3 hits, 2 misses = 60% hit rate
      collector.recordRequest({ path: '/1', userAgent: 'bot', isBot: true, action: 'ssr', cacheStatus: 'HIT' });
      collector.recordRequest({ path: '/2', userAgent: 'bot', isBot: true, action: 'ssr', cacheStatus: 'HIT' });
      collector.recordRequest({ path: '/3', userAgent: 'bot', isBot: true, action: 'ssr', cacheStatus: 'HIT' });
      collector.recordRequest({ path: '/4', userAgent: 'bot', isBot: true, action: 'ssr', cacheStatus: 'MISS' });
      collector.recordRequest({ path: '/5', userAgent: 'bot', isBot: true, action: 'ssr', cacheStatus: 'MISS' });

      const stats = collector.getStats();
      expect(parseFloat(stats.cacheHitRate)).toBe(60);
    });

    it('should handle zero cache requests', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({ path: '/1', userAgent: 'bot', isBot: true, action: 'ssr', cacheStatus: null });

      const stats = collector.getStats();
      expect(stats.cacheHitRate).toBe('0.00');
    });
  });

  describe('URL stats hit rate', () => {
    it('should calculate URL hit rate correctly', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      // 2 hits, 2 misses for same URL = 50% hit rate
      collector.recordRequest({ path: '/same', userAgent: 'bot', isBot: true, action: 'ssr', cacheStatus: 'HIT' });
      collector.recordRequest({ path: '/same', userAgent: 'bot', isBot: true, action: 'ssr', cacheStatus: 'HIT' });
      collector.recordRequest({ path: '/same', userAgent: 'bot', isBot: true, action: 'ssr', cacheStatus: 'MISS' });
      collector.recordRequest({ path: '/same', userAgent: 'bot', isBot: true, action: 'ssr', cacheStatus: 'MISS' });

      const urlStats = collector.getUrlStats();
      const sameUrl = urlStats.find(u => u.path === '/same');
      expect(sameUrl).toBeDefined();
      expect(sameUrl?.hitRate).toBe('50.00');
    });
  });

  describe('human request tracking', () => {
    it('should increment human requests', async () => {
      const module = await import('../../src/admin/metrics-collector');
      const collector = module.default;
      collector.reset();

      collector.recordRequest({
        path: '/human',
        userAgent: 'Mozilla/5.0',
        isBot: false,
        action: 'proxy',
        cacheStatus: null
      });

      const stats = collector.getStats();
      expect(stats.humanRequests).toBeGreaterThan(0);
    });
  });
});
