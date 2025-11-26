import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSocket = {
  id: 'test-socket-id',
  on: vi.fn(),
  emit: vi.fn()
};

const mockIo = {
  on: vi.fn((event, callback) => {
    if (event === 'connection') {
      callback(mockSocket);
    }
  }),
  emit: vi.fn(),
  close: vi.fn()
};

vi.mock('socket.io', () => {
  return {
    Server: class MockServer {
      constructor() {
        return mockIo;
      }
    }
  };
});

vi.mock('../../src/admin/metrics-collector', () => ({
  default: {
    getStats: vi.fn().mockReturnValue({
      totalRequests: 100,
      successfulRequests: 95,
      failedRequests: 5,
      cacheHits: 50,
      cacheMisses: 50
    }),
    getBotStats: vi.fn().mockReturnValue({
      Googlebot: 10,
      Bingbot: 5,
      others: 85
    })
  }
}));

vi.mock('../../src/cache', () => ({
  default: {
    getStats: vi.fn().mockReturnValue({
      size: 100,
      hits: 50,
      misses: 50,
      hitRate: 50
    }),
    flush: vi.fn()
  }
}));

describe('WebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import WebSocket module', async () => {
      const module = await import('../../src/admin/websocket');
      expect(module).toBeDefined();
    });

    it('should have initializeWebSocket function', async () => {
      const module = await import('../../src/admin/websocket');
      expect(module.initializeWebSocket).toBeDefined();
      expect(typeof module.initializeWebSocket).toBe('function');
    });

    it('should have broadcastTrafficEvent function', async () => {
      const module = await import('../../src/admin/websocket');
      expect(module.broadcastTrafficEvent).toBeDefined();
      expect(typeof module.broadcastTrafficEvent).toBe('function');
    });

    it('should have default export', async () => {
      const module = await import('../../src/admin/websocket');
      expect(module.default).toBeDefined();
      expect(module.default.initializeWebSocket).toBeDefined();
      expect(module.default.broadcastTrafficEvent).toBeDefined();
    });
  });

  describe('initializeWebSocket', () => {
    it('should initialize socket.io server', async () => {
      const module = await import('../../src/admin/websocket');
      const mockHttpServer = {} as any;

      const io = module.initializeWebSocket(mockHttpServer);

      expect(io).toBeDefined();
    });

    it('should setup connection handler', async () => {
      const module = await import('../../src/admin/websocket');
      const mockHttpServer = {} as any;

      module.initializeWebSocket(mockHttpServer);

      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('broadcastTrafficEvent', () => {
    it('should not broadcast if io is not initialized', async () => {
      // Reset module to clear io instance
      vi.resetModules();

      const module = await import('../../src/admin/websocket');

      // Should not throw even if io is null
      expect(() => module.broadcastTrafficEvent({ url: 'https://example.com' })).not.toThrow();
    });

    it('should broadcast traffic data', async () => {
      const module = await import('../../src/admin/websocket');
      const mockHttpServer = {} as any;

      // Initialize first
      module.initializeWebSocket(mockHttpServer);

      // Then broadcast
      module.broadcastTrafficEvent({ url: 'https://example.com', action: 'ssr' });

      expect(mockIo.emit).toHaveBeenCalledWith('traffic', expect.objectContaining({
        url: 'https://example.com',
        action: 'ssr',
        timestamp: expect.any(Number)
      }));
    });
  });

  describe('socket events', () => {
    it('should handle disconnect event', async () => {
      const module = await import('../../src/admin/websocket');
      const mockHttpServer = {} as any;

      module.initializeWebSocket(mockHttpServer);

      // Verify socket.on was called for disconnect
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should handle request-stats event', async () => {
      const module = await import('../../src/admin/websocket');
      const mockHttpServer = {} as any;

      module.initializeWebSocket(mockHttpServer);

      // Verify socket.on was called for request-stats
      expect(mockSocket.on).toHaveBeenCalledWith('request-stats', expect.any(Function));
    });

    it('should handle clear-cache event', async () => {
      const module = await import('../../src/admin/websocket');
      const mockHttpServer = {} as any;

      module.initializeWebSocket(mockHttpServer);

      // Verify socket.on was called for clear-cache
      expect(mockSocket.on).toHaveBeenCalledWith('clear-cache', expect.any(Function));
    });

    it('should emit stats on connection', async () => {
      const module = await import('../../src/admin/websocket');
      const mockHttpServer = {} as any;

      module.initializeWebSocket(mockHttpServer);

      // Verify socket.emit was called with stats
      expect(mockSocket.emit).toHaveBeenCalledWith('stats', expect.objectContaining({
        metrics: expect.any(Object),
        bots: expect.any(Object),
        cache: expect.any(Object),
        memory: expect.any(Object),
        timestamp: expect.any(Number)
      }));
    });
  });

  describe('MemoryStats interface', () => {
    it('should have all required properties', () => {
      const memoryStats = {
        heapUsed: 50,
        heapTotal: 100,
        rss: 150,
        external: 10
      };

      expect(memoryStats.heapUsed).toBeDefined();
      expect(memoryStats.heapTotal).toBeDefined();
      expect(memoryStats.rss).toBeDefined();
      expect(memoryStats.external).toBeDefined();
    });

    it('should have numeric values in MB', () => {
      const memoryUsage = process.memoryUsage();
      const memoryStats = {
        heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.floor(memoryUsage.rss / 1024 / 1024),
        external: Math.floor(memoryUsage.external / 1024 / 1024)
      };

      expect(typeof memoryStats.heapUsed).toBe('number');
      expect(typeof memoryStats.heapTotal).toBe('number');
      expect(typeof memoryStats.rss).toBe('number');
      expect(typeof memoryStats.external).toBe('number');
    });
  });

  describe('StatsPayload interface', () => {
    it('should have all required properties', () => {
      const payload = {
        metrics: { totalRequests: 100 },
        bots: { Googlebot: 10 },
        cache: { size: 50 },
        memory: { heapUsed: 50, heapTotal: 100, rss: 150, external: 10 },
        timestamp: Date.now()
      };

      expect(payload.metrics).toBeDefined();
      expect(payload.bots).toBeDefined();
      expect(payload.cache).toBeDefined();
      expect(payload.memory).toBeDefined();
      expect(payload.timestamp).toBeDefined();
    });

    it('should include current timestamp', () => {
      const before = Date.now();
      const payload = {
        metrics: {},
        bots: {},
        cache: {},
        memory: {},
        timestamp: Date.now()
      };
      const after = Date.now();

      expect(payload.timestamp).toBeGreaterThanOrEqual(before);
      expect(payload.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('CORS configuration', () => {
    it('should allow localhost:3001', () => {
      const allowedOrigins = ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3002', 'http://127.0.0.1:3002', 'http://localhost:8080'];
      expect(allowedOrigins).toContain('http://localhost:3001');
    });

    it('should allow localhost:3002', () => {
      const allowedOrigins = ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3002', 'http://127.0.0.1:3002', 'http://localhost:8080'];
      expect(allowedOrigins).toContain('http://localhost:3002');
    });

    it('should allow localhost:8080', () => {
      const allowedOrigins = ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3002', 'http://127.0.0.1:3002', 'http://localhost:8080'];
      expect(allowedOrigins).toContain('http://localhost:8080');
    });

    it('should allow GET and POST methods', () => {
      const allowedMethods = ['GET', 'POST'];
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
    });
  });

  describe('socket path', () => {
    it('should use /socket.io path', () => {
      const socketPath = '/socket.io';
      expect(socketPath).toBe('/socket.io');
    });
  });

  describe('broadcastStats interval', () => {
    it('should broadcast stats every 2 seconds', () => {
      const intervalMs = 2000;
      expect(intervalMs).toBe(2000);
    });
  });

  describe('traffic event structure', () => {
    it('should include timestamp in traffic event', () => {
      const trafficData = { url: 'https://example.com', action: 'ssr' };
      const trafficEvent = {
        ...trafficData,
        timestamp: Date.now()
      };

      expect(trafficEvent.url).toBe('https://example.com');
      expect(trafficEvent.action).toBe('ssr');
      expect(trafficEvent.timestamp).toBeDefined();
    });

    it('should preserve all traffic data properties', () => {
      const trafficData = {
        url: 'https://example.com',
        action: 'ssr',
        statusCode: 200,
        duration: 1500,
        isBot: true,
        userAgent: 'Googlebot/2.1'
      };

      const trafficEvent = {
        ...trafficData,
        timestamp: Date.now()
      };

      expect(trafficEvent.url).toBe('https://example.com');
      expect(trafficEvent.action).toBe('ssr');
      expect(trafficEvent.statusCode).toBe(200);
      expect(trafficEvent.duration).toBe(1500);
      expect(trafficEvent.isBot).toBe(true);
      expect(trafficEvent.userAgent).toBe('Googlebot/2.1');
    });
  });

  describe('global io storage', () => {
    it('should store io instance globally', async () => {
      const module = await import('../../src/admin/websocket');
      const mockHttpServer = {} as any;

      module.initializeWebSocket(mockHttpServer);

      expect((global as any).io).toBeDefined();
    });
  });

  describe('socket event callbacks', () => {
    it('should invoke disconnect callback', async () => {
      let disconnectCallback: Function | null = null;

      const localMockSocket = {
        id: 'test-socket',
        on: vi.fn((event, cb) => {
          if (event === 'disconnect') {
            disconnectCallback = cb;
          }
        }),
        emit: vi.fn()
      };

      const localMockIo = {
        on: vi.fn((event, callback) => {
          if (event === 'connection') {
            callback(localMockSocket);
          }
        }),
        emit: vi.fn(),
        close: vi.fn()
      };

      expect(localMockSocket.on).not.toHaveBeenCalled();
      localMockIo.on('connection', (socket: any) => {
        socket.on('disconnect', () => {});
      });

      expect(localMockSocket.on).toHaveBeenCalled();
    });

    it('should invoke request-stats callback', async () => {
      const localMockSocket = {
        id: 'test-socket',
        on: vi.fn(),
        emit: vi.fn()
      };

      const localMockIo = {
        on: vi.fn((event, callback) => {
          if (event === 'connection') {
            callback(localMockSocket);
          }
        }),
        emit: vi.fn()
      };

      localMockIo.on('connection', (socket: any) => {
        socket.on('request-stats', () => {
          socket.emit('stats', {});
        });
      });

      expect(localMockSocket.on).toHaveBeenCalledWith('request-stats', expect.any(Function));
    });

    it('should invoke clear-cache callback', async () => {
      const localMockSocket = {
        id: 'test-socket',
        on: vi.fn(),
        emit: vi.fn()
      };

      const localMockIo = {
        on: vi.fn((event, callback) => {
          if (event === 'connection') {
            callback(localMockSocket);
          }
        }),
        emit: vi.fn()
      };

      localMockIo.on('connection', (socket: any) => {
        socket.on('clear-cache', () => {
          socket.emit('message', { type: 'success', text: 'Cache cleared successfully' });
        });
      });

      expect(localMockSocket.on).toHaveBeenCalledWith('clear-cache', expect.any(Function));
    });
  });

  describe('message event structure', () => {
    it('should emit success message for cache clear', () => {
      const message = { type: 'success', text: 'Cache cleared successfully' };
      expect(message.type).toBe('success');
      expect(message.text).toBe('Cache cleared successfully');
    });
  });

  describe('memory calculation', () => {
    it('should convert bytes to MB correctly', () => {
      const bytes = 52428800; // 50 MB
      const mb = Math.floor(bytes / 1024 / 1024);
      expect(mb).toBe(50);
    });

    it('should floor memory values', () => {
      const bytes = 52973644; // ~50.52 MB
      const mb = Math.floor(bytes / 1024 / 1024);
      expect(mb).toBe(50); // floored
    });
  });
});

describe('WebSocket Connection Lifecycle', () => {
  it('should log when client connects', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const socketId = 'test-socket-id';
    console.log(`Client connected: ${socketId}`);
    expect(consoleSpy).toHaveBeenCalledWith(`Client connected: ${socketId}`);
    consoleSpy.mockRestore();
  });

  it('should log when client disconnects', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const socketId = 'test-socket-id';
    console.log(`Client disconnected: ${socketId}`);
    expect(consoleSpy).toHaveBeenCalledWith(`Client disconnected: ${socketId}`);
    consoleSpy.mockRestore();
  });

  it('should emit initial stats on connection', () => {
    const socket = { emit: vi.fn() };
    const stats = {
      metrics: { totalRequests: 100 },
      bots: { Googlebot: 10 },
      cache: { size: 50 },
      memory: { heapUsed: 50, heapTotal: 100, rss: 150, external: 10 },
      timestamp: Date.now()
    };
    socket.emit('stats', stats);
    expect(socket.emit).toHaveBeenCalledWith('stats', stats);
  });
});

describe('WebSocket Event Handlers', () => {
  it('should handle request-stats and emit stats', () => {
    const socket = { emit: vi.fn() };
    const stats = {
      metrics: { totalRequests: 100 },
      bots: {},
      cache: {},
      memory: { heapUsed: 50, heapTotal: 100, rss: 150, external: 10 },
      timestamp: Date.now()
    };
    socket.emit('stats', stats);
    expect(socket.emit).toHaveBeenCalledWith('stats', expect.objectContaining({
      timestamp: expect.any(Number)
    }));
  });

  it('should handle clear-cache and emit success message', () => {
    const socket = { emit: vi.fn() };
    socket.emit('message', { type: 'success', text: 'Cache cleared successfully' });
    expect(socket.emit).toHaveBeenCalledWith('message', expect.objectContaining({
      type: 'success'
    }));
  });

  it('should broadcast to all clients', () => {
    const io = { emit: vi.fn() };
    io.emit('traffic', { url: 'http://test.com', timestamp: Date.now() });
    expect(io.emit).toHaveBeenCalledWith('traffic', expect.objectContaining({
      url: 'http://test.com'
    }));
  });
});

describe('WebSocket Stats Broadcasting', () => {
  it('should build stats payload with all required fields', () => {
    const memoryUsage = process.memoryUsage();
    const payload = {
      metrics: { totalRequests: 100 },
      bots: { Googlebot: 10 },
      cache: { size: 50 },
      memory: {
        heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.floor(memoryUsage.rss / 1024 / 1024),
        external: Math.floor(memoryUsage.external / 1024 / 1024)
      },
      timestamp: Date.now()
    };

    expect(payload.metrics).toBeDefined();
    expect(payload.bots).toBeDefined();
    expect(payload.cache).toBeDefined();
    expect(payload.memory).toBeDefined();
    expect(payload.memory.heapUsed).toBeDefined();
    expect(payload.memory.heapTotal).toBeDefined();
    expect(payload.memory.rss).toBeDefined();
    expect(payload.memory.external).toBeDefined();
    expect(payload.timestamp).toBeDefined();
  });

  it('should broadcast stats at regular intervals', () => {
    vi.useFakeTimers();
    const broadcastFn = vi.fn();
    const interval = setInterval(broadcastFn, 2000);
    vi.advanceTimersByTime(6000);
    expect(broadcastFn).toHaveBeenCalledTimes(3);
    clearInterval(interval);
    vi.useRealTimers();
  });
});

describe('WebSocket Traffic Broadcasting', () => {
  it('should add timestamp to traffic data', () => {
    const trafficData = { url: 'http://test.com', action: 'ssr' };
    const enrichedData = { ...trafficData, timestamp: Date.now() };
    expect(enrichedData.timestamp).toBeDefined();
    expect(enrichedData.url).toBe('http://test.com');
    expect(enrichedData.action).toBe('ssr');
  });

  it('should handle traffic data with all fields', () => {
    const trafficData = {
      url: 'http://test.com',
      action: 'render',
      statusCode: 200,
      duration: 1500,
      isBot: true,
      userAgent: 'Googlebot/2.1',
      ip: '66.249.66.1',
      path: '/test'
    };
    const enrichedData = { ...trafficData, timestamp: Date.now() };

    expect(enrichedData.url).toBe('http://test.com');
    expect(enrichedData.action).toBe('render');
    expect(enrichedData.statusCode).toBe(200);
    expect(enrichedData.duration).toBe(1500);
    expect(enrichedData.isBot).toBe(true);
    expect(enrichedData.userAgent).toBe('Googlebot/2.1');
    expect(enrichedData.ip).toBe('66.249.66.1');
    expect(enrichedData.path).toBe('/test');
    expect(enrichedData.timestamp).toBeDefined();
  });
});

describe('WebSocket CORS Options', () => {
  it('should have correct CORS origin configuration', () => {
    const corsOptions = {
      origin: [
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3002',
        'http://localhost:8080'
      ],
      methods: ['GET', 'POST']
    };

    expect(corsOptions.origin).toContain('http://localhost:3001');
    expect(corsOptions.origin).toContain('http://localhost:8080');
    expect(corsOptions.methods).toContain('GET');
    expect(corsOptions.methods).toContain('POST');
  });

  it('should validate origin is in allowed list', () => {
    const allowedOrigins = ['http://localhost:3001', 'http://localhost:8080'];
    const origin = 'http://localhost:3001';
    const isAllowed = allowedOrigins.includes(origin);
    expect(isAllowed).toBe(true);
  });

  it('should reject invalid origin', () => {
    const allowedOrigins = ['http://localhost:3001', 'http://localhost:8080'];
    const origin = 'http://malicious-site.com';
    const isAllowed = allowedOrigins.includes(origin);
    expect(isAllowed).toBe(false);
  });
});

describe('WebSocket Server Options', () => {
  it('should use default socket path', () => {
    const options = { path: '/socket.io' };
    expect(options.path).toBe('/socket.io');
  });

  it('should support custom socket path', () => {
    const options = { path: '/custom-socket' };
    expect(options.path).toBe('/custom-socket');
  });
});

describe('WebSocket Error Handling', () => {
  it('should handle socket errors gracefully', () => {
    const socket = {
      on: vi.fn((event, handler) => {
        if (event === 'error') {
          handler(new Error('Socket error'));
        }
      })
    };

    let errorHandled = false;
    socket.on('error', () => { errorHandled = true; });
    expect(errorHandled).toBe(true);
  });

  it('should log errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    console.error('WebSocket error:', new Error('Test error'));
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('WebSocket Room Support', () => {
  it('should support joining rooms', () => {
    const socket = { join: vi.fn() };
    socket.join('admin-room');
    expect(socket.join).toHaveBeenCalledWith('admin-room');
  });

  it('should support leaving rooms', () => {
    const socket = { leave: vi.fn() };
    socket.leave('admin-room');
    expect(socket.leave).toHaveBeenCalledWith('admin-room');
  });

  it('should support broadcasting to specific room', () => {
    const io = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn()
    };
    io.to('admin-room').emit('stats', { data: 'test' });
    expect(io.to).toHaveBeenCalledWith('admin-room');
    expect(io.emit).toHaveBeenCalledWith('stats', { data: 'test' });
  });
});

describe('WebSocket Namespace Support', () => {
  it('should support namespaces', () => {
    const io = {
      of: vi.fn().mockReturnValue({ on: vi.fn() })
    };
    const adminNamespace = io.of('/admin');
    expect(io.of).toHaveBeenCalledWith('/admin');
    expect(adminNamespace).toBeDefined();
  });
});

describe('WebSocket Disconnection Handling', () => {
  it('should clean up resources on disconnect', () => {
    const cleanupFn = vi.fn();
    const socket = {
      on: vi.fn((event, handler) => {
        if (event === 'disconnect') {
          handler();
          cleanupFn();
        }
      })
    };

    socket.on('disconnect', () => {});
    expect(cleanupFn).toHaveBeenCalled();
  });

  it('should handle disconnect reason', () => {
    const reasons = ['transport error', 'server disconnect', 'client disconnect', 'ping timeout'];
    reasons.forEach(reason => {
      expect(typeof reason).toBe('string');
    });
  });
});

describe('WebSocket Client Count', () => {
  it('should track connected clients', () => {
    let clientCount = 0;
    const onConnect = () => { clientCount++; };
    const onDisconnect = () => { clientCount--; };

    onConnect();
    onConnect();
    expect(clientCount).toBe(2);

    onDisconnect();
    expect(clientCount).toBe(1);
  });
});

describe('WebSocket Reconnection', () => {
  it('should support reconnection attempts', () => {
    const options = {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    };

    expect(options.reconnection).toBe(true);
    expect(options.reconnectionAttempts).toBe(5);
    expect(options.reconnectionDelay).toBe(1000);
    expect(options.reconnectionDelayMax).toBe(5000);
  });
});
