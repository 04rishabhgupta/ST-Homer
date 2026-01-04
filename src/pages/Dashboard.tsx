import { useState, useEffect } from 'react';
import { useGPSData } from '@/hooks/useGPSData';
import { useDeviceHistory } from '@/hooks/useDeviceHistory';
import { useGeofences } from '@/hooks/useGeofences';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DeviceList } from '@/components/dashboard/DeviceList';
import { GPSMap } from '@/components/dashboard/GPSMap';
import { AccelerometerChart } from '@/components/dashboard/AccelerometerChart';
import { GeofencePanel } from '@/components/dashboard/GeofencePanel';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const {
    locations,
    isLoading,
    error,
    lastUpdate,
    refresh,
    isAutoRefresh,
    setAutoRefresh,
  } = useGPSData();

  const {
    history,
    fetchHistory,
    clearHistory,
  } = useDeviceHistory();

  const {
    geofences,
    addGeofence,
    removeGeofence,
    updateGeofence,
    checkDeviceInGeofence,
  } = useGeofences();

  // Fetch history when device is selected and history toggle is on
  useEffect(() => {
    if (selectedDevice && showHistory) {
      fetchHistory(selectedDevice);
    } else {
      clearHistory();
    }
  }, [selectedDevice, showHistory, fetchHistory, clearHistory]);

  // Get unique device count
  const uniqueDevices = new Set(locations.map(loc => loc.device_id)).size;

  return (
    <div className="h-screen flex flex-col bg-background">
      <DashboardHeader
        isLoading={isLoading}
        lastUpdate={lastUpdate}
        isAutoRefresh={isAutoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
        onManualRefresh={refresh}
        deviceCount={uniqueDevices}
        error={error}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Device List */}
        <div className="w-72 border-r bg-card flex flex-col">
          <Tabs defaultValue="devices" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="devices" className="flex-1">Devices</TabsTrigger>
              <TabsTrigger value="geofences" className="flex-1">Zones</TabsTrigger>
            </TabsList>
            
            <TabsContent value="devices" className="flex-1 mt-0">
              <DeviceList
                locations={locations}
                selectedDevice={selectedDevice}
                onSelectDevice={setSelectedDevice}
                geofences={geofences}
                checkDeviceInGeofence={checkDeviceInGeofence}
              />
            </TabsContent>
            
            <TabsContent value="geofences" className="flex-1 mt-0">
              <GeofencePanel
                geofences={geofences}
                onAddGeofence={addGeofence}
                onRemoveGeofence={removeGeofence}
                onUpdateGeofence={updateGeofence}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content - Map */}
        <div className="flex-1 flex flex-col">
          {/* Map Controls */}
          {selectedDevice && (
            <div className="p-3 border-b bg-card flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-history"
                  checked={showHistory}
                  onCheckedChange={setShowHistory}
                />
                <Label htmlFor="show-history" className="text-sm">
                  Show history trail
                </Label>
              </div>
              <span className="text-sm text-muted-foreground">
                Tracking: <span className="font-medium text-foreground">{selectedDevice}</span>
              </span>
            </div>
          )}

          {/* Map */}
          <div className="flex-1">
            <GPSMap
              locations={locations}
              selectedDevice={selectedDevice}
              history={history}
              showHistory={showHistory}
              geofences={geofences}
            />
          </div>
        </div>

        {/* Right Sidebar - Accelerometer */}
        {selectedDevice && (
          <div className="w-80 border-l bg-card p-4">
            <AccelerometerChart
              history={[...locations, ...history]}
              deviceId={selectedDevice}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
