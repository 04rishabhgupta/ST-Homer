import { useCallback, useState, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polygon,
  DrawingManager,
} from '@react-google-maps/api';
import { GPSLocation, PolygonFence, WorkerAssignment } from '@/types/gps';
import { MAP_CONFIG } from '@/config/api';
import { Skeleton } from '@/components/ui/skeleton';
import { isPointInPolygon, isWithinShift } from '@/lib/geoUtils';

interface ManagerMapProps {
  locations: GPSLocation[];
  fences: PolygonFence[];
  assignments: WorkerAssignment[];
  isDrawing: boolean;
  onFenceComplete: (coords: { lat: number; lng: number }[]) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const libraries: ('drawing')[] = ['drawing'];

export const ManagerMap = ({
  locations,
  fences,
  assignments,
  isDrawing,
  onFenceComplete,
}: ManagerMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Get latest location per device
  const deviceLocations = new Map<string, GPSLocation>();
  locations.forEach(loc => {
    const existing = deviceLocations.get(loc.device_id);
    if (!existing || new Date(loc.timestamp) > new Date(existing.timestamp)) {
      deviceLocations.set(loc.device_id, loc);
    }
  });

  const getMarkerColor = (deviceId: string, location: GPSLocation): string => {
    const assignment = assignments.find(a => a.workerId === deviceId);
    if (!assignment) return '#94a3b8'; // Gray - unassigned

    const fence = fences.find(f => f.id === assignment.fenceId);
    if (!fence) return '#94a3b8';

    const now = new Date();
    const withinShift = isWithinShift(now, fence.shiftStart, fence.shiftEnd);
    const insideFence = isPointInPolygon(
      { lat: location.latitude, lng: location.longitude },
      fence.coordinates
    );

    if (withinShift && insideFence) {
      return '#22c55e'; // Green - inside during shift
    }
    return '#ef4444'; // Red - outside or off shift
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onPolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coords: { lat: number; lng: number }[] = [];
    
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coords.push({ lat: point.lat(), lng: point.lng() });
    }
    
    polygon.setMap(null); // Remove the drawn polygon
    onFenceComplete(coords);
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load Google Maps</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please check your API key configuration
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={MAP_CONFIG.defaultCenter}
      zoom={MAP_CONFIG.defaultZoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      }}
    >
      {/* Drawing Manager */}
      {isDrawing && (
        <DrawingManager
          onPolygonComplete={onPolygonComplete}
          options={{
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            drawingControl: false,
            polygonOptions: {
              fillColor: '#3b82f6',
              fillOpacity: 0.3,
              strokeColor: '#3b82f6',
              strokeWeight: 2,
              editable: true,
            },
          }}
        />
      )}

      {/* Fence Polygons */}
      {fences.map(fence => (
        <Polygon
          key={fence.id}
          paths={fence.coordinates}
          options={{
            fillColor: fence.color,
            fillOpacity: 0.2,
            strokeColor: fence.color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />
      ))}

      {/* Worker Markers */}
      {Array.from(deviceLocations.entries()).map(([deviceId, location]) => (
        <Marker
          key={deviceId}
          position={{ lat: location.latitude, lng: location.longitude }}
          title={deviceId}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: getMarkerColor(deviceId, location),
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  );
};
