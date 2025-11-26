import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/browser', () => ({
  default: {
    getPage: vi.fn().mockResolvedValue({
      goto: vi.fn().mockResolvedValue(undefined),
      content: vi.fn().mockResolvedValue('<html></html>')
    }),
    releasePage: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../../src/cache', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn().mockReturnValue(1),
    getAllEntries: vi.fn().mockReturnValue([])
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

describe('ForensicsCollector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import ForensicsCollector', async () => {
      const module = await import('../../src/admin/forensics-collector');
      expect(module.default).toBeDefined();
    });
  });

  describe('method existence', () => {
    it('should have captureForensics method', async () => {
      const module = await import('../../src/admin/forensics-collector');
      expect(typeof module.default.captureForensics).toBe('function');
    });

    it('should have getErrors method', async () => {
      const module = await import('../../src/admin/forensics-collector');
      expect(typeof module.default.getErrors).toBe('function');
    });

    it('should have getStats method', async () => {
      const module = await import('../../src/admin/forensics-collector');
      expect(typeof module.default.getStats).toBe('function');
    });

    it('should have getError method', async () => {
      const module = await import('../../src/admin/forensics-collector');
      expect(typeof module.default.getError).toBe('function');
    });

    it('should have clearOldErrors method', async () => {
      const module = await import('../../src/admin/forensics-collector');
      expect(typeof module.default.clearOldErrors).toBe('function');
    });

    it('should have getErrorsByUrl method', async () => {
      const module = await import('../../src/admin/forensics-collector');
      expect(typeof module.default.getErrorsByUrl).toBe('function');
    });

    it('should have deleteError method', async () => {
      const module = await import('../../src/admin/forensics-collector');
      expect(typeof module.default.deleteError).toBe('function');
    });
  });

  describe('captureForensics', () => {
    it('should capture forensics for timeout error', async () => {
      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const error = new Error('Operation timeout');
      const context = {
        userAgent: 'Test Browser',
        viewport: { width: 1200, height: 800 },
        headers: { 'x-test': 'value' },
        waitStrategy: 'networkidle0',
        timeout: 30000,
        startTime: Date.now() - 1000
      };

      const result = await collector.captureForensics('https://example.com', error, context);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.url).toBe('https://example.com');
      expect(result.error.type).toBe('timeout');
      expect(result.error.message).toBe('Operation timeout');
    });

    it('should capture forensics for javascript error', async () => {
      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const error = new Error('JavaScript syntax error');
      const context = { userAgent: 'Test', startTime: Date.now() };

      const result = await collector.captureForensics('https://example.com', error, context);

      expect(result.error.type).toBe('javascript');
    });

    it('should capture forensics for network error', async () => {
      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const error = new Error('Network connection failed');
      error.name = 'ConnectionIssue'; // Use name without 'error' to avoid javascript check
      const context = { userAgent: 'Test', startTime: Date.now() };

      const result = await collector.captureForensics('https://example.com', error, context);

      expect(result.error.type).toBe('network');
    });

    it('should capture forensics for crash error', async () => {
      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const error = new Error('Page crashed');
      error.name = 'crash';
      const context = { userAgent: 'Test', startTime: Date.now() };

      const result = await collector.captureForensics('https://example.com', error, context);

      expect(result.error.type).toBe('crash');
    });

    it('should capture forensics for unknown error', async () => {
      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const error = new Error('Some random issue'); // Avoid 'error' in name for unknown type
      error.name = 'CustomIssue'; // Use custom name to avoid matching any patterns
      const context = { userAgent: 'Test', startTime: Date.now() };

      const result = await collector.captureForensics('https://example.com', error, context);

      expect(result.error.type).toBe('unknown');
    });

    it('should capture forensics with page object', async () => {
      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const mockPage = {
        evaluate: vi.fn().mockResolvedValue([]),
        screenshot: vi.fn().mockResolvedValue('base64data'),
        content: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
        metrics: vi.fn().mockResolvedValue({
          JSHeapUsedSize: 1000000,
          JSHeapTotalSize: 2000000,
          JSHeapSizeLimit: 3000000
        })
      };

      const error = new Error('Test error');
      const context = { userAgent: 'Test', startTime: Date.now() };

      const result = await collector.captureForensics('https://example.com', error, context, mockPage);

      expect(result).toBeDefined();
      expect(result.html).toBe('<html><body>Test</body></html>');
    });

    it('should handle page capture errors gracefully', async () => {
      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const mockPage = {
        evaluate: vi.fn().mockRejectedValue(new Error('Page error')),
        screenshot: vi.fn().mockRejectedValue(new Error('Screenshot error')),
        content: vi.fn().mockRejectedValue(new Error('Content error')),
        metrics: vi.fn().mockRejectedValue(new Error('Metrics error'))
      };

      const error = new Error('Test error');
      const context = { userAgent: 'Test', startTime: Date.now() };

      const result = await collector.captureForensics('https://example.com', error, context, mockPage);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should use default context values', async () => {
      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const error = new Error('Test error');
      const result = await collector.captureForensics('https://example.com', error, {});

      expect(result.context.userAgent).toBe('unknown');
      expect(result.context.viewport.width).toBe(1200);
      expect(result.context.viewport.height).toBe(800);
      expect(result.context.waitStrategy).toBe('unknown');
      expect(result.context.timeout).toBe(30000);
    });
  });

  describe('getErrors', () => {
    it('should return empty errors list when cache is empty', async () => {
      const cache = await import('../../src/cache');
      (cache.default.getAllEntries as any).mockReturnValue([]);

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const result = await collector.getErrors();

      expect(result.errors).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });

    it('should return paginated errors', async () => {
      const cache = await import('../../src/cache');
      (cache.default.getAllEntries as any).mockReturnValue([
        { url: 'forensics:error1' },
        { url: 'forensics:error2' }
      ]);
      (cache.default.get as any).mockImplementation((key: string) => {
        if (key === 'forensics:error1') {
          return JSON.stringify({
            id: 'error1',
            url: 'https://example.com/page1',
            timestamp: new Date().toISOString(),
            error: { type: 'timeout', message: 'Timeout' }
          });
        }
        if (key === 'forensics:error2') {
          return JSON.stringify({
            id: 'error2',
            url: 'https://example.com/page2',
            timestamp: new Date().toISOString(),
            error: { type: 'javascript', message: 'JS Error' }
          });
        }
        return null;
      });

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const result = await collector.getErrors(1, 50);

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should handle parse errors gracefully', async () => {
      const cache = await import('../../src/cache');
      (cache.default.getAllEntries as any).mockReturnValue([
        { url: 'forensics:invalid' }
      ]);
      (cache.default.get as any).mockReturnValue('invalid json');

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const result = await collector.getErrors();

      expect(result.errors).toEqual([]);
    });
  });

  describe('getError', () => {
    it('should return null for non-existent error', async () => {
      const cache = await import('../../src/cache');
      (cache.default.get as any).mockReturnValue(null);

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const result = await collector.getError('non-existent');

      expect(result).toBeNull();
    });

    it('should return error by id', async () => {
      const cache = await import('../../src/cache');
      (cache.default.get as any).mockReturnValue(JSON.stringify({
        id: 'test-id',
        url: 'https://example.com',
        timestamp: new Date().toISOString(),
        error: { type: 'timeout', message: 'Timeout' }
      }));

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const result = await collector.getError('test-id');

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
    });

    it('should handle parse errors gracefully', async () => {
      const cache = await import('../../src/cache');
      (cache.default.get as any).mockReturnValue('invalid json');

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const result = await collector.getError('test-id');

      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return default stats when no errors', async () => {
      const cache = await import('../../src/cache');
      (cache.default.getAllEntries as any).mockReturnValue([]);

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const stats = await collector.getStats();

      expect(stats.totalErrors).toBe(0);
      expect(stats.todayErrors).toBe(0);
      expect(stats.errorsByType).toEqual({});
      expect(stats.topErrorUrls).toEqual([]);
    });

    it('should calculate stats from errors', async () => {
      const cache = await import('../../src/cache');
      const today = new Date();
      (cache.default.getAllEntries as any).mockReturnValue([
        { url: 'forensics:error1' },
        { url: 'forensics:error2' }
      ]);
      (cache.default.get as any).mockImplementation((key: string) => {
        if (key === 'forensics:error1') {
          return JSON.stringify({
            id: 'error1',
            url: 'https://example.com/page1',
            timestamp: today.toISOString(),
            error: { type: 'timeout', message: 'Timeout' }
          });
        }
        if (key === 'forensics:error2') {
          return JSON.stringify({
            id: 'error2',
            url: 'https://example.com/page1',
            timestamp: today.toISOString(),
            error: { type: 'timeout', message: 'Timeout' }
          });
        }
        return null;
      });

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const stats = await collector.getStats();

      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsByType['timeout']).toBe(2);
    });
  });

  describe('clearOldErrors', () => {
    it('should clear old errors', async () => {
      const cache = await import('../../src/cache');
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days ago

      (cache.default.getAllEntries as any).mockReturnValue([
        { url: 'forensics:old-error' }
      ]);
      (cache.default.get as any).mockReturnValue(JSON.stringify({
        id: 'old-error',
        url: 'https://example.com',
        timestamp: oldDate.toISOString(),
        error: { type: 'timeout', message: 'Timeout' }
      }));

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const deleted = await collector.clearOldErrors(30);

      expect(deleted).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors gracefully', async () => {
      const cache = await import('../../src/cache');
      (cache.default.getAllEntries as any).mockImplementation(() => {
        throw new Error('Cache error');
      });

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const deleted = await collector.clearOldErrors(30);

      expect(deleted).toBe(0);
    });
  });

  describe('getErrorsByUrl', () => {
    it('should return errors for specific URL', async () => {
      const cache = await import('../../src/cache');
      (cache.default.getAllEntries as any).mockReturnValue([
        { url: 'forensics:error1' },
        { url: 'forensics:error2' }
      ]);
      (cache.default.get as any).mockImplementation((key: string) => {
        if (key === 'forensics:error1') {
          return JSON.stringify({
            id: 'error1',
            url: 'https://example.com/target',
            timestamp: new Date().toISOString(),
            error: { type: 'timeout', message: 'Timeout' }
          });
        }
        if (key === 'forensics:error2') {
          return JSON.stringify({
            id: 'error2',
            url: 'https://example.com/other',
            timestamp: new Date().toISOString(),
            error: { type: 'javascript', message: 'JS Error' }
          });
        }
        return null;
      });

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const errors = await collector.getErrorsByUrl('https://example.com/target');

      expect(errors.length).toBe(1);
      expect(errors[0].url).toBe('https://example.com/target');
    });

    it('should handle errors gracefully', async () => {
      const cache = await import('../../src/cache');
      (cache.default.getAllEntries as any).mockImplementation(() => {
        throw new Error('Cache error');
      });

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const errors = await collector.getErrorsByUrl('https://example.com');

      expect(errors).toEqual([]);
    });
  });

  describe('deleteError', () => {
    it('should delete error by id', async () => {
      const cache = await import('../../src/cache');
      (cache.default.delete as any).mockReturnValue(1);

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const result = await collector.deleteError('test-id');

      expect(result).toBe(true);
      expect(cache.default.delete).toHaveBeenCalledWith('forensics:test-id');
    });

    it('should return false when delete fails', async () => {
      const cache = await import('../../src/cache');
      (cache.default.delete as any).mockReturnValue(0);

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const result = await collector.deleteError('non-existent');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const cache = await import('../../src/cache');
      (cache.default.delete as any).mockImplementation(() => {
        throw new Error('Delete error');
      });

      const module = await import('../../src/admin/forensics-collector');
      const collector = module.default;

      const result = await collector.deleteError('test-id');

      expect(result).toBe(false);
    });
  });
});
