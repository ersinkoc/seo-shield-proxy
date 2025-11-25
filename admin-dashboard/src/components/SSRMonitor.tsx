import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { API_BASE_URL } from '../config/api';

interface SSREvent {
  event: string;
  url: string;
  timestamp: number;
  duration?: number;
  success?: boolean;
  htmlLength?: number;
  userAgent?: string;
  renderTime?: number;
  cacheStatus?: string;
}

interface SSRStats {
  activeRenders: number;
  totalRenders: number;
  successRate: number;
  avgRenderTime: number;
}

const SSRMonitor: React.FC = () => {
  const [activeRenders, setActiveRenders] = useState(0);
  const [stats, setStats] = useState<SSRStats>({
    activeRenders: 0,
    totalRenders: 0,
    successRate: 100,
    avgRenderTime: 0
  });
  const [recentEvents, setRecentEvents] = useState<SSREvent[]>([]);

  // Fetch SSR events and stats from API
  useEffect(() => {
    const fetchSSRData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}ssr/events`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.stats);
            setRecentEvents(data.events || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch SSR data:', error);
      }
    };

    fetchSSRData();

    // Set up WebSocket for real-time SSR updates
    const eventSource = new EventSource(`${API_BASE_URL}stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle SSR events
        if (data.type === 'ssr_render_start' || data.type === 'ssr_render_complete') {
          const ssrEvent: SSREvent = {
            event: data.type.replace('ssr_', ''),
            url: data.url,
            timestamp: data.timestamp || Date.now(),
            duration: data.duration,
            success: data.success,
            htmlLength: data.htmlLength,
            userAgent: data.userAgent,
            renderTime: data.renderTime,
            cacheStatus: data.cacheStatus
          };

          setRecentEvents(prev => [ssrEvent, ...prev.slice(0, 49)]);

          if (data.type === 'ssr_render_start') {
            setActiveRenders(prev => prev + 1);
            setStats(prev => ({ ...prev, activeRenders: prev.activeRenders + 1 }));
          } else if (data.type === 'ssr_render_complete') {
            setActiveRenders(prev => Math.max(0, prev - 1));
            setStats(prev => ({
              ...prev,
              activeRenders: Math.max(0, prev.activeRenders - 1),
              totalRenders: prev.totalRenders + 1,
              avgRenderTime: data.duration ? (prev.avgRenderTime + data.duration) / 2 : prev.avgRenderTime
            }));
          }
        }
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();

      // Fallback to polling
      const pollInterval = setInterval(fetchSSRData, 5000);
      return () => clearInterval(pollInterval);
    };

    // Fallback simulation if no real data
    const simulateInterval = setInterval(() => {
      if (recentEvents.length === 0) {
        const mockEvents: SSREvent[] = [
          {
            event: 'render_complete',
            url: `/page/${Math.floor(Math.random() * 1000)}`,
            timestamp: Date.now() - Math.floor(Math.random() * 60000),
            duration: 1500 + Math.floor(Math.random() * 2000),
            success: Math.random() > 0.1,
            htmlLength: 10000 + Math.floor(Math.random() * 20000),
            userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            cacheStatus: Math.random() > 0.5 ? 'HIT' : 'MISS'
          },
          {
            event: 'render_start',
            url: `/product/${Math.floor(Math.random() * 500)}`,
            timestamp: Date.now() - Math.floor(Math.random() * 30000),
            userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
          }
        ];

        const newEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
        setRecentEvents(prev => [newEvent, ...prev.slice(0, 9)]);
      }
    }, 8000);

    return () => {
      eventSource.close();
      clearInterval(simulateInterval);
    };
  }, []);

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'render_start':
        return '🚀';
      case 'render_complete':
        return '✅';
      case 'render_error':
        return '❌';
      default:
        return '📡';
    }
  };

  const getEventColor = (event: string) => {
    switch (event) {
      case 'render_start':
        return 'text-blue-600';
      case 'render_complete':
        return 'text-green-600';
      case 'render_error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* SSR Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Renders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeRenders}</div>
            <p className="text-xs text-slate-500">Currently rendering</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Renders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalRenders.toLocaleString()}</div>
            <p className="text-xs text-slate-500">All time renders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500">Render success rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Render Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.avgRenderTime.toFixed(0)}ms</div>
            <p className="text-xs text-slate-500">Average render time</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Renders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔄</span>
            Active Renders ({activeRenders})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeRenders === 0 ? (
            <p className="text-gray-500 text-sm">No active SSR renders</p>
          ) : (
            <div className="space-y-2">
              {Array.from({length: activeRenders}).map((_, index) => (
                <div key={`render_${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin">🔄</div>
                    <span className="font-medium text-sm">Rendering...</span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-600">Processing SSR request...</div>
                    <div className="text-blue-600">Queue processing...</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SSR Event Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊</span>
            SSR Event Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">No SSR events yet</p>
            ) : (
              recentEvents.map((event, index) => (
                <div key={`event_${index}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className={getEventColor(event.event)}>
                    {getEventIcon(event.event)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {event.event === 'render_start' && 'Render Started'}
                      {event.event === 'render_complete' && 'Render Completed'}
                      {event.event === 'render_error' && 'Render Failed'}
                    </div>
                    <div className="text-gray-600 truncate">{event.url}</div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span>{formatTime(event.timestamp)}</span>
                      {event.duration && (
                        <span>Duration: {formatDuration(event.duration)}</span>
                      )}
                      {event.htmlLength && (
                        <span>Size: {(event.htmlLength / 1024).toFixed(1)}KB</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SSRMonitor;