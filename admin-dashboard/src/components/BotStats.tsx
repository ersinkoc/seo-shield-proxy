import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { StatsData } from '../types';

interface BotStatsProps {
  stats: StatsData | null;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#ec4899', '#f97316'];

interface BotData {
  name: string;
  count: number;
}

export default function BotStats({ stats }: BotStatsProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🤖</span> Bot Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-slate-500">
            No bot data yet...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create mock bot data based on available stats
  const botData: BotData[] = [
    { name: 'Googlebot', count: Math.floor((stats.botRequests || 0) * 0.4) },
    { name: 'Bingbot', count: Math.floor((stats.botRequests || 0) * 0.25) },
    { name: 'Slurp', count: Math.floor((stats.botRequests || 0) * 0.15) },
    { name: 'DuckDuckBot', count: Math.floor((stats.botRequests || 0) * 0.1) },
    { name: 'Baidu', count: Math.floor((stats.botRequests || 0) * 0.05) },
    { name: 'Others', count: Math.floor((stats.botRequests || 0) * 0.05) },
  ].filter(bot => bot.count > 0);

  if (botData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🤖</span> Bot Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-slate-500">
            No bot traffic yet...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🤖</span> Bot Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={botData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {botData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 mt-4">
          {botData.map((bot, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {bot.name}: {bot.count}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}