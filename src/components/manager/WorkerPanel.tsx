import { useState } from 'react';
import { PolygonFence, WorkerAssignment, GPSLocation } from '@/types/gps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Briefcase, Clock, Navigation, AlertCircle, History, Activity, ChevronRight, Signal, SignalZero } from 'lucide-react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { isPointInPolygon, isWithinShift } from '@/lib/geoUtils';

interface DeviceHistoryDialogProps {
  deviceId: string;
  locations: GPSLocation[];
  isOpen: boolean;
  onClose: () => void;
}

const DeviceHistoryDialog = ({ deviceId, locations, isOpen, onClose }: DeviceHistoryDialogProps) => {
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
        <div className="flex-shrink-0 p-5 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">{deviceId}</DialogTitle>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-[10px] font-medium">ESP32</Badge>
                <span className="text-sm text-muted-foreground">
                  {deviceReadings.length} reading{deviceReadings.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-5 py-2.5 bg-muted/50 border-b">
          <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-5">Location</div>
            <div className="col-span-4">Accelerometer</div>
            <div className="col-span-3 text-right">Time</div>
          </div>
        </div>

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
                    {isLatest && (
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full" />
                    )}
                    <div className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5">
                        <div className="flex items-start gap-2">
                          <Navigation className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${isLatest ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div>
                            <p className="font-mono text-xs font-medium leading-tight">{reading.latitude.toFixed(6)}</p>
                            <p className="font-mono text-xs font-medium leading-tight text-muted-foreground">{reading.longitude.toFixed(6)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="flex items-start gap-2">
                          <Activity className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${isLatest ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="space-y-1">
                            <div className="flex gap-1.5 font-mono text-[10px]">
                              <span className="text-destructive/80">X:{reading.ax.toFixed(1)}</span>
                              <span className="text-primary/80">Y:{reading.ay.toFixed(1)}</span>
                              <span className="text-accent-foreground/80">Z:{reading.az.toFixed(1)}</span>
                            </div>
                            <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 h-4 font-medium ${movement.color}`}>
                              {movement.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          {isLatest && (
                            <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">Latest</Badge>
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
}

export const WorkerPanel = ({
  workers,
  fences,
  assignments,
  locations,
  onAssignWorker,
  onUnassignWorker,
  apiError,
}: WorkerPanelProps) => {
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [selectedFence, setSelectedFence] = useState<string>('');
  const [jobLabel, setJobLabel] = useState('');
  const [selectedDeviceHistory, setSelectedDeviceHistory] = useState<string | null>(null);

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
    if (!assignment) return { status: 'unassigned', color: 'secondary' as const, icon: 'neutral' };

    const fence = fences.find(f => f.id === assignment.fenceId);
    if (!fence) return { status: 'unassigned', color: 'secondary' as const, icon: 'neutral' };

    const location = getWorkerLocation(workerId);
    if (!location) return { status: 'offline', color: 'secondary' as const, icon: 'offline' };

    const now = new Date();
    const withinShift = isWithinShift(now, fence.shiftStart, fence.shiftEnd);
    const insideFence = isPointInPolygon(
      { lat: location.latitude, lng: location.longitude },
      fence.coordinates
    );

    if (!withinShift) return { status: 'off-shift', color: 'secondary' as const, icon: 'neutral' };
    if (insideFence) return { status: 'in-zone', color: 'default' as const, icon: 'good' };
    return { status: 'out-of-zone', color: 'destructive' as const, icon: 'warning' };
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

  const onlineWorkers = workers.filter(workerId => getWorkerLocation(workerId) !== undefined);
  const offlineWorkers = workers.filter(workerId => getWorkerLocation(workerId) === undefined);

  const getStatusIndicator = (icon: string) => {
    switch (icon) {
      case 'good':
        return <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />;
      case 'warning':
        return <div className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />;
      case 'offline':
        return <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />;
      default:
        return <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/60" />;
    }
  };

  const renderWorkerRow = (workerId: string, isOnline: boolean) => {
    const assignment = assignments.find(a => a.workerId === workerId);
    const fence = assignment ? fences.find(f => f.id === assignment.fenceId) : null;
    const { status, color, icon } = getWorkerStatus(workerId);
    const location = getWorkerLocation(workerId);

    return (
      <div
        key={workerId}
        className={`
          group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
          ${isOnline 
            ? 'bg-card hover:bg-muted/50 border-border/60 hover:border-primary/30' 
            : 'bg-muted/30 border-border/30 opacity-75 hover:opacity-100'
          }
        `}
      >
        {/* Avatar & Status */}
        <div className="relative flex-shrink-0">
          <div className={`
            h-10 w-10 rounded-full flex items-center justify-center
            ${isOnline 
              ? 'bg-primary/10 ring-2 ring-primary/30' 
              : 'bg-muted ring-1 ring-border'
            }
          `}>
            <User className={`h-5 w-5 ${isOnline ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5">
            {getStatusIndicator(icon)}
          </div>
        </div>

        {/* Worker Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{workerId}</span>
            <Badge variant={color} className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
              {status}
            </Badge>
          </div>
          {assignment && fence ? (
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 truncate">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: fence.color }} />
                {fence.name}
              </span>
              <span className="flex items-center gap-1 truncate">
                <Briefcase className="h-3 w-3 flex-shrink-0" />
                {assignment.jobLabel}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No task assigned</p>
          )}
        </div>

        {/* Actions */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setSelectedWorker(workerId);
                setSelectedFence(assignment?.fenceId || '');
                setJobLabel(assignment?.jobLabel || '');
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="block">{workerId}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {assignment ? 'Edit Assignment' : 'New Assignment'}
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-sm">Task Area</Label>
                <Select value={selectedFence} onValueChange={setSelectedFence}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a task area..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fences.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }} />
                          <span>{f.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Job Label</Label>
                <Input
                  className="h-11"
                  placeholder="e.g., Crane Operator, Site Inspector"
                  value={jobLabel}
                  onChange={(e) => setJobLabel(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleAssign} className="flex-1 h-11">
                  {assignment ? 'Update Assignment' : 'Assign Worker'}
                </Button>
                {assignment && (
                  <Button
                    variant="outline"
                    className="h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
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
    );
  };

  const renderDeviceCard = (deviceId: string, location: GPSLocation) => (
    <div
      key={deviceId}
      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 border border-transparent hover:border-primary/20 cursor-pointer transition-all"
      onClick={() => setSelectedDeviceHistory(deviceId)}
    >
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Signal className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-xs truncate">{deviceId}</span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0">ESP32</Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
          <span className="font-mono truncate">
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </span>
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background/50">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base">Workers</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {onlineWorkers.length} online · {offlineWorkers.length} offline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
              Live
            </Badge>
          </div>
        </div>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="flex-shrink-0 mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            API Connection Failed
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Unable to connect. Check your backend configuration.
          </p>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <Accordion type="multiple" defaultValue={['online', 'devices']} className="space-y-3">
            {/* Online Workers */}
            <AccordionItem value="online" className="border rounded-lg bg-card/50 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:border-b">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Signal className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-sm">Online Workers</span>
                    <p className="text-xs text-muted-foreground font-normal">{onlineWorkers.length} active</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 pt-3">
                <div className="space-y-2">
                  {onlineWorkers.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <SignalZero className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No workers online</p>
                    </div>
                  ) : (
                    onlineWorkers.map(workerId => renderWorkerRow(workerId, true))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Offline Workers */}
            {offlineWorkers.length > 0 && (
              <AccordionItem value="offline" className="border rounded-lg bg-card/50 overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      <SignalZero className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-sm">Offline Workers</span>
                      <p className="text-xs text-muted-foreground font-normal">{offlineWorkers.length} inactive</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-3">
                  <div className="space-y-2">
                    {offlineWorkers.map(workerId => renderWorkerRow(workerId, false))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Device Log */}
            <AccordionItem value="devices" className="border rounded-lg bg-card/50 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:border-b">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-sm">ESP32 Devices</span>
                    <p className="text-xs text-muted-foreground font-normal">{latestLocations.size} reporting</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 pt-3">
                <div className="space-y-2">
                  {latestLocations.size === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Signal className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Waiting for device data...</p>
                    </div>
                  ) : (
                    Array.from(latestLocations.entries()).map(([deviceId, location]) =>
                      renderDeviceCard(deviceId, location)
                    )
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

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