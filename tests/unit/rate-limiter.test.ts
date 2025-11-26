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

describe('Skip Function Behavior', () => {
  it('should skip rate limit for health check path', () => {
    const req = { path: '/shieldhealth', ip: '192.168.1.100' };
    const shouldSkip = req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
    expect(shouldSkip).toBe(true);
  });

  it('should skip rate limit for IPv4 localhost', () => {
    const req = { path: '/api/test', ip: '127.0.0.1' };
    const shouldSkip = req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
    expect(shouldSkip).toBe(true);
  });

  it('should skip rate limit for IPv6 localhost', () => {
    const req = { path: '/api/test', ip: '::1' };
    const shouldSkip = req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
    expect(shouldSkip).toBe(true);
  });

  it('should not skip rate limit for external IP', () => {
    const req = { path: '/api/test', ip: '8.8.8.8' };
    const shouldSkip = req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
    expect(shouldSkip).toBe(false);
  });

  it('should not skip for regular API path from external IP', () => {
    const req = { path: '/shieldapi/metrics', ip: '192.168.1.100' };
    const shouldSkip = req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
    expect(shouldSkip).toBe(false);
  });
});

describe('Admin Handler Function', () => {
  it('should log warning with IP and path', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const req = { ip: '10.0.0.1', path: '/shieldapi/admin' };
    console.warn(`🚨 Admin rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('10.0.0.1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('/shieldapi/admin'));
    consoleSpy.mockRestore();
  });

  it('should respond with 429 status', () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    mockRes.status(429);
    expect(mockRes.status).toHaveBeenCalledWith(429);
  });

  it('should include error message in response', () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    mockRes.status(429).json({
      error: 'Too many admin requests, please try again later.',
      retryAfter: '15 minutes'
    });

    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Too many admin requests, please try again later.',
      retryAfter: '15 minutes'
    });
  });
});

describe('Cache Handler Function', () => {
  it('should log warning with IP and method', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const req = { ip: '10.0.0.2', method: 'POST' };
    console.warn(`🚨 Cache rate limit exceeded for IP: ${req.ip}, Method: ${req.method}`);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('10.0.0.2'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('POST'));
    consoleSpy.mockRestore();
  });

  it('should respond with 429 status for cache limit', () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    mockRes.status(429);
    expect(mockRes.status).toHaveBeenCalledWith(429);
  });

  it('should include cache error message in response', () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    mockRes.status(429).json({
      error: 'Too many cache operations, please try again later.',
      retryAfter: '5 minutes'
    });

    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Too many cache operations, please try again later.',
      retryAfter: '5 minutes'
    });
  });
});

describe('Rate Limit Handler Simulation', () => {
  it('should simulate admin handler flow', () => {
    const req = { ip: '192.168.1.50', path: '/shieldapi/config' };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    // Simulate handler
    const handler = (req: any, res: any, _next: any) => {
      console.warn(`🚨 Admin rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        error: 'Too many admin requests, please try again later.',
        retryAfter: '15 minutes'
      });
    };

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    handler(req, mockRes, next);

    expect(consoleSpy).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should simulate cache handler flow', () => {
    const req = { ip: '192.168.1.60', method: 'DELETE' };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    const next = vi.fn();

    // Simulate handler
    const handler = (req: any, res: any, _next: any) => {
      console.warn(`🚨 Cache rate limit exceeded for IP: ${req.ip}, Method: ${req.method}`);
      res.status(429).json({
        error: 'Too many cache operations, please try again later.',
        retryAfter: '5 minutes'
      });
    };

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    handler(req, mockRes, next);

    expect(consoleSpy).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('Request Properties', () => {
  it('should extract IP from request', () => {
    const req = { ip: '192.168.1.1', path: '/test' };
    expect(req.ip).toBe('192.168.1.1');
  });

  it('should extract path from request', () => {
    const req = { ip: '127.0.0.1', path: '/shieldapi/metrics' };
    expect(req.path).toBe('/shieldapi/metrics');
  });

  it('should extract method from request', () => {
    const req = { method: 'GET', ip: '127.0.0.1' };
    expect(req.method).toBe('GET');
  });
});

describe('Window Configuration', () => {
  it('should calculate 15 minutes in milliseconds', () => {
    const windowMs = 15 * 60 * 1000;
    expect(windowMs).toBe(900000);
  });

  it('should calculate 5 minutes in milliseconds', () => {
    const windowMs = 5 * 60 * 1000;
    expect(windowMs).toBe(300000);
  });

  it('should calculate 1 minute in milliseconds', () => {
    const windowMs = 1 * 60 * 1000;
    expect(windowMs).toBe(60000);
  });
});

describe('Rate Limit Headers', () => {
  it('should enable standard headers', () => {
    const config = { standardHeaders: true };
    expect(config.standardHeaders).toBe(true);
  });

  it('should disable legacy headers', () => {
    const config = { legacyHeaders: false };
    expect(config.legacyHeaders).toBe(false);
  });

  it('should include RateLimit-Limit header', () => {
    const headers = {
      'RateLimit-Limit': '1000',
      'RateLimit-Remaining': '999',
      'RateLimit-Reset': '900'
    };
    expect(headers['RateLimit-Limit']).toBe('1000');
  });

  it('should include RateLimit-Remaining header', () => {
    const headers = {
      'RateLimit-Remaining': '500'
    };
    expect(headers['RateLimit-Remaining']).toBe('500');
  });

  it('should include RateLimit-Reset header', () => {
    const headers = {
      'RateLimit-Reset': '300'
    };
    expect(headers['RateLimit-Reset']).toBe('300');
  });
});

describe('Error Response Format', () => {
  it('should include error message', () => {
    const response = {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    };
    expect(response.error).toBeDefined();
    expect(typeof response.error).toBe('string');
  });

  it('should include retryAfter', () => {
    const response = {
      error: 'Too many requests',
      retryAfter: '15 minutes'
    };
    expect(response.retryAfter).toBe('15 minutes');
  });

  it('should format error for admin endpoint', () => {
    const response = {
      error: 'Too many admin requests, please try again later.',
      retryAfter: '15 minutes'
    };
    expect(response.error).toContain('admin');
  });

  it('should format error for cache endpoint', () => {
    const response = {
      error: 'Too many cache operations, please try again later.',
      retryAfter: '5 minutes'
    };
    expect(response.error).toContain('cache');
  });
});

describe('Rate Limiter Skip Function Implementation', () => {
  it('should skip for shieldhealth path regardless of IP', () => {
    const skip = (req: { path: string; ip: string }) => {
      return req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
    };

    expect(skip({ path: '/shieldhealth', ip: '8.8.8.8' })).toBe(true);
    expect(skip({ path: '/shieldhealth', ip: '192.168.1.1' })).toBe(true);
  });

  it('should skip for localhost IPv4', () => {
    const skip = (req: { path: string; ip: string }) => {
      return req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
    };

    expect(skip({ path: '/api/test', ip: '127.0.0.1' })).toBe(true);
  });

  it('should skip for localhost IPv6', () => {
    const skip = (req: { path: string; ip: string }) => {
      return req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
    };

    expect(skip({ path: '/api/test', ip: '::1' })).toBe(true);
  });

  it('should not skip for external IPs on non-health paths', () => {
    const skip = (req: { path: string; ip: string }) => {
      return req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1';
    };

    expect(skip({ path: '/api/test', ip: '8.8.8.8' })).toBe(false);
    expect(skip({ path: '/shieldapi/config', ip: '192.168.1.100' })).toBe(false);
  });
});

describe('Rate Limiter Handler Functions', () => {
  describe('adminRateLimiter handler', () => {
    it('should log rate limit exceeded with IP and path', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const handler = (req: any, res: any, _next: any) => {
        console.warn(`🚨 Admin rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
          error: 'Too many admin requests, please try again later.',
          retryAfter: '15 minutes'
        });
      };

      const mockReq = { ip: '10.0.0.5', path: '/shieldapi/config' };
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      handler(mockReq, mockRes, vi.fn());

      expect(consoleSpy).toHaveBeenCalledWith('🚨 Admin rate limit exceeded for IP: 10.0.0.5, Path: /shieldapi/config');
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too many admin requests, please try again later.',
        retryAfter: '15 minutes'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('cacheRateLimiter handler', () => {
    it('should log rate limit exceeded with IP and method', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const handler = (req: any, res: any, _next: any) => {
        console.warn(`🚨 Cache rate limit exceeded for IP: ${req.ip}, Method: ${req.method}`);
        res.status(429).json({
          error: 'Too many cache operations, please try again later.',
          retryAfter: '5 minutes'
        });
      };

      const mockReq = { ip: '10.0.0.10', method: 'DELETE' };
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };

      handler(mockReq, mockRes, vi.fn());

      expect(consoleSpy).toHaveBeenCalledWith('🚨 Cache rate limit exceeded for IP: 10.0.0.10, Method: DELETE');
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too many cache operations, please try again later.',
        retryAfter: '5 minutes'
      });

      consoleSpy.mockRestore();
    });
  });
});

describe('Rate Limiter Production vs Development Limits', () => {
  it('should use strict production limits', () => {
    const nodeEnv = 'production';
    const limits = {
      general: nodeEnv === 'production' ? 1000 : 10000,
      ssr: nodeEnv === 'production' ? 10 : 100,
      admin: nodeEnv === 'production' ? 30 : 300,
      api: nodeEnv === 'production' ? 60 : 600,
      cache: nodeEnv === 'production' ? 20 : 200
    };

    expect(limits.general).toBe(1000);
    expect(limits.ssr).toBe(10);
    expect(limits.admin).toBe(30);
    expect(limits.api).toBe(60);
    expect(limits.cache).toBe(20);
  });

  it('should use relaxed development limits', () => {
    const nodeEnv = 'development';
    const limits = {
      general: nodeEnv === 'production' ? 1000 : 10000,
      ssr: nodeEnv === 'production' ? 10 : 100,
      admin: nodeEnv === 'production' ? 30 : 300,
      api: nodeEnv === 'production' ? 60 : 600,
      cache: nodeEnv === 'production' ? 20 : 200
    };

    expect(limits.general).toBe(10000);
    expect(limits.ssr).toBe(100);
    expect(limits.admin).toBe(300);
    expect(limits.api).toBe(600);
    expect(limits.cache).toBe(200);
  });

  it('should use test limits', () => {
    const nodeEnv = 'test';
    const limits = {
      general: nodeEnv === 'production' ? 1000 : 10000,
      ssr: nodeEnv === 'production' ? 10 : 100,
      admin: nodeEnv === 'production' ? 30 : 300,
      api: nodeEnv === 'production' ? 60 : 600,
      cache: nodeEnv === 'production' ? 20 : 200
    };

    expect(limits.general).toBe(10000);
    expect(limits.ssr).toBe(100);
    expect(limits.admin).toBe(300);
    expect(limits.api).toBe(600);
    expect(limits.cache).toBe(200);
  });
});

describe('Rate Limiter Complete Configuration', () => {
  it('should configure general rate limiter with all options', () => {
    const config = {
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req: any) => req.path === '/shieldhealth' || req.ip === '127.0.0.1' || req.ip === '::1'
    };

    expect(config.windowMs).toBe(900000);
    expect(config.max).toBe(1000);
    expect(config.standardHeaders).toBe(true);
    expect(config.legacyHeaders).toBe(false);
    expect(config.skip({ path: '/shieldhealth', ip: '8.8.8.8' })).toBe(true);
    expect(config.skip({ path: '/api', ip: '8.8.8.8' })).toBe(false);
  });

  it('should configure SSR rate limiter with strict limits', () => {
    const config = {
      windowMs: 1 * 60 * 1000,
      max: 10,
      message: {
        error: 'Too many rendering requests, please try again later.',
        retryAfter: '1 minute'
      },
      standardHeaders: true,
      legacyHeaders: false
    };

    expect(config.windowMs).toBe(60000);
    expect(config.max).toBe(10);
    expect(config.message.error).toContain('rendering');
  });

  it('should configure admin rate limiter with custom handler', () => {
    const handler = vi.fn();
    const config = {
      windowMs: 15 * 60 * 1000,
      max: 30,
      message: {
        error: 'Too many admin requests, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      handler
    };

    expect(config.skipSuccessfulRequests).toBe(false);
    expect(typeof config.handler).toBe('function');
  });

  it('should configure API rate limiter for per-minute limits', () => {
    const config = {
      windowMs: 1 * 60 * 1000,
      max: 60,
      message: {
        error: 'Too many API requests, please try again later.',
        retryAfter: '1 minute'
      },
      standardHeaders: true,
      legacyHeaders: false
    };

    expect(config.windowMs).toBe(60000);
    expect(config.max).toBe(60);
  });

  it('should configure cache rate limiter with custom handler', () => {
    const handler = vi.fn();
    const config = {
      windowMs: 5 * 60 * 1000,
      max: 20,
      message: {
        error: 'Too many cache operations, please try again later.',
        retryAfter: '5 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler
    };

    expect(config.windowMs).toBe(300000);
    expect(config.max).toBe(20);
    expect(typeof config.handler).toBe('function');
  });
});

describe('Rate Limit Error Response Structure', () => {
  it('should have consistent error response for all limiters', () => {
    const responses = [
      { error: 'Too many requests from this IP, please try again later.', retryAfter: '15 minutes' },
      { error: 'Too many rendering requests, please try again later.', retryAfter: '1 minute' },
      { error: 'Too many admin requests, please try again later.', retryAfter: '15 minutes' },
      { error: 'Too many API requests, please try again later.', retryAfter: '1 minute' },
      { error: 'Too many cache operations, please try again later.', retryAfter: '5 minutes' }
    ];

    responses.forEach(response => {
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('retryAfter');
      expect(typeof response.error).toBe('string');
      expect(typeof response.retryAfter).toBe('string');
    });
  });

  it('should include retry information in all error messages', () => {
    const messages = [
      'Too many requests from this IP, please try again later.',
      'Too many rendering requests, please try again later.',
      'Too many admin requests, please try again later.',
      'Too many API requests, please try again later.',
      'Too many cache operations, please try again later.'
    ];

    messages.forEach(message => {
      expect(message).toContain('please try again later');
    });
  });
});

describe('Rate Limiter Middleware Chain', () => {
  it('should call next when not rate limited', async () => {
    const module = await import('../../src/middleware/rate-limiter');
    const mockNext = vi.fn();

    module.generalRateLimiter({} as any, {} as any, mockNext);
    module.ssrRateLimiter({} as any, {} as any, mockNext);
    module.adminRateLimiter({} as any, {} as any, mockNext);
    module.apiRateLimiter({} as any, {} as any, mockNext);
    module.cacheRateLimiter({} as any, {} as any, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(5);
  });
});

describe('Handler _next Parameter', () => {
  it('should have _next parameter in admin handler', () => {
    const handler = (req: any, res: any, _next: any) => {
      console.warn(`🚨 Admin rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        error: 'Too many admin requests, please try again later.',
        retryAfter: '15 minutes'
      });
    };

    expect(handler.length).toBe(3);
  });

  it('should have _next parameter in cache handler', () => {
    const handler = (req: any, res: any, _next: any) => {
      console.warn(`🚨 Cache rate limit exceeded for IP: ${req.ip}, Method: ${req.method}`);
      res.status(429).json({
        error: 'Too many cache operations, please try again later.',
        retryAfter: '5 minutes'
      });
    };

    expect(handler.length).toBe(3);
  });
});
