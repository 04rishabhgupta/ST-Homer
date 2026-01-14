import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGPSData } from '@/hooks/useGPSData';
import { usePolygonFences } from '@/hooks/usePolygonFences';
import { useWorkerAssignments } from '@/hooks/useWorkerAssignments';
import { useManagerSettings } from '@/hooks/useManagerSettings';
import { useZoneAlerts } from '@/hooks/useZoneAlerts';
import { ManagerMap } from '@/components/manager/ManagerMap';
import { FencePanel, FenceCreationPanel, DrawingMode } from '@/components/manager/FencePanel';
import { WorkerPanel } from '@/components/manager/WorkerPanel';
import { SettingsDialog } from '@/components/manager/SettingsDialog';
import { AlertsHistoryPanel } from '@/components/manager/AlertsHistoryPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, RefreshCw, Users, MapPin, Settings, Bell } from 'lucide-react';
import homerLogo from '@/assets/homer-logo.gif';
import { PolygonFence } from '@/types/gps';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('none');
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number }[] | null>(null);
  const [isCreatingFence, setIsCreatingFence] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);
  
  const { settings, updateSettings, resetToDefaults } = useManagerSettings();
  const { locations, isLoading, refresh, error } = useGPSData({
    refreshIntervalSeconds: settings.autoRefreshIntervalSeconds,
  });
  const { fences, addFence, removeFence, updateFence } = usePolygonFences();
  const { assignments, assignWorker, unassignWorker } = useWorkerAssignments();

  // Zone alerts with configurable delay from settings
  const { alerts, clearAlert, clearAllAlerts } = useZoneAlerts(locations, fences, assignments, {
    outOfZoneAlertDelaySeconds: settings.outOfZoneAlertDelaySeconds,
  });

  const workers = Array.from(new Set(locations.map(loc => loc.device_id)));

  const handleFenceComplete = (coords: { lat: number; lng: number }[]) => {
    setPendingCoords(coords);
  };

  const handleStartCreating = () => {
    setIsCreatingFence(true);
    setDrawingMode('rectangle');
    setPendingCoords(null);
  };

  const handleCancelCreating = () => {
    setIsCreatingFence(false);
    setDrawingMode('none');
    setPendingCoords(null);
  };

  const handleSaveFence = (fence: Omit<PolygonFence, 'id'>) => {
    addFence(fence);
    handleCancelCreating();
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={homerLogo} alt="Homer Logo" className="h-10 w-10 rounded-full" />
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAlertsPanelOpen(!alertsPanelOpen)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={(newSettings) => updateSettings(newSettings)}
        onReset={resetToDefaults}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col">
          <Tabs defaultValue="taskAreas" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="taskAreas" className="flex-1 gap-2">
                <MapPin className="h-4 w-4" />
                Task Areas
              </TabsTrigger>
              <TabsTrigger value="workers" className="flex-1 gap-2">
                <Users className="h-4 w-4" />
                Workers
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="taskAreas" className="flex-1 mt-0 overflow-auto">
              <FencePanel
                fences={fences}
                onAddFence={addFence}
                onRemoveFence={removeFence}
                onUpdateFence={updateFence}
                drawingMode={drawingMode}
                onSetDrawingMode={setDrawingMode}
                pendingCoords={pendingCoords}
                onClearPendingCoords={() => setPendingCoords(null)}
                isCreating={isCreatingFence}
                onSetIsCreating={handleStartCreating}
              />
            </TabsContent>
            
            <TabsContent value="workers" className="flex-1 mt-0 overflow-hidden">
              <WorkerPanel
                workers={workers}
                fences={fences}
                assignments={assignments}
                locations={locations}
                onAssignWorker={assignWorker}
                onUnassignWorker={unassignWorker}
                apiError={error}
                deviceTimeoutSeconds={settings.deviceTimeoutSeconds}
                showOfflineDevices={settings.showOfflineDevices}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <ManagerMap
            locations={locations}
            fences={fences}
            assignments={assignments}
            drawingMode={drawingMode}
            onFenceComplete={handleFenceComplete}
            defaultZoom={settings.defaultMapZoom}
          />
        </div>

        {/* Right Panel - Fence Creation */}
        {isCreatingFence && (
          <FenceCreationPanel
            onClose={handleCancelCreating}
            onSave={handleSaveFence}
            drawingMode={drawingMode}
            onSetDrawingMode={setDrawingMode}
            pendingCoords={pendingCoords}
            onClearPendingCoords={() => setPendingCoords(null)}
          />
        )}

        {/* Alerts History Panel */}
        {alertsPanelOpen && !isCreatingFence && (
          <AlertsHistoryPanel
            alerts={alerts}
            onClearAlert={clearAlert}
            onClearAllAlerts={clearAllAlerts}
            onClose={() => setAlertsPanelOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
