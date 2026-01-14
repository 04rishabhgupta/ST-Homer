import { useCallback, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polygon,
  Rectangle,
  DrawingManager,
  InfoWindow,
} from '@react-google-maps/api';
import { GPSLocation, PolygonFence, WorkerAssignment } from '@/types/gps';
import { MAP_CONFIG } from '@/config/api';
import { Skeleton } from '@/components/ui/skeleton';
import { isPointInPolygon, isWithinShift } from '@/lib/geoUtils';
import { DrawingMode } from './FencePanel';

interface ManagerMapProps {
  locations: GPSLocation[];
  fences: PolygonFence[];
  assignments: WorkerAssignment[];
  drawingMode: DrawingMode;
  onFenceComplete: (coords: { lat: number; lng: number }[]) => void;
  defaultZoom?: number;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Classic teardrop pin shape SVG path
const PIN_PATH = "M12 0C7.31 0 3.5 3.81 3.5 8.5C3.5 14.88 12 24 12 24S20.5 14.88 20.5 8.5C20.5 3.81 16.69 0 12 0ZM12 11.5C10.34 11.5 9 10.16 9 8.5C9 6.84 10.34 5.5 12 5.5C13.66 5.5 15 6.84 15 8.5C15 10.16 13.66 11.5 12 11.5Z";

const libraries: ('drawing')[] = ['drawing'];

export const ManagerMap = ({
  locations,
  fences,
  assignments,
  drawingMode,
  onFenceComplete,
  defaultZoom = 16,
}: ManagerMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindow, setInfoWindow] = useState<{
    position: google.maps.LatLngLiteral;
    deviceId: string;
    location: GPSLocation;
    status: 'compliant' | 'violation' | 'unassigned';
  } | null>(null);

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

  const getWorkerStatus = (deviceId: string, location: GPSLocation): 'compliant' | 'violation' | 'unassigned' => {
    const assignment = assignments.find(a => a.workerId === deviceId);
    if (!assignment) return 'unassigned';

    const fence = fences.find(f => f.id === assignment.fenceId);
    if (!fence) return 'unassigned';

    const now = new Date();
    const withinShift = isWithinShift(now, fence.shiftStart, fence.shiftEnd);
    const insideFence = isPointInPolygon(
      { lat: location.latitude, lng: location.longitude },
      fence.coordinates
    );

    if (withinShift && insideFence) {
      return 'compliant';
    }
    return 'violation';
  };

  const getMarkerColor = (deviceId: string): string => {
    const assignment = assignments.find(a => a.workerId === deviceId);
    if (!assignment) return '#94a3b8'; // Gray for unassigned
    
    const fence = fences.find(f => f.id === assignment.fenceId);
    return fence?.color || '#94a3b8';
  };

  const getStatusLabel = (status: 'compliant' | 'violation' | 'unassigned'): string => {
    switch (status) {
      case 'compliant': return 'Inside Task Area';
      case 'violation': return 'Violation';
      case 'unassigned': return 'Unassigned';
    }
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
    
    polygon.setMap(null);
    onFenceComplete(coords);
  };

  const onRectangleComplete = (rectangle: google.maps.Rectangle) => {
    const bounds = rectangle.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    // Convert rectangle bounds to polygon coordinates (4 corners)
    const coords: { lat: number; lng: number }[] = [
      { lat: ne.lat(), lng: sw.lng() }, // NW
      { lat: ne.lat(), lng: ne.lng() }, // NE
      { lat: sw.lat(), lng: ne.lng() }, // SE
      { lat: sw.lat(), lng: sw.lng() }, // SW
    ];
    
    rectangle.setMap(null);
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

  const getDrawingMode = () => {
    if (drawingMode === 'polygon') {
      return google.maps.drawing.OverlayType.POLYGON;
    }
    if (drawingMode === 'rectangle') {
      return google.maps.drawing.OverlayType.RECTANGLE;
    }
    return null;
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={MAP_CONFIG.defaultCenter}
      zoom={defaultZoom}
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
      {drawingMode !== 'none' && (
        <DrawingManager
          onPolygonComplete={onPolygonComplete}
          onRectangleComplete={onRectangleComplete}
          options={{
            drawingMode: getDrawingMode(),
            drawingControl: false,
            polygonOptions: {
              fillColor: '#3b82f6',
              fillOpacity: 0.3,
              strokeColor: '#3b82f6',
              strokeWeight: 2,
              editable: true,
            },
            rectangleOptions: {
              fillColor: '#3b82f6',
              fillOpacity: 0.3,
              strokeColor: '#3b82f6',
              strokeWeight: 2,
              editable: true,
              draggable: true,
            },
          }}
        />
      )}

      {/* Drawing mode indicator */}
      {drawingMode !== 'none' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg z-10">
          {drawingMode === 'polygon' ? 'Click to draw polygon points' : 'Click and drag to draw rectangle'}
        </div>
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
      {Array.from(deviceLocations.entries()).map(([deviceId, location]) => {
        const status = getWorkerStatus(deviceId, location);
        return (
          <Marker
            key={deviceId}
            position={{ lat: location.latitude, lng: location.longitude }}
            title={deviceId}
            icon={{
              path: PIN_PATH,
              scale: 1.5,
              fillColor: getMarkerColor(deviceId),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 1,
              anchor: new google.maps.Point(12, 24),
            }}
            onClick={() => setInfoWindow({
              position: { lat: location.latitude, lng: location.longitude },
              deviceId,
              location,
              status,
            })}
          />
        );
      })}

      {/* Info Window */}
      {infoWindow && (
        <InfoWindow
          position={infoWindow.position}
          onCloseClick={() => setInfoWindow(null)}
        >
          <div className="p-2 min-w-[180px]">
            <h3 className="font-semibold text-sm mb-2">{infoWindow.deviceId}</h3>
            <div className="text-xs space-y-1 text-gray-600">
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className={
                  infoWindow.status === 'compliant' ? 'text-green-600' :
                  infoWindow.status === 'violation' ? 'text-red-600' : 'text-gray-500'
                }>
                  {getStatusLabel(infoWindow.status)}
                </span>
              </p>
              <p>
                <span className="font-medium">Position:</span>{' '}
                {infoWindow.location.latitude.toFixed(6)}, {infoWindow.location.longitude.toFixed(6)}
              </p>
              <p>
                <span className="font-medium">Last Update:</span>{' '}
                {new Date(infoWindow.location.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};
