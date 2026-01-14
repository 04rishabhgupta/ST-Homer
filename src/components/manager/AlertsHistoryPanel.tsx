import { ZoneAlert } from '@/hooks/useZoneAlerts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, AlertTriangle, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';

interface AlertsHistoryPanelProps {
  alerts: ZoneAlert[];
  onClearAlert: (alertId: string) => void;
  onClearAllAlerts: () => void;
  onClose: () => void;
}

export const AlertsHistoryPanel = ({
  alerts,
  onClearAlert,
  onClearAllAlerts,
  onClose,
}: AlertsHistoryPanelProps) => {
  return (
    <div className="w-80 border-l bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary to-primary/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary-foreground" />
            <h2 className="font-semibold text-primary-foreground">Alert History</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {alerts.length > 0 && (
          <p className="text-xs text-primary-foreground/80 mt-1">
            {alerts.length} violation{alerts.length !== 1 ? 's' : ''} recorded
          </p>
        )}
      </div>

      {/* Alerts List */}
      <ScrollArea className="flex-1">
        {alerts.length === 0 ? (
          <div className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">No alerts recorded</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Zone violations will appear here
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {alerts
              .slice()
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border bg-destructive/5 border-destructive/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive-foreground">
                          Out of Zone
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1.5 truncate">
                        {alert.workerId}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Left "{alert.fenceName}"
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onClearAlert(alert.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="p-3 border-t space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const csvContent = [
                ['Worker ID', 'Task Area', 'Timestamp'].join(','),
                ...alerts
                  .slice()
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map(alert => [
                    `"${alert.workerId}"`,
                    `"${alert.fenceName}"`,
                    `"${format(new Date(alert.timestamp), 'yyyy-MM-dd HH:mm:ss')}"`
                  ].join(','))
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `alerts-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAllAlerts}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Alerts
          </Button>
        </div>
      )}
    </div>
  );
};
