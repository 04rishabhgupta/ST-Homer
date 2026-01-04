import { useAuth } from '@/contexts/AuthContext';
import { useGPSData } from '@/hooks/useGPSData';
import { usePolygonFences } from '@/hooks/usePolygonFences';
import { useWorkerAssignments } from '@/hooks/useWorkerAssignments';
import { WorkerMap } from '@/components/worker/WorkerMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, MapPin, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { isWithinShift, isPointInPolygon } from '@/lib/geoUtils';

const WorkerDashboard = () => {
  const { user, logout } = useAuth();
  const { locations } = useGPSData();
  const { fences } = usePolygonFences();
  const { assignments } = useWorkerAssignments();

  // Get worker's assignment - using device_id for demo
  const workerId = user?.id || '';
  const assignment = assignments.find(a => a.workerId === workerId);
  const assignedFence = assignment ? fences.find(f => f.id === assignment.fenceId) : null;

  // Get worker's latest location - for demo, use first available location
  const workerLocation = locations[0] || null;

  // Calculate status
  const now = new Date();
  const withinShift = assignedFence ? isWithinShift(now, assignedFence.shiftStart, assignedFence.shiftEnd) : false;
  const insideFence = assignedFence && workerLocation 
    ? isPointInPolygon(
        { lat: workerLocation.latitude, lng: workerLocation.longitude },
        assignedFence.coordinates
      )
    : false;

  const getStatus = () => {
    if (!assignedFence) {
      return { label: 'Not Assigned', color: 'secondary' as const, icon: AlertTriangle };
    }
    if (!withinShift) {
      return { label: 'Off Shift', color: 'secondary' as const, icon: Clock };
    }
    if (insideFence) {
      return { label: 'Inside Fence', color: 'default' as const, icon: CheckCircle };
    }
    return { label: 'Outside Fence', color: 'destructive' as const, icon: XCircle };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">Worker Dashboard</h1>
            <p className="text-xs text-muted-foreground">Welcome, {user?.name}</p>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Status */}
        <div className="w-80 border-r bg-card p-4 space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${
                  status.color === 'default' ? 'text-green-500' : 
                  status.color === 'destructive' ? 'text-red-500' : 
                  'text-muted-foreground'
                }`} />
                <Badge variant={status.color}>{status.label}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignedFence ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Zone</p>
                    <p className="font-medium">{assignedFence.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Job</p>
                    <p className="font-medium">{assignment?.jobLabel || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shift Time</p>
                    <p className="font-medium">
                      {assignedFence.shiftStart} - {assignedFence.shiftEnd}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No fence assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Your Location</CardTitle>
            </CardHeader>
            <CardContent>
              {workerLocation ? (
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    {workerLocation.latitude.toFixed(6)}, {workerLocation.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last update: {new Date(workerLocation.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Location unavailable</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="flex-1">
          <WorkerMap
            workerLocation={workerLocation}
            assignedFence={assignedFence}
            isInsideFence={insideFence}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
