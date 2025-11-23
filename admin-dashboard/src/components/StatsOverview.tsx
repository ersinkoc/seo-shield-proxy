import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { StatsData } from '../types';

interface StatsOverviewProps {
  stats: StatsData | null;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Loading stats...</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Requests',
      value: (stats.totalRequests || 0).toLocaleString(),
      icon: '📥',
      subtitle: `${((stats.botRequests || 0) / (stats.totalRequests || 1) * 100).toFixed(1)}% bots`,
    },
    {
      title: 'Bot Requests',
      value: (stats.botRequests || 0).toLocaleString(),
      icon: '🤖',
      subtitle: `${(stats.humanRequests || 0).toLocaleString()} humans`,
    },
    {
      title: 'Active Connections',
      value: (stats.activeConnections || 0).toLocaleString(),
      icon: '🔗',
      subtitle: 'WebSocket connections',
    },
    {
      title: 'Cache Hit Rate',
      value: `${(stats.cacheHitRate || 0).toFixed(1)}%`,
      icon: '✅',
      subtitle: 'Average cache performance',
    },
    {
      title: 'Avg Render Time',
      value: `${(stats.avgRenderTime || 0).toFixed(0)}ms`,
      icon: '⚡',
      subtitle: 'SSR processing time',
    },
    {
      title: 'Browser Queue',
      value: (stats.browserMetrics?.queued || 0).toLocaleString(),
      icon: '🎯',
      subtitle: `${stats.browserMetrics?.processing || 0} processing`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <Card key={i} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{card.title}</CardTitle>
            <span className="text-2xl">{card.icon}</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{card.value}</div>
            {card.subtitle && <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}