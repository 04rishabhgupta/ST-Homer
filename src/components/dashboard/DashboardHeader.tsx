import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface DashboardHeaderProps {
  isLoading: boolean;
  lastUpdate: Date | null;
  isAutoRefresh: boolean;
  onToggleAutoRefresh: (enabled: boolean) => void;
  onManualRefresh: () => void;
  deviceCount: number;
  error: string | null;
}

export const DashboardHeader = ({
  isLoading,
  lastUpdate,
  isAutoRefresh,
  onToggleAutoRefresh,
  onManualRefresh,
  deviceCount,
  error,
}: DashboardHeaderProps) => {
  return (
    <header className="h-14 border-b bg-card px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-foreground">GPS Tracking Dashboard</h1>
        <Badge variant={error ? 'destructive' : 'default'} className="gap-1">
          {error ? (
            <>
              <WifiOff className="h-3 w-3" />
              Offline
            </>
          ) : (
            <>
              <Wifi className="h-3 w-3" />
              {deviceCount} Device{deviceCount !== 1 ? 's' : ''}
            </>
          )}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        {lastUpdate && (
          <span className="text-sm text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Auto-refresh</span>
          <Switch
            checked={isAutoRefresh}
            onCheckedChange={onToggleAutoRefresh}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onManualRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </header>
  );
};
