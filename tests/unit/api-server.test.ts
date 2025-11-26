import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApp = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  listen: vi.fn((port: number, cb: () => void) => { if (cb) cb(); return { close: vi.fn() }; }),
  disable: vi.fn()
};

vi.mock('express', () => ({
  default: Object.assign(vi.fn(() => mockApp), {
    json: vi.fn(() => vi.fn()),
    urlencoded: vi.fn(() => vi.fn()),
    static: vi.fn(() => vi.fn())
  })
}));

vi.mock('cors', () => ({
  default: vi.fn(() => (req: any, res: any, next: any) => next())
}));

vi.mock('http', () => ({
  createServer: vi.fn(() => ({
    listen: vi.fn((...args: any[]) => {
      const cb = args.find(arg => typeof arg === 'function');
      if (cb) cb();
      return { close: vi.fn() };
    }),
    close: vi.fn(),
    on: vi.fn()
  }))
}));

vi.mock('../../src/config', () => ({
  default: {
    API_PORT: 8190,
    PORT: 8080,
    TARGET_URL: 'http://localhost:3000',
    ADMIN_PASSWORD: 'test',
    JWT_SECRET: 'test-secret',
    NODE_ENV: 'test'
  }
}));

vi.mock('../../src/cache', () => ({
  default: { get: vi.fn(), set: vi.fn(), getStats: vi.fn().mockReturnValue({}) },
  getCache: vi.fn().mockResolvedValue({ get: vi.fn(), set: vi.fn() })
}));

vi.mock('../../src/admin/admin-routes', () => ({
  default: vi.fn()
}));

vi.mock('../../src/admin/websocket', () => ({
  initializeWebSocket: vi.fn()
}));

describe('API Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import api-server module', async () => {
    const module = await import('../../src/api-server');
    expect(module).toBeDefined();
  });
});
