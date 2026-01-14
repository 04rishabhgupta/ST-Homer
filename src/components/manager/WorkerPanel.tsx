import { useState } from 'react';
import { PolygonFence, WorkerAssignment, GPSLocation } from '@/types/gps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Briefcase, Clock, Navigation, AlertCircle, History, Activity } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isPointInPolygon, isWithinShift } from '@/lib/geoUtils';

interface DeviceHistoryDialogProps {
  deviceId: string;
  locations: GPSLocation[];
  isOpen: boolean;
  onClose: () => void;
}

const DeviceHistoryDialog = ({ deviceId, locations, isOpen, onClose }: DeviceHistoryDialogProps) => {
  // Get all readings for this device, sorted by timestamp (newest first)
  const deviceReadings = locations
    .filter(loc => loc.device_id === deviceId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  // Calculate movement intensity from accelerometer data
  const getMovementIntensity = (ax: number, ay: number, az: number) => {
    const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    if (magnitude < 1.5) return { label: 'Stationary', color: 'bg-muted text-muted-foreground' };
    if (magnitude < 3) return { label: 'Low', color: 'bg-accent/20 text-accent-foreground' };
    if (magnitude < 6) return { label: 'Moderate', color: 'bg-primary/20 text-primary' };
    return { label: 'High', color: 'bg-destructive/20 text-destructive' };
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-5 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">{deviceId}</DialogTitle>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-[10px] font-medium">
                  ESP32
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {deviceReadings.length} reading{deviceReadings.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="flex-shrink-0 px-5 py-2.5 bg-muted/50 border-b">
          <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-5">Location</div>
            <div className="col-span-4">Accelerometer</div>
            <div className="col-span-3 text-right">Time</div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {deviceReadings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Navigation className="h-8 w-8 opacity-40" />
                </div>
                <p className="text-sm font-medium">No coordinates recorded</p>
                <p className="text-xs mt-1 opacity-70">Data will appear when the device reports</p>
              </div>
            ) : (
              deviceReadings.map((reading, index) => {
                const { date, time } = formatTimestamp(reading.timestamp);
                const isLatest = index === 0;
                const movement = getMovementIntensity(reading.ax, reading.ay, reading.az);

                return (
                  <div
                    key={`${reading.timestamp}-${index}`}
                    className={`
                      group relative rounded-lg border p-3 transition-all duration-200
                      ${isLatest 
                        ? 'border-primary/40 bg-primary/5 shadow-sm' 
                        : 'border-border/50 bg-card hover:border-border hover:bg-muted/30'
                      }
                    `}
                  >
                    {/* Latest indicator line */}
                    {isLatest && (
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full" />
                    )}

                    <div className="grid grid-cols-12 gap-2 items-start">
                      {/* Coordinates */}
                      <div className="col-span-5">
                        <div className="flex items-start gap-2">
                          <Navigation className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${isLatest ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-mono text-xs font-medium leading-tight">
                              {reading.latitude.toFixed(6)}
                            </p>
                            <p className="font-mono text-xs font-medium leading-tight text-muted-foreground">
                              {reading.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Accelerometer */}
                      <div className="col-span-4">
                        <div className="flex items-start gap-2">
                          <Activity className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${isLatest ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="space-y-1">
                            <div className="flex gap-1.5 font-mono text-[10px]">
                              <span className="text-destructive/80">X:{reading.ax.toFixed(1)}</span>
                              <span className="text-primary/80">Y:{reading.ay.toFixed(1)}</span>
                              <span className="text-accent-foreground/80">Z:{reading.az.toFixed(1)}</span>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={`text-[9px] px-1.5 py-0 h-4 font-medium ${movement.color}`}
                            >
                              {movement.label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="col-span-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          {isLatest && (
                            <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">
                              Latest
                            </Badge>
                          )}
                          <div className="text-[10px] text-muted-foreground">
                            <p className="font-medium">{time}</p>
                            <p className="opacity-70">{date}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer Stats */}
        {deviceReadings.length > 0 && (
          <div className="flex-shrink-0 px-5 py-3 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span>Latest reading</span>
                </div>
                <span className="text-[10px]">
                  {formatTimestamp(deviceReadings[0].timestamp).date} at {formatTimestamp(deviceReadings[0].timestamp).time}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface WorkerPanelProps {
  workers: string[];
  fences: PolygonFence[];
  assignments: WorkerAssignment[];
  locations: GPSLocation[];
  onAssignWorker: (assignment: Omit<WorkerAssignment, 'id'>) => void;
  onUnassignWorker: (workerId: string) => void;
  apiError?: string | null;
  deviceTimeoutSeconds?: number;
}

export const WorkerPanel = ({
  workers,
  fences,
  assignments,
  locations,
  onAssignWorker,
  onUnassignWorker,
  apiError,
  deviceTimeoutSeconds = 30,
}: WorkerPanelProps) => {
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [selectedFence, setSelectedFence] = useState<string>('');
  const [jobLabel, setJobLabel] = useState('');
  const [selectedDeviceHistory, setSelectedDeviceHistory] = useState<string | null>(null);

  // Get latest location for each device
  const getLatestLocations = (): Map<string, GPSLocation> => {
    const deviceMap = new Map<string, GPSLocation>();
    locations.forEach(loc => {
      const existing = deviceMap.get(loc.device_id);
      if (!existing || new Date(loc.timestamp) > new Date(existing.timestamp)) {
        deviceMap.set(loc.device_id, loc);
      }
    });
    return deviceMap;
  };

  const latestLocations = getLatestLocations();

  const getWorkerLocation = (workerId: string) => {
    return latestLocations.get(workerId);
  };

  const getWorkerStatus = (workerId: string) => {
    const assignment = assignments.find(a => a.workerId === workerId);
    if (!assignment) return { status: 'unassigned', color: 'secondary' as const };

    const fence = fences.find(f => f.id === assignment.fenceId);
    if (!fence) return { status: 'unassigned', color: 'secondary' as const };

    const location = getWorkerLocation(workerId);
    if (!location) return { status: 'offline', color: 'secondary' as const };

    const now = new Date();
    const withinShift = isWithinShift(now, fence.shiftStart, fence.shiftEnd);
    const insideFence = isPointInPolygon(
      { lat: location.latitude, lng: location.longitude },
      fence.coordinates
    );

    if (!withinShift) return { status: 'off-shift', color: 'secondary' as const };
    if (insideFence) return { status: 'in-zone', color: 'default' as const };
    return { status: 'out-of-zone', color: 'destructive' as const };
  };

  const handleAssign = () => {
    if (!selectedWorker || !selectedFence || !jobLabel.trim()) return;

    onAssignWorker({
      workerId: selectedWorker,
      fenceId: selectedFence,
      jobLabel: jobLabel.trim(),
    });

    setSelectedWorker(null);
    setSelectedFence('');
    setJobLabel('');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Helper to check if a device is online based on timeout setting
  const isDeviceOnline = (location: GPSLocation | undefined): boolean => {
    if (!location) return false;
    const lastReading = new Date(location.timestamp).getTime();
    const now = Date.now();
    const timeoutMs = deviceTimeoutSeconds * 1000;
    return (now - lastReading) < timeoutMs;
  };

  // Separate workers into online and offline based on timeout
  const onlineWorkers = workers.filter(workerId => {
    const location = getWorkerLocation(workerId);
    return isDeviceOnline(location);
  });

  const offlineWorkers = workers.filter(workerId => {
    const location = getWorkerLocation(workerId);
    return !isDeviceOnline(location);
  });

  const renderWorkerCard = (workerId: string) => {
    const assignment = assignments.find(a => a.workerId === workerId);
    const fence = assignment ? fences.find(f => f.id === assignment.fenceId) : null;
    const { status, color } = getWorkerStatus(workerId);
    const location = getWorkerLocation(workerId);
    const online = isDeviceOnline(location);

    return (
      <Card key={workerId}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                online ? 'bg-green-500/20 ring-2 ring-green-500' : 'bg-muted'
              }`}>
                <User className={`h-4 w-4 ${online ? 'text-green-600' : ''}`} />
              </div>
              <div>
                <p className="font-medium text-sm">{workerId}</p>
                <Badge variant={color} className="text-xs mt-1">
                  {status}
                </Badge>
              </div>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedWorker(workerId);
                    setSelectedFence(assignment?.fenceId || '');
                    setJobLabel(assignment?.jobLabel || '');
                  }}
                >
                  {assignment ? 'Edit' : 'Assign'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Worker: {workerId}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Task Area</Label>
                    <Select value={selectedFence} onValueChange={setSelectedFence}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a task area" />
                      </SelectTrigger>
                      <SelectContent>
                        {fences.map(f => (
                          <SelectItem key={f.id} value={f.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: f.color }}
                              />
                              {f.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Job Label</Label>
                    <Input
                      placeholder="e.g., Crane Operator"
                      value={jobLabel}
                      onChange={(e) => setJobLabel(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAssign} className="flex-1">
                      Save Assignment
                    </Button>
                    {assignment && (
                      <Button
                        variant="destructive"
                        onClick={() => onUnassignWorker(workerId)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {assignment && fence && (
            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {fence.name}
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {assignment.jobLabel}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      {/* Online Workers Section - Pinned */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Online Workers ({onlineWorkers.length})
          </h3>
        </div>
        <ScrollArea className="max-h-[35vh]">
          <div className="space-y-2">
            {onlineWorkers.length === 0 && !apiError && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No workers currently online
              </p>
            )}

            {apiError && onlineWorkers.length === 0 && (
              <div className="p-3 bg-destructive/10 rounded-md text-xs">
                <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                  <AlertCircle className="h-3 w-3" />
                  API Connection Failed
                </div>
                <p className="text-muted-foreground">
                  Unable to connect to the API. Please check your connection.
                </p>
              </div>
            )}

            {onlineWorkers.map(workerId => renderWorkerCard(workerId))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Offline Workers Section */}
      <div className="flex-shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Offline Workers ({offlineWorkers.length})
        </h3>
        <ScrollArea className="max-h-[20vh]">
          <div className="space-y-2">
            {offlineWorkers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                All workers are online
              </p>
            )}

            {offlineWorkers.map(workerId => renderWorkerCard(workerId))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Device Log Section - All ESP32 devices from sensor_log */}
      <div className="flex-1 min-h-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          ESP32 Device Log
        </h3>
        <ScrollArea className="h-[calc(30vh-100px)]">
          <div className="space-y-2">
            {latestLocations.size === 0 && !apiError && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Waiting for device data...
              </p>
            )}

            {apiError && latestLocations.size === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Connect to your PHP backend to see device data
              </p>
            )}

            {Array.from(latestLocations.entries()).map(([deviceId, location]) => (
              <Card 
                key={deviceId} 
                className="bg-muted/50 cursor-pointer hover:bg-muted/80 hover:border-primary/50 transition-colors"
                onClick={() => setSelectedDeviceHistory(deviceId)}
              >
                <CardContent className="p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs">{deviceId}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      ESP32
                    </Badge>
                  </div>
                  <div className="space-y-1 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Navigation className="h-2.5 w-2.5" />
                      <span className="font-mono">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      <span>{formatTimestamp(location.timestamp)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Device History Dialog */}
      {selectedDeviceHistory && (
        <DeviceHistoryDialog
          deviceId={selectedDeviceHistory}
          locations={locations}
          isOpen={!!selectedDeviceHistory}
          onClose={() => setSelectedDeviceHistory(null)}
        />
      )}
    </div>
  );
};
