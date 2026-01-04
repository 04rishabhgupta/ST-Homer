import { MapPin, Activity, Clock } from 'lucide-react';
import { GPSLocation, Geofence } from '@/types/gps';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DeviceListProps {
  locations: GPSLocation[];
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string | null) => void;
  geofences: Geofence[];
  checkDeviceInGeofence: (lat: number, lng: number) => Geofence[];
}

export const DeviceList = ({
  locations,
  selectedDevice,
  onSelectDevice,
  checkDeviceInGeofence,
}: DeviceListProps) => {
  // Group by device_id and get latest location for each
  const deviceMap = new Map<string, GPSLocation>();
  locations.forEach(loc => {
    const existing = deviceMap.get(loc.device_id);
    if (!existing || new Date(loc.timestamp) > new Date(existing.timestamp)) {
      deviceMap.set(loc.device_id, loc);
    }
  });

  const devices = Array.from(deviceMap.values());

  const isOnline = (timestamp: string) => {
    const lastUpdate = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    return diffMinutes < 5; // Consider online if updated within 5 minutes
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-foreground">Devices</h2>
        <p className="text-sm text-muted-foreground">{devices.length} tracked</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {devices.map(device => {
            const online = isOnline(device.timestamp);
            const inZones = checkDeviceInGeofence(device.latitude, device.longitude);
            
            return (
              <Card
                key={device.device_id}
                className={cn(
                  'p-3 cursor-pointer transition-colors hover:bg-accent',
                  selectedDevice === device.device_id && 'ring-2 ring-primary bg-accent'
                )}
                onClick={() => onSelectDevice(
                  selectedDevice === device.device_id ? null : device.device_id
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{device.device_id}</span>
                  </div>
                  <Badge variant={online ? 'default' : 'secondary'} className="text-xs">
                    {online ? 'Online' : 'Offline'}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(device.timestamp).toLocaleString()}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    ax: {device.ax.toFixed(2)}, ay: {device.ay.toFixed(2)}, az: {device.az.toFixed(2)}
                  </div>

                  {inZones.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {inZones.map(zone => (
                        <Badge 
                          key={zone.id} 
                          variant="outline" 
                          className="text-xs"
                          style={{ borderColor: zone.color, color: zone.color }}
                        >
                          {zone.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {devices.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No devices found
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
