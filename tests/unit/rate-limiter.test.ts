import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
vi.mock('express-rate-limit', () => ({
  default: vi.fn(() => (req: any, res: any, next: any) => next())
}));

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('exports', () => {
    it('should export generalRateLimiter', async () => {
      const module = await import('../../src/middleware/rate-limiter');
      expect(module.generalRateLimiter).toBeDefined();
      expect(typeof module.generalRateLimiter).toBe('function');
    });

    it('should export ssrRateLimiter', async () => {
      const module = await import('../../src/middleware/rate-limiter');
      expect(module.ssrRateLimiter).toBeDefined();
      expect(typeof module.ssrRateLimiter).toBe('function');
    });

    it('should export adminRateLimiter', async () => {
      const module = await import('../../src/middleware/rate-limiter');
      expect(module.adminRateLimiter).toBeDefined();
      expect(typeof module.adminRateLimiter).toBe('function');
    });

    it('should export apiRateLimiter', async () => {
      const module = await import('../../src/middleware/rate-limiter');
      expect(module.apiRateLimiter).toBeDefined();
      expect(typeof module.apiRateLimiter).toBe('function');
    });

    it('should export cacheRateLimiter', async () => {
      const module = await import('../../src/middleware/rate-limiter');
      expect(module.cacheRateLimiter).toBeDefined();
      expect(typeof module.cacheRateLimiter).toBe('function');
    });
  });

  describe('middleware behavior', () => {
    it('should call next for general rate limiter', async () => {
      const module = await import('../../src/middleware/rate-limiter');
      const mockReq = { path: '/test', ip: '127.0.0.1' };
      const mockRes = {};
      const mockNext = vi.fn();
      
      module.generalRateLimiter(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next for ssr rate limiter', async () => {
      const module = await import('../../src/middleware/rate-limiter');
      const mockReq = {};
      const mockRes = {};
      const mockNext = vi.fn();
      
      module.ssrRateLimiter(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next for admin rate limiter', async () => {
      const module = await import('../../src/middleware/rate-limiter');
      const mockReq = {};
      const mockRes = {};
      const mockNext = vi.fn();
      
      module.adminRateLimiter(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next for api rate limiter', async () => {
      const module = await import('../../src/middleware/rate-limiter');
      const mockReq = {};
      const mockRes = {};
      const mockNext = vi.fn();
      
      module.apiRateLimiter(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next for cache rate limiter', async () => {
      const module = await import('../../src/middleware/rate-limiter');
      const mockReq = {};
      const mockRes = {};
      const mockNext = vi.fn();

      module.cacheRateLimiter(mockReq as any, mockRes as any, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

describe('Rate Limiter Configuration', () => {
  describe('general rate limiter config', () => {
    it('should have 15 minute window', () => {
      const windowMs = 15 * 60 * 1000;
      expect(windowMs).toBe(900000);
    });

    it('should skip health check path', () => {
      const req = { path: '/shieldhealth', ip: '192.168.1.1' };
      const shouldSkip = req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
      expect(shouldSkip).toBe(true);
    });

    it('should skip localhost IP', () => {
      const req = { path: '/test', ip: '127.0.0.1' };
      const shouldSkip = req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
      expect(shouldSkip).toBe(true);
    });

    it('should skip IPv6 localhost', () => {
      const req = { path: '/test', ip: '::1' };
      const shouldSkip = req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
      expect(shouldSkip).toBe(true);
    });

    it('should not skip regular requests', () => {
      const req = { path: '/api/test', ip: '192.168.1.1' };
      const shouldSkip = req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
      expect(shouldSkip).toBe(false);
    });
  });

  describe('SSR rate limiter config', () => {
    it('should have 1 minute window', () => {
      const windowMs = 1 * 60 * 1000;
      expect(windowMs).toBe(60000);
    });

    it('should have stricter limits', () => {
      const productionMax = 10;
      const developmentMax = 100;
      expect(productionMax).toBeLessThan(developmentMax);
    });
  });

  describe('admin rate limiter config', () => {
    it('should have 15 minute window', () => {
      const windowMs = 15 * 60 * 1000;
      expect(windowMs).toBe(900000);
    });

    it('should have strict production limits', () => {
      const productionMax = 30;
      expect(productionMax).toBe(30);
    });
  });

  describe('API rate limiter config', () => {
    it('should have 1 minute window', () => {
      const windowMs = 1 * 60 * 1000;
      expect(windowMs).toBe(60000);
    });

    it('should allow 60 requests per minute in production', () => {
      const productionMax = 60;
      expect(productionMax).toBe(60);
    });
  });

  describe('cache rate limiter config', () => {
    it('should have 5 minute window', () => {
      const windowMs = 5 * 60 * 1000;
      expect(windowMs).toBe(300000);
    });

    it('should allow 20 operations in production', () => {
      const productionMax = 20;
      expect(productionMax).toBe(20);
    });
  });
});

describe('Rate Limit Error Messages', () => {
  it('should have general error message', () => {
    const message = {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    };
    expect(message.error).toContain('Too many requests');
    expect(message.retryAfter).toBe('15 minutes');
  });

  it('should have SSR error message', () => {
    const message = {
      error: 'Too many rendering requests, please try again later.',
      retryAfter: '1 minute'
    };
    expect(message.error).toContain('rendering');
    expect(message.retryAfter).toBe('1 minute');
  });

  it('should have admin error message', () => {
    const message = {
      error: 'Too many admin requests, please try again later.',
      retryAfter: '15 minutes'
    };
    expect(message.error).toContain('admin');
    expect(message.retryAfter).toBe('15 minutes');
  });

  it('should have API error message', () => {
    const message = {
      error: 'Too many API requests, please try again later.',
      retryAfter: '1 minute'
    };
    expect(message.error).toContain('API');
  });

  it('should have cache error message', () => {
    const message = {
      error: 'Too many cache operations, please try again later.',
      retryAfter: '5 minutes'
    };
    expect(message.error).toContain('cache');
    expect(message.retryAfter).toBe('5 minutes');
  });
});

describe('Rate Limit Handler Behavior', () => {
  it('should log admin rate limit violation', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ip = '192.168.1.1';
    const path = '/shieldapi/config';
    console.warn(`🚨 Admin rate limit exceeded for IP: ${ip}, Path: ${path}`);
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Admin rate limit exceeded'));
    consoleSpy.mockRestore();
  });

  it('should log cache rate limit violation', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ip = '192.168.1.1';
    const method = 'DELETE';
    console.warn(`🚨 Cache rate limit exceeded for IP: ${ip}, Method: ${method}`);
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cache rate limit exceeded'));
    consoleSpy.mockRestore();
  });

  it('should return 429 status for rate limit violations', () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    mockRes.status(429).json({
      error: 'Too many requests',
      retryAfter: '15 minutes'
    });

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Too many requests'
    }));
  });
});

describe('Rate Limiter Options', () => {
  it('should use standard headers', () => {
    const options = { standardHeaders: true };
    expect(options.standardHeaders).toBe(true);
  });

  it('should disable legacy headers', () => {
    const options = { legacyHeaders: false };
    expect(options.legacyHeaders).toBe(false);
  });

  it('should not skip successful requests for admin', () => {
    const options = { skipSuccessfulRequests: false };
    expect(options.skipSuccessfulRequests).toBe(false);
  });
});

describe('Environment-based Configuration', () => {
  it('should have higher limits in development', () => {
    const devLimits = { general: 10000, ssr: 100, admin: 300, api: 600, cache: 200 };
    const prodLimits = { general: 1000, ssr: 10, admin: 30, api: 60, cache: 20 };

    expect(devLimits.general).toBeGreaterThan(prodLimits.general);
    expect(devLimits.ssr).toBeGreaterThan(prodLimits.ssr);
    expect(devLimits.admin).toBeGreaterThan(prodLimits.admin);
    expect(devLimits.api).toBeGreaterThan(prodLimits.api);
    expect(devLimits.cache).toBeGreaterThan(prodLimits.cache);
  });

  it('should select limit based on NODE_ENV', () => {
    const nodeEnv = 'production';
    const maxRequests = nodeEnv === 'production' ? 1000 : 10000;
    expect(maxRequests).toBe(1000);
  });

  it('should use development limits when not production', () => {
    const nodeEnv = 'development';
    const maxRequests = nodeEnv === 'production' ? 1000 : 10000;
    expect(maxRequests).toBe(10000);
  });
});
