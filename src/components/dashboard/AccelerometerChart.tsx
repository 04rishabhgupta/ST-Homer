import { GPSLocation } from '@/types/gps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface AccelerometerChartProps {
  history: GPSLocation[];
  deviceId: string;
}

export const AccelerometerChart = ({ history, deviceId }: AccelerometerChartProps) => {
  const chartData = history
    .filter(loc => loc.device_id === deviceId)
    .slice(-20) // Last 20 readings
    .map((loc, index) => ({
      index,
      time: new Date(loc.timestamp).toLocaleTimeString(),
      ax: loc.ax,
      ay: loc.ay,
      az: loc.az,
    }));

  const chartConfig = {
    ax: { label: 'X-Axis', color: 'hsl(var(--chart-1))' },
    ay: { label: 'Y-Axis', color: 'hsl(var(--chart-2))' },
    az: { label: 'Z-Axis', color: 'hsl(var(--chart-3))' },
  };

  // Calculate movement intensity
  const latestData = chartData[chartData.length - 1];
  const intensity = latestData 
    ? Math.sqrt(latestData.ax ** 2 + latestData.ay ** 2 + latestData.az ** 2)
    : 0;

  const getIntensityLabel = (val: number) => {
    if (val < 1) return { label: 'Stationary', color: 'text-green-500' };
    if (val < 3) return { label: 'Low Movement', color: 'text-yellow-500' };
    if (val < 6) return { label: 'Moderate', color: 'text-orange-500' };
    return { label: 'High Movement', color: 'text-red-500' };
  };

  const intensityInfo = getIntensityLabel(intensity);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Accelerometer - {deviceId}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Movement Intensity</p>
            <p className={`font-semibold ${intensityInfo.color}`}>
              {intensityInfo.label}
            </p>
          </div>
          {latestData && (
            <div className="text-right text-xs space-y-1">
              <p><span className="text-muted-foreground">X:</span> {latestData.ax.toFixed(3)}</p>
              <p><span className="text-muted-foreground">Y:</span> {latestData.ay.toFixed(3)}</p>
              <p><span className="text-muted-foreground">Z:</span> {latestData.az.toFixed(3)}</p>
            </div>
          )}
        </div>

        {chartData.length > 1 ? (
          <ChartContainer config={chartConfig} className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="index" 
                  tick={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="ax"
                  stroke="var(--color-ax)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ay"
                  stroke="var(--color-ay)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="az"
                  stroke="var(--color-az)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Not enough data for chart
          </p>
        )}

        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
            <span className="text-xs">X</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            <span className="text-xs">Y</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
            <span className="text-xs">Z</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
