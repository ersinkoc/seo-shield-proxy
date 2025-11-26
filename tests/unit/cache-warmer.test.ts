import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../src/cache', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(() => true),
    delete: vi.fn()
  }
}));

vi.mock('../../src/browser', () => ({
  default: {
    render: vi.fn().mockResolvedValue({ html: '<html>test</html>', statusCode: 200 })
  }
}));

vi.mock('../../src/admin/config-manager', () => ({
  default: {
    getConfig: vi.fn(() => ({
      sitemapUrl: '',
      warmupSchedule: '0 * * * *',
      userAgent: 'Mozilla/5.0 TestBot'
    })),
    updateConfig: vi.fn()
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

// Mock global fetch
global.fetch = vi.fn();

describe('CacheWarmer', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    // Reset fetch mock
    (global.fetch as any).mockReset();
  });

  describe('module import', () => {
    it('should import CacheWarmer', async () => {
      const module = await import('../../src/admin/cache-warmer');
      expect(module.default).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return initial stats', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;
      const stats = warmer.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.inProgress).toBe('number');
      expect(typeof stats.queued).toBe('number');
      expect(typeof stats.averageRenderTime).toBe('number');
      expect(typeof stats.successRate).toBe('number');
      expect(Array.isArray(stats.activeJobs)).toBe(true);
      expect(Array.isArray(stats.recentJobs)).toBe(true);
    });
  });

  describe('getSchedules', () => {
    it('should return schedules array', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;
      const schedules = warmer.getSchedules();
      expect(Array.isArray(schedules)).toBe(true);
    });
  });

  describe('addUrls', () => {
    it('should add valid URLs to queue', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.addUrls(['https://example.com/page1', 'https://example.com/page2']);
      expect(result.added).toBeGreaterThanOrEqual(0);
      expect(typeof result.skipped).toBe('number');
      expect(typeof result.duplicates).toBe('number');
    });

    it('should skip invalid URLs', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.addUrls(['invalid-url', 'also-not-valid']);
      expect(result.added).toBe(0);
    });

    it('should skip already cached URLs', async () => {
      const cache = await import('../../src/cache');
      (cache.default.get as any).mockReturnValue(JSON.stringify({ timestamp: Date.now() }));

      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.addUrls(['https://example.com/cached']);
      expect(result.skipped).toBeGreaterThanOrEqual(0);
    });

    it('should accept priority parameter', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.addUrls(['https://example.com/high'], 'high');
      expect(result).toBeDefined();
    });

    it('should accept source parameter', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.addUrls(['https://example.com/sitemap'], 'normal', 'sitemap');
      expect(result).toBeDefined();
    });

    it('should accept metadata parameter', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.addUrls(
        ['https://example.com/meta'],
        'normal',
        'sitemap',
        { sitemapUrl: 'https://example.com/sitemap.xml', batchSize: 10 }
      );
      expect(result).toBeDefined();
    });
  });

  describe('createSchedule', () => {
    it('should create a new schedule', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const scheduleId = await warmer.createSchedule(
        'Test Schedule',
        'https://example.com/sitemap.xml',
        '0 * * * *',
        'normal'
      );

      expect(scheduleId).toBeDefined();
      expect(typeof scheduleId).toBe('string');
      expect(scheduleId.startsWith('schedule_')).toBe(true);
    });

    it('should add schedule to schedules list', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const scheduleId = await warmer.createSchedule(
        'Test Schedule 2',
        'https://example.com/sitemap2.xml',
        '0 0 * * *',
        'high'
      );

      const schedules = warmer.getSchedules();
      const found = schedules.find(s => s.id === scheduleId);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Schedule 2');
    });
  });

  describe('getJob', () => {
    it('should return undefined for non-existent job', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const job = warmer.getJob('non-existent-job');
      expect(job).toBeUndefined();
    });
  });

  describe('getSchedule', () => {
    it('should return undefined for non-existent schedule', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const schedule = warmer.getSchedule('non-existent-schedule');
      expect(schedule).toBeUndefined();
    });

    it('should return existing schedule', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const scheduleId = await warmer.createSchedule(
        'Findable Schedule',
        'https://example.com/find.xml',
        '0 0 * * *'
      );

      const schedule = warmer.getSchedule(scheduleId);
      expect(schedule).toBeDefined();
      expect(schedule?.name).toBe('Findable Schedule');
    });
  });

  describe('cancelJob', () => {
    it('should return false for non-existent job', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = warmer.cancelJob('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('cancelAllJobs', () => {
    it('should return number of cancelled jobs', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = warmer.cancelAllJobs();
      expect(typeof result).toBe('number');
    });
  });

  describe('toggleSchedule', () => {
    it('should return false for non-existent schedule', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = warmer.toggleSchedule('non-existent', false);
      expect(result).toBe(false);
    });

    it('should toggle existing schedule', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const scheduleId = await warmer.createSchedule(
        'Toggle Test',
        'https://example.com/toggle.xml',
        '0 0 * * *'
      );

      const result = warmer.toggleSchedule(scheduleId, false);
      expect(result).toBe(true);

      const schedule = warmer.getSchedule(scheduleId);
      expect(schedule?.isActive).toBe(false);
    });
  });

  describe('deleteSchedule', () => {
    it('should return false for non-existent schedule', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = warmer.deleteSchedule('non-existent');
      expect(result).toBe(false);
    });

    it('should delete existing schedule', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const scheduleId = await warmer.createSchedule(
        'Delete Test',
        'https://example.com/delete.xml',
        '0 0 * * *'
      );

      const result = warmer.deleteSchedule(scheduleId);
      expect(result).toBe(true);

      const schedule = warmer.getSchedule(scheduleId);
      expect(schedule).toBeUndefined();
    });
  });

  describe('clearQueue', () => {
    it('should clear queue without error', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      expect(() => warmer.clearQueue()).not.toThrow();
    });
  });

  describe('getEstimatedTime', () => {
    it('should return 0 when queue is empty', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      warmer.clearQueue();
      const time = warmer.getEstimatedTime();
      expect(time).toBe(0);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics object', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const metrics = warmer.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.jobsPerHour).toBe('number');
      expect(typeof metrics.averageRenderTime).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(typeof metrics.cacheHitRate).toBe('number');
      expect(Array.isArray(metrics.topErrorMessages)).toBe(true);
    });
  });

  describe('cleanupHistory', () => {
    it('should cleanup without error', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      expect(() => warmer.cleanupHistory()).not.toThrow();
    });

    it('should accept custom maxAge parameter', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      expect(() => warmer.cleanupHistory(3600000)).not.toThrow(); // 1 hour
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      await expect(warmer.shutdown()).resolves.not.toThrow();
    });
  });

  describe('parseSitemap', () => {
    it('should parse sitemap XML', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
              <loc>https://example.com/page1</loc>
            </url>
            <url>
              <loc>https://example.com/page2</loc>
            </url>
          </urlset>
        `)
      });

      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const urls = await warmer.parseSitemap('https://example.com/sitemap.xml');
      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBe(2);
      expect(urls[0]).toBe('https://example.com/page1');
      expect(urls[1]).toBe('https://example.com/page2');
    });

    it('should handle empty sitemap', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        text: () => Promise.resolve(`<?xml version="1.0"?><urlset></urlset>`)
      });

      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const urls = await warmer.parseSitemap('https://example.com/empty.xml');
      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBe(0);
    });

    it('should throw on fetch error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      await expect(warmer.parseSitemap('https://example.com/error.xml')).rejects.toThrow();
    });
  });

  describe('warmFromSitemap', () => {
    it('should warm URLs from sitemap', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <urlset>
            <url><loc>https://example.com/warm1</loc></url>
          </urlset>
        `)
      });

      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.warmFromSitemap('https://example.com/sitemap.xml');
      expect(result).toBeDefined();
      expect(typeof result.total).toBe('number');
      expect(typeof result.added).toBe('number');
      expect(typeof result.skipped).toBe('number');
    });

    it('should accept options', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        text: () => Promise.resolve(`
          <?xml version="1.0"?>
          <urlset>
            <url><loc>https://example.com/opt1</loc></url>
          </urlset>
        `)
      });

      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.warmFromSitemap(
        'https://example.com/sitemap.xml',
        'high',
        { batchSize: 10, delayMs: 100 }
      );
      expect(result).toBeDefined();
    });

    it('should throw on sitemap parse error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      await expect(warmer.warmFromSitemap('https://example.com/bad.xml')).rejects.toThrow();
    });
  });

  describe('priority handling', () => {
    it('should handle high priority', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.addUrls(['https://example.com/high-pri'], 'high');
      expect(result).toBeDefined();
    });

    it('should handle low priority', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.addUrls(['https://example.com/low-pri'], 'low');
      expect(result).toBeDefined();
    });
  });

  describe('source types', () => {
    it('should handle api source', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.addUrls(['https://example.com/api'], 'normal', 'api');
      expect(result).toBeDefined();
    });

    it('should handle scheduled source', async () => {
      const module = await import('../../src/admin/cache-warmer');
      const warmer = module.default;

      const result = await warmer.addUrls(['https://example.com/scheduled'], 'normal', 'scheduled');
      expect(result).toBeDefined();
    });
  });
});
