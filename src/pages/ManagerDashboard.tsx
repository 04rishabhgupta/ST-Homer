import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGPSData } from '@/hooks/useGPSData';
import { usePolygonFences } from '@/hooks/usePolygonFences';
import { useWorkerAssignments } from '@/hooks/useWorkerAssignments';
import { ManagerMap } from '@/components/manager/ManagerMap';
import { FencePanel } from '@/components/manager/FencePanel';
import { WorkerPanel } from '@/components/manager/WorkerPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, RefreshCw, Users, MapPin } from 'lucide-react';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const [isDrawing, setIsDrawing] = useState(false);
  
  const { locations, isLoading, refresh, isAutoRefresh, setAutoRefresh } = useGPSData();
  const { fences, addFence, removeFence, updateFence } = usePolygonFences();
  const { assignments, assignWorker, unassignWorker } = useWorkerAssignments();

  // Get unique workers from locations
  const workers = Array.from(new Set(locations.map(loc => loc.device_id)));

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">Manager Dashboard</h1>
            <p className="text-xs text-muted-foreground">Welcome, {user?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col">
          <Tabs defaultValue="fences" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="fences" className="flex-1 gap-2">
                <MapPin className="h-4 w-4" />
                Fences
              </TabsTrigger>
              <TabsTrigger value="workers" className="flex-1 gap-2">
                <Users className="h-4 w-4" />
                Workers
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="fences" className="flex-1 mt-0 overflow-auto">
              <FencePanel
                fences={fences}
                onAddFence={addFence}
                onRemoveFence={removeFence}
                onUpdateFence={updateFence}
                isDrawing={isDrawing}
                onToggleDrawing={() => setIsDrawing(!isDrawing)}
              />
            </TabsContent>
            
            <TabsContent value="workers" className="flex-1 mt-0 overflow-auto">
              <WorkerPanel
                workers={workers}
                fences={fences}
                assignments={assignments}
                locations={locations}
                onAssignWorker={assignWorker}
                onUnassignWorker={unassignWorker}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Map */}
        <div className="flex-1">
          <ManagerMap
            locations={locations}
            fences={fences}
            assignments={assignments}
            isDrawing={isDrawing}
            onFenceComplete={(coords) => {
              setIsDrawing(false);
              // Fence will be added via the FencePanel after naming
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
