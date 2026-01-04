import { useState } from 'react';
import { PolygonFence, WorkerAssignment, GPSLocation } from '@/types/gps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Briefcase } from 'lucide-react';
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

interface WorkerPanelProps {
  workers: string[];
  fences: PolygonFence[];
  assignments: WorkerAssignment[];
  locations: GPSLocation[];
  onAssignWorker: (assignment: Omit<WorkerAssignment, 'id'>) => void;
  onUnassignWorker: (workerId: string) => void;
}

export const WorkerPanel = ({
  workers,
  fences,
  assignments,
  locations,
  onAssignWorker,
  onUnassignWorker,
}: WorkerPanelProps) => {
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [selectedFence, setSelectedFence] = useState<string>('');
  const [jobLabel, setJobLabel] = useState('');

  const getWorkerLocation = (workerId: string) => {
    return locations.find(loc => loc.device_id === workerId);
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

  return (
    <div className="p-4 space-y-4">
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-2">
          {workers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No workers detected yet
            </p>
          )}

          {workers.map(workerId => {
            const assignment = assignments.find(a => a.workerId === workerId);
            const fence = assignment ? fences.find(f => f.id === assignment.fenceId) : null;
            const { status, color } = getWorkerStatus(workerId);

            return (
              <Card key={workerId}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4" />
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
                            <Label>Select Fence</Label>
                            <Select value={selectedFence} onValueChange={setSelectedFence}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a fence" />
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
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
