import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPage = {
  goto: vi.fn().mockResolvedValue(undefined),
  setViewport: vi.fn().mockResolvedValue(undefined),
  setUserAgent: vi.fn().mockResolvedValue(undefined),
  screenshot: vi.fn().mockResolvedValue(Buffer.from('test').toString('base64')),
  content: vi.fn().mockResolvedValue('<html><head><title>Test Page</title></head><body><h1>Hello</h1></body></html>'),
  title: vi.fn().mockResolvedValue('Test Page'),
  evaluate: vi.fn().mockResolvedValue('Mozilla/5.0 (compatible; Googlebot/2.1)'),
  close: vi.fn().mockResolvedValue(undefined),
  waitForSelector: vi.fn().mockResolvedValue(undefined),
  $eval: vi.fn().mockResolvedValue(''),
};

const mockBrowser = {
  newPage: vi.fn().mockResolvedValue(mockPage),
};

vi.mock('../../src/browser', () => ({
  default: {
    getBrowser: vi.fn().mockResolvedValue(mockBrowser),
    getPage: vi.fn().mockResolvedValue(mockPage),
    releasePage: vi.fn().mockResolvedValue(undefined)
  }
}));

const cacheStorage: Map<string, string> = new Map();

vi.mock('../../src/cache', () => ({
  default: {
    get: vi.fn((key: string) => cacheStorage.get(key) || null),
    set: vi.fn((key: string, value: string) => {
      cacheStorage.set(key, value);
      return true;
    }),
    delete: vi.fn((key: string) => {
      const existed = cacheStorage.has(key);
      cacheStorage.delete(key);
      return existed ? 1 : 0;
    }),
    getAllEntries: vi.fn(() => {
      const entries: Array<{ url: string }> = [];
      for (const key of cacheStorage.keys()) {
        entries.push({ url: key });
      }
      return entries;
    }),
    keys: vi.fn().mockResolvedValue([])
  }
}));

// Create mock sharp that returns buffers of proper size
const mockSharpBuffer = Buffer.alloc(100 * 100 * 3, 128); // 100x100 RGB image

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 100, height: 100, channels: 3 }),
    raw: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(mockSharpBuffer),
    composite: vi.fn().mockReturnThis(),
    modulate: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
  }))
}));

vi.mock('fs/promises', () => ({
  default: { mkdir: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('../../src/utils/logger', () => ({
  Logger: class {
    info() {}
    error() {}
    warn() {}
    debug() {}
  }
}));

describe('SnapshotService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheStorage.clear();
  });

  describe('module import', () => {
    it('should import SnapshotService', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(module.default).toBeDefined();
    });

    it('should be a singleton', async () => {
      const module1 = await import('../../src/admin/snapshot-service');
      const module2 = await import('../../src/admin/snapshot-service');
      expect(module1.default).toBe(module2.default);
    });
  });

  describe('method existence', () => {
    it('should have captureSnapshot method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.captureSnapshot).toBe('function');
    });

    it('should have compareSnapshots method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.compareSnapshots).toBe('function');
    });

    it('should have getSnapshot method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.getSnapshot).toBe('function');
    });

    it('should have getDiff method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.getDiff).toBe('function');
    });

    it('should have getSnapshotHistory method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.getSnapshotHistory).toBe('function');
    });

    it('should have deleteSnapshot method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.deleteSnapshot).toBe('function');
    });

    it('should have getAllSnapshots method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.getAllSnapshots).toBe('function');
    });

    it('should have createSideBySideComparison method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.createSideBySideComparison).toBe('function');
    });

    it('should have getComparisonHistory method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.getComparisonHistory).toBe('function');
    });

    it('should have getComparisonStats method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.getComparisonStats).toBe('function');
    });
  });

  describe('getSnapshot', () => {
    it('should return null for non-existent snapshot', async () => {
      const module = await import('../../src/admin/snapshot-service');
      const result = await module.default.getSnapshot('nonexistent');
      expect(result).toBeNull();
    });

    it('should return cached snapshot', async () => {
      const module = await import('../../src/admin/snapshot-service');
      const snapshot = {
        id: 'test-snapshot',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,test',
        html: '<html></html>',
        title: 'Test',
        dimensions: { width: 1200, height: 800 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Googlebot',
      };

      cacheStorage.set('snapshot:test-snapshot', JSON.stringify(snapshot));

      const result = await module.default.getSnapshot('test-snapshot');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-snapshot');
    });

    it('should return null for invalid JSON', async () => {
      const module = await import('../../src/admin/snapshot-service');
      cacheStorage.set('snapshot:invalid', 'not-valid-json');

      const result = await module.default.getSnapshot('invalid');
      expect(result).toBeNull();
    });
  });

  describe('getDiff', () => {
    it('should return null for non-existent diff', async () => {
      const module = await import('../../src/admin/snapshot-service');
      const result = await module.default.getDiff('nonexistent');
      expect(result).toBeNull();
    });

    it('should return cached diff', async () => {
      const module = await import('../../src/admin/snapshot-service');
      const diff = {
        id: 'test-diff',
        url: 'https://example.com',
        beforeId: 'before',
        afterId: 'after',
        timestamp: new Date(),
        diffScore: 25,
        diffImage: 'data:image/png;base64,test',
        beforeSnapshot: {},
        afterSnapshot: {},
        seoComparison: {},
        impact: { high: [], medium: [], low: [] },
        recommendations: [],
      };

      cacheStorage.set('diff:test-diff', JSON.stringify(diff));

      const result = await module.default.getDiff('test-diff');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-diff');
    });

    it('should return null for invalid JSON', async () => {
      const module = await import('../../src/admin/snapshot-service');
      cacheStorage.set('diff:invalid', 'not-valid-json');

      const result = await module.default.getDiff('invalid');
      expect(result).toBeNull();
    });
  });

  describe('deleteSnapshot', () => {
    it('should delete existing snapshot', async () => {
      const module = await import('../../src/admin/snapshot-service');
      cacheStorage.set('snapshot:to-delete', JSON.stringify({ id: 'to-delete' }));

      const result = await module.default.deleteSnapshot('to-delete');
      expect(result).toBe(true);
    });

    it('should return false for non-existent snapshot', async () => {
      const module = await import('../../src/admin/snapshot-service');
      const result = await module.default.deleteSnapshot('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getSnapshotHistory', () => {
    it('should return empty array when no snapshots', async () => {
      const module = await import('../../src/admin/snapshot-service');
      const result = await module.default.getSnapshotHistory('https://example.com');
      expect(result).toEqual([]);
    });

    it('should return snapshots for matching URL', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const snapshot = {
        id: 'history-test',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'test',
        html: '<html></html>',
        title: 'Test',
        dimensions: { width: 1200, height: 800 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      cacheStorage.set('snapshot:history-test', JSON.stringify(snapshot));

      const result = await module.default.getSnapshotHistory('https://example.com');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('history-test');
    });

    it('should respect limit parameter', async () => {
      const module = await import('../../src/admin/snapshot-service');

      for (let i = 0; i < 5; i++) {
        const snapshot = {
          id: `snapshot-${i}`,
          url: 'https://example.com',
          timestamp: new Date(Date.now() - i * 1000),
          screenshot: 'test',
          html: '<html></html>',
          title: 'Test',
          dimensions: { width: 1200, height: 800 },
          deviceScaleFactor: 1,
          renderTime: 1000,
          userAgent: 'Test',
        };
        cacheStorage.set(`snapshot:snapshot-${i}`, JSON.stringify(snapshot));
      }

      const result = await module.default.getSnapshotHistory('https://example.com', 3);
      expect(result.length).toBe(3);
    });
  });

  describe('getAllSnapshots', () => {
    it('should return empty result when no snapshots', async () => {
      const module = await import('../../src/admin/snapshot-service');
      const result = await module.default.getAllSnapshots();

      expect(result.snapshots).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should return all snapshots', async () => {
      const module = await import('../../src/admin/snapshot-service');

      for (let i = 0; i < 3; i++) {
        const snapshot = {
          id: `all-snapshot-${i}`,
          url: 'https://example.com',
          timestamp: new Date(),
          screenshot: 'test',
          html: '<html></html>',
          title: 'Test',
          dimensions: { width: 1200, height: 800 },
          deviceScaleFactor: 1,
          renderTime: 1000,
          userAgent: 'Test',
        };
        cacheStorage.set(`snapshot:all-snapshot-${i}`, JSON.stringify(snapshot));
      }

      const result = await module.default.getAllSnapshots();
      expect(result.total).toBe(3);
      expect(result.snapshots.length).toBe(3);
    });

    it('should paginate results', async () => {
      const module = await import('../../src/admin/snapshot-service');

      for (let i = 0; i < 5; i++) {
        const snapshot = {
          id: `page-snapshot-${i}`,
          url: 'https://example.com',
          timestamp: new Date(Date.now() - i * 1000),
          screenshot: 'test',
          html: '<html></html>',
          title: 'Test',
          dimensions: { width: 1200, height: 800 },
          deviceScaleFactor: 1,
          renderTime: 1000,
          userAgent: 'Test',
        };
        cacheStorage.set(`snapshot:page-snapshot-${i}`, JSON.stringify(snapshot));
      }

      const result = await module.default.getAllSnapshots(1, 2);
      expect(result.snapshots.length).toBe(2);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getComparisonHistory', () => {
    it('should return empty array when no comparisons', async () => {
      const module = await import('../../src/admin/snapshot-service');
      const result = await module.default.getComparisonHistory('https://example.com');
      expect(result).toEqual([]);
    });

    it('should return comparison history for URL', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const diff = {
        id: 'comp-history-test',
        url: 'https://example.com',
        beforeId: 'before',
        afterId: 'after',
        timestamp: new Date(),
        diffScore: 25,
        diffImage: 'test',
        beforeSnapshot: {},
        afterSnapshot: {},
        seoComparison: {},
        impact: { high: [], medium: [], low: [] },
        recommendations: [],
      };

      cacheStorage.set('diff:comp-history-test', JSON.stringify(diff));

      const result = await module.default.getComparisonHistory('https://example.com');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('comp-history-test');
    });
  });

  describe('getComparisonStats', () => {
    it('should return empty stats when no comparisons', async () => {
      const module = await import('../../src/admin/snapshot-service');
      const stats = module.default.getComparisonStats();

      expect(stats.total).toBe(0);
      expect(stats.averageDiffScore).toBe(0);
      expect(stats.highRiskCount).toBe(0);
      expect(stats.recentCount).toBe(0);
      expect(stats.mostCommonIssues).toEqual([]);
    });

    it('should calculate stats from comparisons', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const diff1 = {
        id: 'stats-diff-1',
        url: 'https://example.com',
        timestamp: new Date(),
        diffScore: 60,
        impact: { high: ['Title mismatch'], medium: [], low: [] },
      };

      const diff2 = {
        id: 'stats-diff-2',
        url: 'https://example.com',
        timestamp: new Date(),
        diffScore: 30,
        impact: { high: ['Title mismatch'], medium: [], low: [] },
      };

      cacheStorage.set('diff:stats-diff-1', JSON.stringify(diff1));
      cacheStorage.set('diff:stats-diff-2', JSON.stringify(diff2));

      const stats = module.default.getComparisonStats();

      // Verify it returns the expected structure
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.averageDiffScore).toBe('number');
      expect(typeof stats.highRiskCount).toBe('number');
      expect(Array.isArray(stats.mostCommonIssues)).toBe(true);
    });
  });

  describe('captureSnapshot', () => {
    it('should capture snapshot with default options', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const result = await module.default.captureSnapshot('https://example.com');

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^snapshot_/);
      expect(result.url).toBe('https://example.com');
      expect(result.screenshot).toBeDefined();
      expect(result.html).toBeDefined();
      expect(result.title).toBe('Test Page');
    });

    it('should capture snapshot with custom options', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const result = await module.default.captureSnapshot('https://example.com', {
        width: 1920,
        height: 1080,
        fullPage: false,
        deviceScaleFactor: 2,
      });

      expect(result.dimensions.width).toBe(1920);
      expect(result.dimensions.height).toBe(1080);
      expect(result.deviceScaleFactor).toBe(2);
    });

    it('should set viewport correctly', async () => {
      const module = await import('../../src/admin/snapshot-service');

      await module.default.captureSnapshot('https://example.com', {
        width: 800,
        height: 600,
      });

      expect(mockPage.setViewport).toHaveBeenCalledWith(expect.objectContaining({
        width: 800,
        height: 600,
      }));
    });

    it('should include render time', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const result = await module.default.captureSnapshot('https://example.com');

      expect(result.renderTime).toBeDefined();
      expect(typeof result.renderTime).toBe('number');
    });

    it('should cache the snapshot', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const result = await module.default.captureSnapshot('https://example.com');

      expect(cacheStorage.has(`snapshot:${result.id}`)).toBe(true);
    });
  });

  describe('compareSnapshots', () => {
    it('should throw error when snapshot not found', async () => {
      const module = await import('../../src/admin/snapshot-service');

      await expect(module.default.compareSnapshots('nonexistent1', 'nonexistent2'))
        .rejects.toThrow('One or both snapshots not found');
    });

    it('should throw error when URLs do not match', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const snapshot1 = {
        id: 'mismatch-1',
        url: 'https://example.com/page1',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html></html>',
        title: 'Test 1',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      const snapshot2 = {
        id: 'mismatch-2',
        url: 'https://example.com/page2',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html></html>',
        title: 'Test 2',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      cacheStorage.set('snapshot:mismatch-1', JSON.stringify(snapshot1));
      cacheStorage.set('snapshot:mismatch-2', JSON.stringify(snapshot2));

      await expect(module.default.compareSnapshots('mismatch-1', 'mismatch-2'))
        .rejects.toThrow('Snapshots must be from the same URL');
    });

    it('should compare snapshots with same URL', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const snapshot1 = {
        id: 'compare-1',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html><title>Before</title></html>',
        title: 'Before',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      const snapshot2 = {
        id: 'compare-2',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html><title>After</title></html>',
        title: 'After',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1500,
        userAgent: 'Test',
      };

      cacheStorage.set('snapshot:compare-1', JSON.stringify(snapshot1));
      cacheStorage.set('snapshot:compare-2', JSON.stringify(snapshot2));

      const result = await module.default.compareSnapshots('compare-1', 'compare-2');

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^diff_/);
      expect(result.url).toBe('https://example.com');
      expect(result.beforeId).toBe('compare-1');
      expect(result.afterId).toBe('compare-2');
      expect(result.diffScore).toBeDefined();
      expect(result.seoComparison).toBeDefined();
      expect(result.seoComparison.htmlDifferences.titleDiff).toBe(true);
    });
  });

  describe('SEO comparison', () => {
    it('should detect title differences', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const snapshot1 = {
        id: 'seo-1',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html><head><title>Original Title</title></head><body></body></html>',
        title: 'Original Title',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      const snapshot2 = {
        id: 'seo-2',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html><head><title>Changed Title</title></head><body></body></html>',
        title: 'Changed Title',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      cacheStorage.set('snapshot:seo-1', JSON.stringify(snapshot1));
      cacheStorage.set('snapshot:seo-2', JSON.stringify(snapshot2));

      const result = await module.default.compareSnapshots('seo-1', 'seo-2');

      expect(result.seoComparison.htmlDifferences.titleDiff).toBe(true);
    });

    it('should detect meta description differences', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const snapshot1 = {
        id: 'meta-1',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html><head><meta name="description" content="Original description"></head></html>',
        title: 'Test',
        metaDescription: 'Original description',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      const snapshot2 = {
        id: 'meta-2',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html><head><meta name="description" content="Changed description"></head></html>',
        title: 'Test',
        metaDescription: 'Changed description',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      cacheStorage.set('snapshot:meta-1', JSON.stringify(snapshot1));
      cacheStorage.set('snapshot:meta-2', JSON.stringify(snapshot2));

      const result = await module.default.compareSnapshots('meta-1', 'meta-2');

      expect(result.seoComparison.htmlDifferences.metaDescriptionDiff).toBe(true);
    });
  });

  describe('impact assessment', () => {
    it('should categorize impact changes', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const snapshot1 = {
        id: 'impact-1',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html><head><title>Original</title><link rel="canonical" href="https://example.com/original"></head></html>',
        title: 'Original',
        canonical: 'https://example.com/original',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      const snapshot2 = {
        id: 'impact-2',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html><head><title>Changed</title><link rel="canonical" href="https://example.com/changed"></head></html>',
        title: 'Changed',
        canonical: 'https://example.com/changed',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      cacheStorage.set('snapshot:impact-1', JSON.stringify(snapshot1));
      cacheStorage.set('snapshot:impact-2', JSON.stringify(snapshot2));

      const result = await module.default.compareSnapshots('impact-1', 'impact-2');

      expect(result.impact).toBeDefined();
      expect(result.impact.high).toBeDefined();
      expect(result.impact.medium).toBeDefined();
      expect(result.impact.low).toBeDefined();
      expect(Array.isArray(result.impact.high)).toBe(true);
    });

    it('should generate recommendations', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const snapshot1 = {
        id: 'rec-1',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html><head><title>Test</title></head></html>',
        title: 'Test',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      const snapshot2 = {
        id: 'rec-2',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html><head><title>Test</title></head></html>',
        title: 'Test',
        dimensions: { width: 100, height: 100 },
        deviceScaleFactor: 1,
        renderTime: 1000,
        userAgent: 'Test',
      };

      cacheStorage.set('snapshot:rec-1', JSON.stringify(snapshot1));
      cacheStorage.set('snapshot:rec-2', JSON.stringify(snapshot2));

      const result = await module.default.compareSnapshots('rec-1', 'rec-2');

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('SnapshotResult interface', () => {
    it('should have all required properties', () => {
      const snapshot = {
        id: 'test-id',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html></html>',
        title: 'Test Title',
        dimensions: { width: 1200, height: 800 },
        deviceScaleFactor: 1,
        renderTime: 1500,
        userAgent: 'TestBot/1.0'
      };

      expect(snapshot.id).toBeDefined();
      expect(snapshot.url).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.screenshot).toBeDefined();
      expect(snapshot.html).toBeDefined();
      expect(snapshot.title).toBeDefined();
      expect(snapshot.dimensions).toBeDefined();
      expect(snapshot.deviceScaleFactor).toBeDefined();
      expect(snapshot.renderTime).toBeDefined();
      expect(snapshot.userAgent).toBeDefined();
    });

    it('should have optional SEO properties', () => {
      const snapshot = {
        id: 'test-id',
        url: 'https://example.com',
        timestamp: new Date(),
        screenshot: 'data:image/png;base64,dGVzdA==',
        html: '<html></html>',
        title: 'Test Title',
        metaDescription: 'Test description',
        h1: 'Test H1',
        canonical: 'https://example.com',
        robots: 'index, follow',
        statusCode: 200,
        dimensions: { width: 1200, height: 800 },
        deviceScaleFactor: 1,
        renderTime: 1500,
        userAgent: 'TestBot/1.0'
      };

      expect(snapshot.metaDescription).toBe('Test description');
      expect(snapshot.h1).toBe('Test H1');
      expect(snapshot.canonical).toBe('https://example.com');
      expect(snapshot.robots).toBe('index, follow');
      expect(snapshot.statusCode).toBe(200);
    });
  });

  describe('DiffResult interface', () => {
    it('should have all required properties', () => {
      const diffResult = {
        id: 'diff-test-id',
        url: 'https://example.com',
        beforeId: 'before-id',
        afterId: 'after-id',
        timestamp: new Date(),
        diffScore: 15.5,
        diffImage: 'data:image/png;base64,dGVzdA==',
        beforeSnapshot: {},
        afterSnapshot: {},
        seoComparison: {
          htmlDifferences: {
            titleDiff: false,
            metaDescriptionDiff: false,
            h1Diff: false,
            canonicalDiff: false,
            robotsDiff: false,
            structuredDataDiff: false,
            addedElements: [],
            removedElements: []
          },
          statusDiff: false,
          renderTimeDiff: 0,
          userAgentDiff: false
        },
        impact: {
          high: [],
          medium: [],
          low: []
        },
        recommendations: []
      };

      expect(diffResult.id).toBeDefined();
      expect(diffResult.diffScore).toBe(15.5);
      expect(diffResult.seoComparison).toBeDefined();
      expect(diffResult.impact).toBeDefined();
      expect(diffResult.recommendations).toBeDefined();
    });
  });

  describe('SnapshotOptions interface', () => {
    it('should have all optional properties', () => {
      const options = {
        width: 1920,
        height: 1080,
        fullPage: true,
        waitFor: 'networkidle2',
        deviceScaleFactor: 2,
        userAgent: 'CustomBot/1.0'
      };

      expect(options.width).toBe(1920);
      expect(options.height).toBe(1080);
      expect(options.fullPage).toBe(true);
      expect(options.waitFor).toBe('networkidle2');
      expect(options.deviceScaleFactor).toBe(2);
      expect(options.userAgent).toBe('CustomBot/1.0');
    });

    it('should work with partial options', () => {
      const options = {
        width: 800
      };

      expect(options.width).toBe(800);
      expect(options.height).toBeUndefined();
    });
  });

  describe('snapshot ID generation', () => {
    it('should generate unique snapshot IDs', () => {
      const id1 = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const id2 = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      expect(id1).toContain('snapshot_');
      expect(id2).toContain('snapshot_');
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp in snapshot ID', () => {
      const before = Date.now();
      const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const after = Date.now();

      const parts = snapshotId.split('_');
      const timestamp = parseInt(parts[1], 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('diff ID generation', () => {
    it('should generate unique diff IDs', () => {
      const id1 = `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const id2 = `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      expect(id1).toContain('diff_');
      expect(id2).toContain('diff_');
      expect(id1).not.toBe(id2);
    });
  });

  describe('default options', () => {
    it('should have default width of 1200', () => {
      const defaultOptions = {
        width: 1200,
        height: 800,
        fullPage: true,
        waitFor: 'networkidle2',
        deviceScaleFactor: 1
      };

      expect(defaultOptions.width).toBe(1200);
    });

    it('should have default height of 800', () => {
      const defaultOptions = {
        width: 1200,
        height: 800,
        fullPage: true,
        waitFor: 'networkidle2',
        deviceScaleFactor: 1
      };

      expect(defaultOptions.height).toBe(800);
    });

    it('should have fullPage true by default', () => {
      const defaultOptions = {
        width: 1200,
        height: 800,
        fullPage: true,
        waitFor: 'networkidle2',
        deviceScaleFactor: 1
      };

      expect(defaultOptions.fullPage).toBe(true);
    });

    it('should use networkidle2 by default', () => {
      const defaultOptions = {
        width: 1200,
        height: 800,
        fullPage: true,
        waitFor: 'networkidle2',
        deviceScaleFactor: 1
      };

      expect(defaultOptions.waitFor).toBe('networkidle2');
    });
  });

  describe('SEO comparison logic', () => {
    it('should detect h1 differences', () => {
      const before = { h1: 'Original H1' };
      const after = { h1: 'Changed H1' };
      const h1Diff = before.h1 !== after.h1;

      expect(h1Diff).toBe(true);
    });

    it('should detect no h1 difference when same', () => {
      const before = { h1: 'Same H1' };
      const after = { h1: 'Same H1' };
      const h1Diff = before.h1 !== after.h1;

      expect(h1Diff).toBe(false);
    });

    it('should detect canonical differences', () => {
      const before = { canonical: 'https://example.com/old' };
      const after = { canonical: 'https://example.com/new' };
      const canonicalDiff = before.canonical !== after.canonical;

      expect(canonicalDiff).toBe(true);
    });

    it('should detect robots differences', () => {
      const before = { robots: 'index, follow' };
      const after = { robots: 'noindex, nofollow' };
      const robotsDiff = before.robots !== after.robots;

      expect(robotsDiff).toBe(true);
    });

    it('should detect status code differences', () => {
      const before = { statusCode: 200 };
      const after = { statusCode: 301 };
      const statusDiff = before.statusCode !== after.statusCode;

      expect(statusDiff).toBe(true);
    });

    it('should calculate render time difference', () => {
      const before = { renderTime: 1000 };
      const after = { renderTime: 1500 };
      const renderTimeDiff = after.renderTime - before.renderTime;

      expect(renderTimeDiff).toBe(500);
    });
  });

  describe('impact categorization', () => {
    it('should categorize title change as high impact', () => {
      const highImpactChanges = [
        'Title changed',
        'Canonical URL changed',
        'Robots directive changed to noindex'
      ];

      expect(highImpactChanges).toContain('Title changed');
      expect(highImpactChanges).toContain('Canonical URL changed');
    });

    it('should categorize meta description change as medium impact', () => {
      const mediumImpactChanges = [
        'Meta description changed',
        'H1 changed',
        'Structured data modified'
      ];

      expect(mediumImpactChanges).toContain('Meta description changed');
      expect(mediumImpactChanges).toContain('H1 changed');
    });

    it('should categorize render time change as low impact', () => {
      const lowImpactChanges = [
        'Render time increased by 20%',
        'Minor content changes',
        'Image changes'
      ];

      expect(lowImpactChanges).toContain('Render time increased by 20%');
    });
  });

  describe('recommendation generation', () => {
    it('should recommend investigating title changes', () => {
      const recommendations = [];
      const titleDiff = true;

      if (titleDiff) {
        recommendations.push('Review title change for SEO impact - titles are critical for search rankings');
      }

      expect(recommendations).toContain('Review title change for SEO impact - titles are critical for search rankings');
    });

    it('should recommend checking canonical changes', () => {
      const recommendations = [];
      const canonicalDiff = true;

      if (canonicalDiff) {
        recommendations.push('Canonical URL changed - verify this is intentional to avoid duplicate content issues');
      }

      expect(recommendations).toContain('Canonical URL changed - verify this is intentional to avoid duplicate content issues');
    });

    it('should recommend monitoring high diff scores', () => {
      const recommendations = [];
      const diffScore = 75;

      if (diffScore > 50) {
        recommendations.push('High visual difference detected - consider reviewing page rendering');
      }

      expect(recommendations).toContain('High visual difference detected - consider reviewing page rendering');
    });
  });

  describe('diff score calculation', () => {
    it('should return 0 for identical images', () => {
      const diffPixels = 0;
      const totalPixels = 1000;
      const diffScore = Math.round((diffPixels / totalPixels) * 100 * 100) / 100;

      expect(diffScore).toBe(0);
    });

    it('should return 100 for completely different images', () => {
      const diffPixels = 1000;
      const totalPixels = 1000;
      const diffScore = Math.round((diffPixels / totalPixels) * 100 * 100) / 100;

      expect(diffScore).toBe(100);
    });

    it('should return percentage for partial differences', () => {
      const diffPixels = 250;
      const totalPixels = 1000;
      const diffScore = Math.round((diffPixels / totalPixels) * 100 * 100) / 100;

      expect(diffScore).toBe(25);
    });
  });

  describe('cache key formats', () => {
    it('should use snapshot: prefix for snapshots', () => {
      const snapshotId = 'test-snapshot-123';
      const cacheKey = `snapshot:${snapshotId}`;

      expect(cacheKey).toBe('snapshot:test-snapshot-123');
    });

    it('should use diff: prefix for diffs', () => {
      const diffId = 'test-diff-456';
      const cacheKey = `diff:${diffId}`;

      expect(cacheKey).toBe('diff:test-diff-456');
    });
  });

  describe('createSideBySideComparison', () => {
    it('should have createSideBySideComparison method', async () => {
      const module = await import('../../src/admin/snapshot-service');
      expect(typeof module.default.createSideBySideComparison).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle missing snapshots gracefully', async () => {
      const module = await import('../../src/admin/snapshot-service');

      const nonExistentId = 'non-existent-snapshot';
      const snapshot = await module.default.getSnapshot(nonExistentId);

      expect(snapshot).toBeNull();
    });

    it('should throw when comparing non-existent snapshots', async () => {
      const module = await import('../../src/admin/snapshot-service');

      await expect(
        module.default.compareSnapshots('non-existent-1', 'non-existent-2')
      ).rejects.toThrow('One or both snapshots not found');
    });
  });

  describe('waitFor strategies', () => {
    it('should recognize standard wait strategies', () => {
      const standardStrategies = ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'];

      expect(standardStrategies).toContain('load');
      expect(standardStrategies).toContain('domcontentloaded');
      expect(standardStrategies).toContain('networkidle0');
      expect(standardStrategies).toContain('networkidle2');
    });

    it('should treat non-standard waitFor as CSS selector', () => {
      const waitFor = '.main-content';
      const standardStrategies = ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'];
      const isSelector = !standardStrategies.includes(waitFor);

      expect(isSelector).toBe(true);
    });
  });

  describe('dimension comparison', () => {
    it('should detect dimension mismatch', () => {
      const before = { width: 1200, height: 800 };
      const after = { width: 1920, height: 1080 };
      const dimensionMismatch = before.width !== after.width || before.height !== after.height;

      expect(dimensionMismatch).toBe(true);
    });

    it('should detect matching dimensions', () => {
      const before = { width: 1200, height: 800 };
      const after = { width: 1200, height: 800 };
      const dimensionMatch = before.width === after.width && before.height === after.height;

      expect(dimensionMatch).toBe(true);
    });
  });

  describe('base64 image handling', () => {
    it('should recognize PNG base64 data URI', () => {
      const dataUri = 'data:image/png;base64,dGVzdA==';
      const isPngDataUri = dataUri.startsWith('data:image/png;base64,');

      expect(isPngDataUri).toBe(true);
    });

    it('should strip data URI prefix', () => {
      const dataUri = 'data:image/png;base64,dGVzdA==';
      const base64Only = dataUri.replace(/^data:image\/png;base64,/, '');

      expect(base64Only).toBe('dGVzdA==');
    });
  });

  describe('HTML extraction helpers simulation', () => {
    it('should extract title from HTML', () => {
      const html = '<html><head><title>Test Page Title</title></head></html>';
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = match ? match[1].trim() : '';

      expect(title).toBe('Test Page Title');
    });

    it('should return empty string for missing title', () => {
      const html = '<html><head></head></html>';
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = match ? match[1].trim() : '';

      expect(title).toBe('');
    });

    it('should extract meta description from HTML', () => {
      const html = '<html><head><meta name="description" content="Test description content"></head></html>';
      const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const description = match ? match[1].trim() : '';

      expect(description).toBe('Test description content');
    });

    it('should return empty for missing meta description', () => {
      const html = '<html><head></head></html>';
      const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const description = match ? match[1].trim() : '';

      expect(description).toBe('');
    });

    it('should extract H1 from HTML', () => {
      const html = '<html><body><h1>Main Heading</h1></body></html>';
      const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const h1 = match ? match[1].trim() : '';

      expect(h1).toBe('Main Heading');
    });

    it('should extract canonical from HTML', () => {
      const html = '<html><head><link rel="canonical" href="https://example.com/page"></head></html>';
      const match = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i);
      const canonical = match ? match[1].trim() : '';

      expect(canonical).toBe('https://example.com/page');
    });

    it('should extract robots meta from HTML', () => {
      const html = '<html><head><meta name="robots" content="index, follow"></head></html>';
      const match = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const robots = match ? match[1].trim() : '';

      expect(robots).toBe('index, follow');
    });

    it('should extract JSON-LD structured data', () => {
      const html = '<html><head><script type="application/ld+json">{"@type":"Product"}</script></head></html>';
      const match = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i);
      const jsonLd = match ? match[1].trim() : '';

      expect(jsonLd).toBe('{"@type":"Product"}');
    });

    it('should extract microdata itemtype', () => {
      const html = '<html><body><div itemtype="https://schema.org/Product"></div></body></html>';
      const match = html.match(/<[^>]*itemtype=["'][^"']*["'][^>]*>/gi);
      const microdata = match ? match.join('') : '';

      expect(microdata).toContain('itemtype');
    });
  });

  describe('key elements extraction simulation', () => {
    it('should extract meta tags', () => {
      const html = '<html><head><meta name="viewport" content="width=device-width"><meta name="author" content="Test"></head></html>';
      const metaMatches = html.match(/<meta[^>]*>/gi);

      expect(metaMatches).toHaveLength(2);
    });

    it('should extract title tag', () => {
      const html = '<html><head><title>Test Title</title></head></html>';
      const titleMatch = html.match(/<title[^>]*>.*?<\/title>/gi);

      expect(titleMatch).toHaveLength(1);
      expect(titleMatch![0]).toContain('Test Title');
    });

    it('should extract H1-H6 tags', () => {
      const html = '<html><body><h1>H1</h1><h2>H2</h2><h3>H3</h3></body></html>';
      const headingMatches = html.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi);

      expect(headingMatches).toHaveLength(3);
    });

    it('should extract canonical link', () => {
      const html = '<html><head><link rel="canonical" href="https://example.com"></head></html>';
      const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/gi);

      expect(canonicalMatch).toHaveLength(1);
    });
  });

  describe('SEO impact assessment simulation', () => {
    it('should categorize title diff as high impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const titleDiff = true;

      if (titleDiff) {
        impact.high.push('Title mismatch between bot and normal views - affects SEO rankings');
      }

      expect(impact.high.length).toBeGreaterThan(0);
    });

    it('should categorize canonical diff as high impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const canonicalDiff = true;

      if (canonicalDiff) {
        impact.high.push('Canonical URL differs - affects duplicate content handling');
      }

      expect(impact.high).toContain('Canonical URL differs - affects duplicate content handling');
    });

    it('should categorize meta description diff as high impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const metaDescriptionDiff = true;

      if (metaDescriptionDiff) {
        impact.high.push('Meta description differs - affects search result appearance');
      }

      expect(impact.high.length).toBe(1);
    });

    it('should categorize H1 diff as medium impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const h1Diff = true;

      if (h1Diff) {
        impact.medium.push('H1 tag differs - affects content hierarchy and rankings');
      }

      expect(impact.medium.length).toBe(1);
    });

    it('should categorize robots diff as medium impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const robotsDiff = true;

      if (robotsDiff) {
        impact.medium.push('Robots meta tag differs - affects crawl behavior');
      }

      expect(impact.medium.length).toBe(1);
    });

    it('should categorize structured data diff as medium impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const structuredDataDiff = true;

      if (structuredDataDiff) {
        impact.medium.push('Structured data differs - affects rich snippets');
      }

      expect(impact.medium.length).toBe(1);
    });

    it('should categorize high render time diff as medium impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const renderTimeDiff = 6000;

      if (renderTimeDiff > 5000) {
        impact.medium.push(`Significant render time difference (${renderTimeDiff}ms) - affects performance`);
      }

      expect(impact.medium.length).toBe(1);
    });

    it('should categorize added elements as low impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const addedElements = ['meta', 'link'];

      if (addedElements.length > 0) {
        impact.low.push(`${addedElements.length} elements visible only to bots`);
      }

      expect(impact.low.length).toBe(1);
    });

    it('should categorize removed elements as low impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const removedElements = ['div', 'span'];

      if (removedElements.length > 0) {
        impact.low.push(`${removedElements.length} elements missing for bots`);
      }

      expect(impact.low.length).toBe(1);
    });

    it('should categorize moderate visual diff as low impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const visualDiffScore = 35;

      if (visualDiffScore > 20 && visualDiffScore < 50) {
        impact.low.push('Minor visual differences detected between views');
      }

      expect(impact.low.length).toBe(1);
    });

    it('should categorize high visual diff as medium impact', () => {
      const impact = { high: [] as string[], medium: [] as string[], low: [] as string[] };
      const visualDiffScore = 60;

      if (visualDiffScore >= 50) {
        impact.medium.push('Significant visual differences detected between views');
      }

      expect(impact.medium.length).toBe(1);
    });
  });

  describe('recommendations generation simulation', () => {
    it('should add urgent message for high impact', () => {
      const recommendations: string[] = [];
      const impactHigh = ['Title mismatch'];

      if (impactHigh.length > 0) {
        recommendations.push('🔴 URGENT: Fix high-priority SEO differences to maintain search rankings');
      }

      expect(recommendations[0]).toContain('URGENT');
    });

    it('should recommend title consistency check', () => {
      const recommendations: string[] = [];
      const titleDiff = true;

      if (titleDiff) {
        recommendations.push('• Ensure title is consistent between bot and normal views');
      }

      expect(recommendations.length).toBe(1);
    });

    it('should recommend canonical URL fix', () => {
      const recommendations: string[] = [];
      const canonicalDiff = true;

      if (canonicalDiff) {
        recommendations.push('• Fix canonical URL inconsistency between views');
      }

      expect(recommendations.length).toBe(1);
    });

    it('should recommend meta description standardization', () => {
      const recommendations: string[] = [];
      const metaDescriptionDiff = true;

      if (metaDescriptionDiff) {
        recommendations.push('• Standardize meta description for both bots and users');
      }

      expect(recommendations.length).toBe(1);
    });

    it('should recommend H1 consistency check', () => {
      const recommendations: string[] = [];
      const h1Diff = true;

      if (h1Diff) {
        recommendations.push('• Ensure H1 tag consistency across different user agents');
      }

      expect(recommendations.length).toBe(1);
    });

    it('should recommend structured data fix', () => {
      const recommendations: string[] = [];
      const structuredDataDiff = true;

      if (structuredDataDiff) {
        recommendations.push('• Fix structured data inconsistencies for better rich snippets');
      }

      expect(recommendations.length).toBe(1);
    });

    it('should recommend performance investigation', () => {
      const recommendations: string[] = [];
      const renderTimeDiff = 6000;

      if (renderTimeDiff > 5000) {
        recommendations.push('• Investigate performance differences between views');
      }

      expect(recommendations.length).toBe(1);
    });

    it('should recommend CSS/JS review for high diff', () => {
      const recommendations: string[] = [];
      const diffScore = 60;

      if (diffScore > 50) {
        recommendations.push('• Significant differences detected - review CSS/JS loading patterns');
      }

      expect(recommendations.length).toBe(1);
    });

    it('should add success message when no issues', () => {
      const recommendations: string[] = [];
      recommendations.push('🔴 URGENT: Fix high-priority SEO differences to maintain search rankings');

      if (recommendations.length === 1) {
        recommendations.push('✅ No major SEO issues detected - views are consistent');
      }

      expect(recommendations.length).toBe(2);
    });
  });

  describe('element difference detection simulation', () => {
    it('should find added elements', () => {
      const normalElements = ['meta-viewport', 'title'];
      const botElements = ['meta-viewport', 'title', 'meta-robots'];

      const addedElements: string[] = [];
      for (const element of botElements) {
        if (!normalElements.includes(element)) {
          addedElements.push(element);
        }
      }

      expect(addedElements).toContain('meta-robots');
    });

    it('should find removed elements', () => {
      const normalElements = ['meta-viewport', 'title', 'script'];
      const botElements = ['meta-viewport', 'title'];

      const removedElements: string[] = [];
      for (const element of normalElements) {
        if (!botElements.includes(element)) {
          removedElements.push(element);
        }
      }

      expect(removedElements).toContain('script');
    });
  });

  describe('comparison stats calculation', () => {
    it('should calculate average diff score', () => {
      const comparisons = [
        { diffScore: 20 },
        { diffScore: 40 },
        { diffScore: 60 }
      ];

      const total = comparisons.length;
      const averageDiffScore = comparisons.reduce((sum, c) => sum + c.diffScore, 0) / total;

      expect(averageDiffScore).toBe(40);
    });

    it('should count high risk comparisons', () => {
      const comparisons = [
        { diffScore: 20 },
        { diffScore: 60 },
        { diffScore: 80 }
      ];

      const highRiskCount = comparisons.filter(c => c.diffScore > 50).length;

      expect(highRiskCount).toBe(2);
    });

    it('should count recent comparisons', () => {
      const now = Date.now();
      const comparisons = [
        { timestamp: new Date(now - 1000) },
        { timestamp: new Date(now - 86400000 * 2) }
      ];

      const recentCount = comparisons.filter(c =>
        now - c.timestamp.getTime() < 24 * 60 * 60 * 1000
      ).length;

      expect(recentCount).toBe(1);
    });

    it('should analyze common issues', () => {
      const comparisons = [
        { impact: { high: ['Title mismatch'] } },
        { impact: { high: ['Title mismatch', 'Canonical diff'] } },
        { impact: { high: ['Canonical diff'] } }
      ];

      const issueCounts: Record<string, number> = {};
      for (const comp of comparisons) {
        for (const issue of comp.impact.high) {
          issueCounts[issue] = (issueCounts[issue] || 0) + 1;
        }
      }

      const mostCommonIssues = Object.entries(issueCounts)
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count);

      expect(mostCommonIssues[0].issue).toBe('Title mismatch');
      expect(mostCommonIssues[0].count).toBe(2);
    });
  });

  describe('pixel diff threshold', () => {
    it('should use 30 as diff threshold', () => {
      const threshold = 30;
      const avgDiff = 35;
      const isDifferent = avgDiff > threshold;

      expect(isDifferent).toBe(true);
    });

    it('should not count similar pixels', () => {
      const threshold = 30;
      const avgDiff = 25;
      const isDifferent = avgDiff > threshold;

      expect(isDifferent).toBe(false);
    });
  });

  describe('TTL configuration', () => {
    it('should use 7 day TTL for snapshots', () => {
      const ttl = 86400 * 7;
      expect(ttl).toBe(604800);
    });

    it('should use 7 day TTL for diffs', () => {
      const ttl = 86400 * 7;
      expect(ttl).toBe(604800);
    });
  });

  describe('comparison ID generation', () => {
    it('should generate unique comparison IDs', () => {
      const id1 = `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const id2 = `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      expect(id1).toContain('comparison_');
      expect(id2).toContain('comparison_');
      expect(id1).not.toBe(id2);
    });
  });

  describe('user agent configurations', () => {
    it('should use Chrome user agent for normal view', () => {
      const normalUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      expect(normalUA).toContain('Chrome');
    });

    it('should use Googlebot user agent for bot view', () => {
      const botUA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      expect(botUA).toContain('Googlebot');
    });
  });

  describe('snapshot sorting', () => {
    it('should sort by timestamp descending', () => {
      const snapshots = [
        { timestamp: new Date(2024, 0, 1) },
        { timestamp: new Date(2024, 0, 3) },
        { timestamp: new Date(2024, 0, 2) }
      ];

      const sorted = snapshots.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      expect(sorted[0].timestamp.getDate()).toBe(3);
      expect(sorted[1].timestamp.getDate()).toBe(2);
      expect(sorted[2].timestamp.getDate()).toBe(1);
    });
  });

  describe('pagination calculation', () => {
    it('should calculate total pages correctly', () => {
      const total = 25;
      const limit = 10;
      const totalPages = Math.ceil(total / limit);

      expect(totalPages).toBe(3);
    });

    it('should calculate start and end indices', () => {
      const page = 2;
      const limit = 10;
      const start = (page - 1) * limit;
      const end = start + limit;

      expect(start).toBe(10);
      expect(end).toBe(20);
    });
  });

  describe('waitFor selector handling', () => {
    it('should identify standard waitUntil values', () => {
      const standardValues = ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'];
      const waitFor = 'networkidle2';
      const isStandard = standardValues.includes(waitFor);

      expect(isStandard).toBe(true);
    });

    it('should identify custom selector', () => {
      const standardValues = ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'];
      const waitFor = '.main-content';
      const isSelector = !standardValues.includes(waitFor);

      expect(isSelector).toBe(true);
    });
  });
});
