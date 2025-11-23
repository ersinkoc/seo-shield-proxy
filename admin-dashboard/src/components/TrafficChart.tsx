import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { TrafficData } from '../types';

interface TrafficChartProps {
  data: TrafficData[];
  fullWidth?: boolean;
}

export default function TrafficChart({ data, fullWidth = false }: TrafficChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={fullWidth ? 'col-span-full' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📈</span> Traffic Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-slate-500">
            No traffic data yet...
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    requests: point.requests || 0,
    cacheHits: point.cacheHits || 0,
    renderTime: point.renderTime || 0,
  }));

  return (
    <Card className={fullWidth ? 'col-span-full' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📈</span> Traffic Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`h-80 ${fullWidth ? 'w-full' : ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Requests"
              />
              <Line
                type="monotone"
                dataKey="cacheHits"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Cache Hits"
              />
              <Line
                type="monotone"
                dataKey="renderTime"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Render Time (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}