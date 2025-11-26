import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('SSREventsStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../../src/admin/ssr-events-store');
    module.default.reset();
  });

  describe('module import', () => {
    it('should import SSREventsStore', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      expect(module.default).toBeDefined();
    });

    it('should export ssrEventsStore named export', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      expect(module.ssrEventsStore).toBeDefined();
    });
  });

  describe('methods existence', () => {
    it('should have addEvent method', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      expect(typeof module.default.addEvent).toBe('function');
    });

    it('should have getEvents method', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      expect(typeof module.default.getEvents).toBe('function');
    });

    it('should have getRecentEvents method', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      expect(typeof module.default.getRecentEvents).toBe('function');
    });

    it('should have getEventsByType method', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      expect(typeof module.default.getEventsByType).toBe('function');
    });

    it('should have getStats method', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      expect(typeof module.default.getStats).toBe('function');
    });

    it('should have reset method', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      expect(typeof module.default.reset).toBe('function');
    });

    it('should have getEventCount method', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      expect(typeof module.default.getEventCount).toBe('function');
    });
  });

  describe('addEvent', () => {
    it('should add render_start event', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      store.addEvent({
        id: 'test1',
        event: 'render_start',
        url: 'http://test.com',
        timestamp: Date.now()
      });

      const events = store.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe('render_start');
    });

    it('should add render_complete event', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      store.addEvent({
        id: 'test2',
        event: 'render_complete',
        url: 'http://test.com',
        timestamp: Date.now(),
        duration: 500,
        success: true,
        htmlLength: 1000,
        statusCode: 200
      });

      const events = store.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe('render_complete');
    });

    it('should add render_error event', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      store.addEvent({
        id: 'test3',
        event: 'render_error',
        url: 'http://test.com',
        timestamp: Date.now(),
        duration: 200,
        success: false,
        error: 'Test error'
      });

      const events = store.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe('render_error');
    });

    it('should add health_check event', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      store.addEvent({
        id: 'test4',
        event: 'health_check',
        url: 'http://test.com',
        timestamp: Date.now(),
        score: 95,
        passed: true,
        issues: []
      });

      const events = store.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].event).toBe('health_check');
    });

    it('should keep newest events first', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      store.addEvent({
        id: 'first',
        event: 'render_complete',
        url: 'http://test.com/first',
        timestamp: Date.now() - 1000,
        duration: 100
      });

      store.addEvent({
        id: 'second',
        event: 'render_complete',
        url: 'http://test.com/second',
        timestamp: Date.now(),
        duration: 200
      });

      const events = store.getEvents();
      expect(events[0].id).toBe('second');
      expect(events[1].id).toBe('first');
    });
  });

  describe('getRecentEvents', () => {
    it('should get recent events with default limit', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      for (let i = 0; i < 60; i++) {
        store.addEvent({
          id: `test${i}`,
          event: 'render_complete',
          url: `http://test.com/${i}`,
          timestamp: Date.now(),
          duration: 100
        });
      }

      const events = store.getRecentEvents();
      expect(events.length).toBe(50); // Default limit
    });

    it('should get recent events with custom limit', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      for (let i = 0; i < 20; i++) {
        store.addEvent({
          id: `test${i}`,
          event: 'render_complete',
          url: `http://test.com/${i}`,
          timestamp: Date.now(),
          duration: 100
        });
      }

      const events = store.getRecentEvents(5);
      expect(events.length).toBe(5);
    });
  });

  describe('getEventsByType', () => {
    it('should filter events by type', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      store.addEvent({ id: '1', event: 'render_start', url: 'http://test.com', timestamp: Date.now() });
      store.addEvent({ id: '2', event: 'render_complete', url: 'http://test.com', timestamp: Date.now(), duration: 100 });
      store.addEvent({ id: '3', event: 'render_error', url: 'http://test.com', timestamp: Date.now(), duration: 50 });
      store.addEvent({ id: '4', event: 'render_complete', url: 'http://test.com', timestamp: Date.now(), duration: 100 });

      const completeEvents = store.getEventsByType('render_complete');
      expect(completeEvents.length).toBe(2);
      expect(completeEvents.every(e => e.event === 'render_complete')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      for (let i = 0; i < 10; i++) {
        store.addEvent({
          id: `test${i}`,
          event: 'render_complete',
          url: `http://test.com/${i}`,
          timestamp: Date.now(),
          duration: 100
        });
      }

      const events = store.getEventsByType('render_complete', 3);
      expect(events.length).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return stats object with initial values', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      const stats = store.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalRenders).toBe(0);
      expect(stats.successfulRenders).toBe(0);
      expect(stats.failedRenders).toBe(0);
      expect(stats.activeRenders).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.avgRenderTime).toBe(0);
    });

    it('should calculate correct stats after events', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      // Simulate render flow
      store.addEvent({ id: '1', event: 'render_start', url: 'http://test.com', timestamp: Date.now() });
      store.addEvent({ id: '1', event: 'render_complete', url: 'http://test.com', timestamp: Date.now(), duration: 500 });
      store.addEvent({ id: '2', event: 'render_start', url: 'http://test.com', timestamp: Date.now() });
      store.addEvent({ id: '2', event: 'render_complete', url: 'http://test.com', timestamp: Date.now(), duration: 300 });
      store.addEvent({ id: '3', event: 'render_start', url: 'http://test.com', timestamp: Date.now() });
      store.addEvent({ id: '3', event: 'render_error', url: 'http://test.com', timestamp: Date.now(), duration: 100 });

      const stats = store.getStats();
      expect(stats.totalRenders).toBe(3);
      expect(stats.successfulRenders).toBe(2);
      expect(stats.failedRenders).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
      expect(stats.avgRenderTime).toBe(400); // (500 + 300) / 2
    });

    it('should track active renders', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      store.addEvent({ id: '1', event: 'render_start', url: 'http://test.com', timestamp: Date.now() });
      store.addEvent({ id: '2', event: 'render_start', url: 'http://test.com', timestamp: Date.now() });

      let stats = store.getStats();
      expect(stats.activeRenders).toBe(2);

      store.addEvent({ id: '1', event: 'render_complete', url: 'http://test.com', timestamp: Date.now(), duration: 100 });

      stats = store.getStats();
      expect(stats.activeRenders).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset all events and stats', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      store.addEvent({ id: '1', event: 'render_complete', url: 'http://test.com', timestamp: Date.now(), duration: 100 });
      store.addEvent({ id: '2', event: 'render_complete', url: 'http://test.com', timestamp: Date.now(), duration: 200 });

      expect(store.getEventCount()).toBe(2);

      store.reset();

      expect(store.getEventCount()).toBe(0);
      const stats = store.getStats();
      expect(stats.totalRenders).toBe(0);
    });
  });

  describe('getEventCount', () => {
    it('should return correct event count', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      expect(store.getEventCount()).toBe(0);

      store.addEvent({ id: '1', event: 'render_complete', url: 'http://test.com', timestamp: Date.now(), duration: 100 });
      expect(store.getEventCount()).toBe(1);

      store.addEvent({ id: '2', event: 'render_complete', url: 'http://test.com', timestamp: Date.now(), duration: 100 });
      expect(store.getEventCount()).toBe(2);
    });
  });

  describe('event limit', () => {
    it('should limit events to maxEvents', async () => {
      const module = await import('../../src/admin/ssr-events-store');
      const store = module.default;

      // Add more than maxEvents (1000)
      for (let i = 0; i < 1050; i++) {
        store.addEvent({
          id: `test${i}`,
          event: 'render_complete',
          url: `http://test.com/${i}`,
          timestamp: Date.now(),
          duration: 100
        });
      }

      const count = store.getEventCount();
      expect(count).toBeLessThanOrEqual(1000);
    });
  });
});
